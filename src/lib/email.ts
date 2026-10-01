import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { log } from "./logger";

export type Email = {
  to: string | string[];
  subject: string;
  text: string;
  replyTo?: string;
};

/**
 * Provider-agnostic email sender.
 * EMAIL_TRANSPORT=smtp    -> SMTP (e.g. Google Workspace smtp.gmail.com with an App Password)
 * EMAIL_TRANSPORT=console -> logs a redacted summary instead of sending (default without SMTP_HOST)
 */
let transporter: Transporter | null = null;

// Values pasted into hosting dashboards often carry stray spaces or different casing.
const env = (key: string) => process.env[key]?.trim() || undefined;

function smtpConfig() {
  return {
    host: env("SMTP_HOST"),
    port: Number(env("SMTP_PORT") ?? 587),
    user: env("SMTP_USER"),
    // Google shows App Passwords in groups of four ("abcd efgh ijkl mnop"); the spaces are not part of it.
    pass: env("SMTP_PASSWORD")?.replace(/\s+/g, ""),
  };
}

function transportMode() {
  return (env("EMAIL_TRANSPORT") ?? (env("SMTP_HOST") ? "smtp" : "console")).toLowerCase();
}

function getTransporter() {
  if (!transporter) {
    const c = smtpConfig();
    transporter = nodemailer.createTransport({
      host: c.host,
      port: c.port,
      secure: c.port === 465,
      auth: c.user ? { user: c.user, pass: c.pass } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return transporter;
}

export function isEmailConfigured() {
  return transportMode() === "smtp" && !!env("SMTP_HOST");
}

/** Which email settings are present (never their values), for the admin dashboard. */
export function emailSettingsStatus() {
  const c = smtpConfig();
  const missing = [
    transportMode() !== "smtp" && "EMAIL_TRANSPORT=smtp",
    !c.host && "SMTP_HOST",
    !c.user && "SMTP_USER",
    !c.pass && "SMTP_PASSWORD",
  ].filter(Boolean) as string[];
  return { mode: transportMode(), missing, from: env("EMAIL_FROM") ?? "Auryx Software <info@auryx.net>", user: c.user };
}

export async function sendEmail(email: Email) {
  const from = env("EMAIL_FROM") ?? "Auryx Software <info@auryx.net>";
  if (transportMode() !== "smtp") {
    log.info("email.console", {
      subject: email.subject,
      recipients: Array.isArray(email.to) ? email.to.length : 1,
    });
    if (process.env.NODE_ENV !== "production" && process.env.EMAIL_DEBUG === "1") {
      console.log(`\n--- EMAIL (dev) ---\nTo: ${email.to}\nSubject: ${email.subject}\n\n${email.text}\n-------------------\n`);
    }
    return;
  }
  await getTransporter().sendMail({
    from,
    to: email.to,
    replyTo: email.replyTo,
    subject: email.subject,
    text: email.text,
  });
}

/** Turns SMTP errors into guidance an admin can act on (never includes the password). */
export function explainEmailError(err: unknown) {
  const e = err as { code?: string; responseCode?: number; response?: string; message?: string };
  const raw = (e.response ?? e.message ?? String(err)).slice(0, 300);
  if (e.code === "EAUTH" || e.responseCode === 535 || e.responseCode === 534) {
    return `Google rejected the sign-in. Check that SMTP_USER is the mailbox the App Password was created for, and that SMTP_PASSWORD is that 16-character App Password (not the normal password). Details: ${raw}`;
  }
  if (e.code === "EENVELOPE" || e.responseCode === 553 || e.responseCode === 550) {
    return `The sender address was refused. Set EMAIL_FROM to the SMTP_USER mailbox, or add it as a "Send mail as" address in Gmail. Details: ${raw}`;
  }
  if (e.code === "ETIMEDOUT" || e.code === "ECONNECTION" || e.code === "ESOCKET") {
    return `Could not connect to the email server. Check SMTP_HOST (smtp.gmail.com) and SMTP_PORT (587). Details: ${raw}`;
  }
  return raw;
}

/** Strips CR/LF so user input can never inject extra headers into subjects. */
export function headerSafe(value: string, max = 120) {
  return value.replace(/[\r\n]+/g, " ").slice(0, max);
}
