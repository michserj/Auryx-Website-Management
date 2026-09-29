import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "./db";
import {
  DEFAULT_ABOUT,
  DEFAULT_HOME,
  DEFAULT_PRIVACY,
  DEFAULT_SITE,
  type AboutContent,
  type HomeContent,
  type PrivacyContent,
  type SiteSettings,
} from "./content-defaults";

/* --------------------------- Typed settings shapes -------------------------- */

export const bookingSettingsSchema = z.object({
  enabled: z.boolean(),
  timezone: z.string().min(1),
  workDays: z.array(z.number().int().min(0).max(6)).min(1), // 0 = Sunday
  dayStart: z.string().regex(/^\d{2}:\d{2}$/),
  dayEnd: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().int().min(15).max(240),
  bufferMinutes: z.number().int().min(0).max(120),
  minNoticeHours: z.number().int().min(0).max(24 * 14),
  maxDaysAhead: z.number().int().min(1).max(180),
  // Visitors may cancel/reschedule until this many hours before the start.
  changeCutoffHours: z.number().int().min(0).max(168),
  notifyEmails: z.array(z.email()).min(1),
  // Adds a Google Meet link to the calendar event. Confirm with Auryx whether
  // consultations are online, in person, or either.
  addVideoLink: z.boolean(),
});
export type BookingSettings = z.infer<typeof bookingSettingsSchema>;

export const retentionSettingsSchema = z.object({
  chatMonths: z.number().int().min(1).max(120),
  inquiryMonths: z.number().int().min(1).max(120),
  bookingMonths: z.number().int().min(1).max(120),
});
export type RetentionSettings = z.infer<typeof retentionSettingsSchema>;

export const chatbotSettingsSchema = z.object({
  enabled: z.boolean(),
  greeting: z.string().min(1).max(500),
});
export type ChatbotSettings = z.infer<typeof chatbotSettingsSchema>;

// Business defaults from the BA. Duration/buffer/notice are PRD-level decisions
// left configurable; the values below are sensible starting points for review.
export const DEFAULT_BOOKING: BookingSettings = {
  enabled: true,
  timezone: "Asia/Manila",
  workDays: [1, 2, 3, 4, 5],
  dayStart: "08:00",
  dayEnd: "17:00",
  durationMinutes: 30,
  bufferMinutes: 15,
  minNoticeHours: 24,
  maxDaysAhead: 30,
  changeCutoffHours: 12,
  notifyEmails: ["knut.bentzrod@auryx.net", "mich.sergio@auryx.net"],
  addVideoLink: true,
};

export const DEFAULT_RETENTION: RetentionSettings = {
  chatMonths: 6,
  inquiryMonths: 12,
  bookingMonths: 12,
};

export const DEFAULT_CHATBOT: ChatbotSettings = {
  enabled: true,
  greeting:
    "Hi! I'm the Auryx assistant, an AI, not a person. I can answer questions about Auryx and our services, or help you get in touch with the team.",
};

type Registry = {
  site: SiteSettings;
  home: HomeContent;
  about: AboutContent;
  privacy: PrivacyContent;
  booking: BookingSettings;
  retention: RetentionSettings;
  chatbot: ChatbotSettings;
};

export const DEFAULTS: Registry = {
  site: DEFAULT_SITE,
  home: DEFAULT_HOME,
  about: DEFAULT_ABOUT,
  privacy: DEFAULT_PRIVACY,
  booking: DEFAULT_BOOKING,
  retention: DEFAULT_RETENTION,
  chatbot: DEFAULT_CHATBOT,
};

export type ContentKey = keyof Registry;

/** Reads a content/settings document, merged over defaults so new fields are always present. */
export async function getContent<K extends ContentKey>(key: K): Promise<Registry[K]> {
  try {
    const db = await getDb();
    const [row] = await db.select().from(schema.siteContent).where(eq(schema.siteContent.key, key));
    if (row) return { ...DEFAULTS[key], ...(row.value as object) } as Registry[K];
  } catch (err) {
    console.error(`[settings] failed to load "${key}", using defaults`, err);
  }
  return DEFAULTS[key];
}

export async function getContentMeta(key: ContentKey) {
  const db = await getDb();
  const [row] = await db.select().from(schema.siteContent).where(eq(schema.siteContent.key, key));
  return { needsReview: row?.needsReview ?? false, updatedAt: row?.updatedAt ?? null };
}

export async function setContent<K extends ContentKey>(
  key: K,
  value: Registry[K],
  opts: { needsReview?: boolean } = {},
) {
  const db = await getDb();
  await db
    .insert(schema.siteContent)
    .values({ key, value, needsReview: opts.needsReview ?? false })
    .onConflictDoUpdate({
      target: schema.siteContent.key,
      set: { value, needsReview: opts.needsReview ?? false, updatedAt: new Date() },
    });
}
