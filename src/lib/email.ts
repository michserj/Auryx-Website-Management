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
 * EMAIL_TRANSPORT=smtp    -> SMTP (e.g. Google Workspace smtp-relay / smtp.gmail.com with an app password)
 * EMAIL_TRANSPORT=console -> logs a redacted summary instead of sending (default outside production)
 */
let transporter: Transporter | null = null;

function transportMode() {
  return process.env.EMAIL_TRANSPORT ?? (process.env.SMTP_HOST ? "smtp" : "console");
}

function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    });
  }
  return transporter;
}

export function isEmailConfigured() {
  return transportMode() === "smtp" && !!process.env.SMTP_HOST;
}

export async function sendEmail(email: Email) {
  const from = process.env.EMAIL_FROM ?? "Auryx Software <info@auryx.net>";
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

/** Strips CR/LF so user input can never inject extra headers into subjects. */
export function headerSafe(value: string, max = 120) {
  return value.replace(/[\r\n]+/g, " ").slice(0, max);
}
