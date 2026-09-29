import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "./db";
import { getContent } from "./settings";
import { headerSafe, sendEmail } from "./email";
import { log } from "./logger";
import { siteUrl } from "./site-url";

type NewInquiry = { name: string; message: string; email?: string; phone?: string };

export const INQUIRY_STATUS_LABEL: Record<(typeof schema.inquiryStatus)[number], string> = {
  new: "New",
  contacted: "Contacted",
  in_progress: "In Progress",
  closed: "Closed",
};

/** Stores the inquiry (source of truth) and then emails it to the configured inbox. */
export async function createInquiry(input: NewInquiry) {
  const db = await getDb();
  const [privacy, site] = await Promise.all([getContent("privacy"), getContent("site")]);
  const [row] = await db
    .insert(schema.inquiries)
    .values({
      name: input.name,
      message: input.message,
      email: input.email ?? null,
      phone: input.phone ?? null,
      status: "new",
      privacyAckAt: new Date(),
      privacyNoticeVersion: privacy.version,
    })
    .returning({ id: schema.inquiries.id });

  try {
    await sendEmail({
      to: site.contactEmail,
      replyTo: input.email,
      subject: headerSafe(`New website inquiry from ${input.name}`),
      text: [
        `A new message was sent through the Auryx website.`,
        ``,
        `Name: ${input.name}`,
        `Email: ${input.email ?? "Not provided"}`,
        `Contact number: ${input.phone ?? "Not provided"}`,
        ``,
        `Message:`,
        input.message,
        ``,
        `View and update status: ${siteUrl(`/admin/inquiries/${row.id}`)}`,
      ].join("\n"),
    });
    await db.update(schema.inquiries).set({ emailSentAt: new Date() }).where(eq(schema.inquiries.id, row.id));
  } catch (err) {
    // The inquiry is safely stored and visible in Admin even if email delivery fails.
    log.error("inquiry.email_failed", { inquiryId: row.id }, err);
    await db
      .update(schema.inquiries)
      .set({ emailError: err instanceof Error ? err.message.slice(0, 500) : "unknown error" })
      .where(eq(schema.inquiries.id, row.id));
  }
  return row.id;
}
