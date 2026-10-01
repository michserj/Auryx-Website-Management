"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { Secret } from "otpauth";
import { hashPassword, logout, requireAdmin, totpFor } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getDb, schema } from "@/lib/db";
import { runRetention } from "@/lib/retention";
import { explainEmailError, isEmailConfigured, sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/security";
import { decrypt, encrypt } from "@/lib/security";
import {
  bookingSettingsSchema,
  chatbotSettingsSchema,
  retentionSettingsSchema,
  setContent,
} from "@/lib/settings";
import { fieldErrors } from "@/lib/validation";
import { passwordProblem } from "@/lib/password-policy";
import type { ActionResult } from "@/components/admin/ActionForm";

export async function saveBookingSettings(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = bookingSettingsSchema.safeParse({
    enabled: fd.get("enabled") === "on",
    timezone: fd.get("timezone"),
    workDays: fd.getAll("workDays").map(Number),
    dayStart: fd.get("dayStart"),
    dayEnd: fd.get("dayEnd"),
    durationMinutes: Number(fd.get("durationMinutes")),
    bufferMinutes: Number(fd.get("bufferMinutes")),
    minNoticeHours: Number(fd.get("minNoticeHours")),
    maxDaysAhead: Number(fd.get("maxDaysAhead")),
    changeCutoffHours: Number(fd.get("changeCutoffHours")),
    notifyEmails: String(fd.get("notifyEmails") ?? "")
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
    addVideoLink: fd.get("addVideoLink") === "on",
  });
  if (!parsed.success) return { ok: false, message: "Please fix the errors below.", errors: fieldErrors(parsed.error) };
  if (parsed.data.dayStart >= parsed.data.dayEnd) return { ok: false, message: "Start time must be before end time." };
  try {
    new Intl.DateTimeFormat("en", { timeZone: parsed.data.timezone });
  } catch {
    return { ok: false, message: "Unknown time zone." };
  }
  await setContent("booking", parsed.data);
  await audit(admin.email, "settings.booking");
  revalidatePath("/", "layout");
  return { ok: true, message: "Booking settings saved." };
}

export async function saveRetentionSettings(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = retentionSettingsSchema.safeParse({
    chatMonths: Number(fd.get("chatMonths")),
    inquiryMonths: Number(fd.get("inquiryMonths")),
    bookingMonths: Number(fd.get("bookingMonths")),
  });
  if (!parsed.success) return { ok: false, message: "Please fix the errors below.", errors: fieldErrors(parsed.error) };
  await setContent("retention", parsed.data);
  await audit(admin.email, "settings.retention", undefined, undefined, JSON.stringify(parsed.data));
  revalidatePath("/", "layout");
  return { ok: true, message: "Retention settings saved. Remember to keep the Privacy Notice consistent." };
}

export async function runRetentionNow(): Promise<ActionResult> {
  const admin = await requireAdmin();
  const r = await runRetention();
  await audit(admin.email, "retention.manual_run", undefined, undefined, JSON.stringify(r));
  return { ok: true, message: `Deleted ${r.chats} conversation(s), ${r.inquiries} inquiry(ies), ${r.bookings} booking(s).` };
}

export async function saveChatbotSettings(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = chatbotSettingsSchema.safeParse({ enabled: fd.get("enabled") === "on", greeting: fd.get("greeting") });
  if (!parsed.success) return { ok: false, message: "Please fix the errors below.", errors: fieldErrors(parsed.error) };
  await setContent("chatbot", parsed.data);
  await audit(admin.email, "settings.chatbot", undefined, undefined, `enabled=${parsed.data.enabled}`);
  revalidatePath("/", "layout");
  return { ok: true, message: "Chatbot settings saved." };
}

/* -------------------------------- Security -------------------------------- */

export async function changePassword(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const problem = passwordProblem(next);
  if (problem) return { ok: false, message: problem };
  if (next !== String(fd.get("confirm") ?? "")) return { ok: false, message: "The new passwords don't match." };
  const db = await getDb();
  const [user] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, admin.id));
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) return { ok: false, message: "Current password is incorrect." };
  await db
    .update(schema.adminUsers)
    .set({ passwordHash: await hashPassword(next), sessionVersion: sql`${schema.adminUsers.sessionVersion} + 1`, updatedAt: new Date() })
    .where(eq(schema.adminUsers.id, admin.id));
  await audit(admin.email, "security.password_changed");
  await logout();
  redirect("/admin/login");
}

export async function beginMfaSetup(): Promise<ActionResult> {
  const admin = await requireAdmin();
  const secret = new Secret({ size: 20 }).base32;
  const db = await getDb();
  await db
    .update(schema.adminUsers)
    .set({ totpSecretEnc: encrypt(secret), totpEnabled: false })
    .where(eq(schema.adminUsers.id, admin.id));
  revalidatePath("/admin/settings");
  return { ok: true, message: "Scan the QR code below, then enter a code to confirm." };
}

export async function confirmMfa(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const code = String(fd.get("code") ?? "").replace(/\s/g, "");
  const db = await getDb();
  const [user] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, admin.id));
  if (!user?.totpSecretEnc) return { ok: false, message: "Start the setup first." };
  if (totpFor(decrypt(user.totpSecretEnc), user.email).validate({ token: code, window: 1 }) === null) {
    return { ok: false, message: "That code didn't match. Check your device's time and try again." };
  }
  await db.update(schema.adminUsers).set({ totpEnabled: true }).where(eq(schema.adminUsers.id, admin.id));
  await audit(admin.email, "security.mfa_enabled");
  revalidatePath("/admin/settings");
  return { ok: true, message: "Two-factor authentication is now enabled." };
}

export async function disableMfa(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const db = await getDb();
  const [user] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, admin.id));
  if (!user || !(await bcrypt.compare(String(fd.get("password") ?? ""), user.passwordHash))) {
    return { ok: false, message: "Password is incorrect." };
  }
  await db.update(schema.adminUsers).set({ totpEnabled: false, totpSecretEnc: null }).where(eq(schema.adminUsers.id, admin.id));
  await audit(admin.email, "security.mfa_disabled");
  revalidatePath("/admin/settings");
  return { ok: true, message: "Two-factor authentication disabled." };
}

export async function signOutEverywhere(): Promise<ActionResult> {
  const admin = await requireAdmin();
  const db = await getDb();
  await db
    .update(schema.adminUsers)
    .set({ sessionVersion: sql`${schema.adminUsers.sessionVersion} + 1` })
    .where(eq(schema.adminUsers.id, admin.id));
  await audit(admin.email, "security.sign_out_everywhere");
  await logout();
  redirect("/admin/login");
}

export async function sendTestEmail(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const to = String(fd.get("to") ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return { ok: false, message: "Enter a valid email address." };
  if (!isEmailConfigured()) {
    return { ok: false, message: "Email sending is not switched on. Check the missing settings listed above, then redeploy." };
  }
  if (!(await rateLimit("test-email", 10, 3600))) return { ok: false, message: "Too many test emails. Try again later." };
  try {
    await sendEmail({
      to,
      subject: "Auryx website: test email",
      text: "This is a test email from the Auryx website admin. If you can read this, email delivery is working.",
    });
  } catch (err) {
    await audit(admin.email, "email.test_failed");
    return { ok: false, message: explainEmailError(err) };
  }
  await audit(admin.email, "email.test_sent");
  return { ok: true, message: `Sent to ${to}. Check the inbox (and Spam).` };
}
