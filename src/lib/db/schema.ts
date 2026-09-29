import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  integer,
  timestamp,
  jsonb,
  customType,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer | Uint8Array }>({
  dataType: () => "bytea",
  fromDriver: (v) => (Buffer.isBuffer(v) ? v : Buffer.from(v)),
});

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
const created = () => ts("created_at").notNull().defaultNow();
const updated = () => ts("updated_at").notNull().defaultNow();

/* ---------------------------------- Admin --------------------------------- */

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  // TOTP secret encrypted with AUTH_SECRET-derived key (AES-256-GCM).
  totpSecretEnc: text("totp_secret_enc"),
  totpEnabled: boolean("totp_enabled").notNull().default(false),
  // Incremented to invalidate all existing sessions (logout everywhere, password change).
  sessionVersion: integer("session_version").notNull().default(1),
  failedLogins: integer("failed_logins").notNull().default(0),
  lockedUntil: ts("locked_until"),
  lastLoginAt: ts("last_login_at"),
  createdAt: created(),
  updatedAt: updated(),
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actor: varchar("actor", { length: 254 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    entity: varchar("entity", { length: 60 }),
    entityId: varchar("entity_id", { length: 100 }),
    details: text("details"),
    createdAt: created(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);

/* --------------------------------- Content -------------------------------- */

/** Key/value JSON store for editable page content and settings. */
export const siteContent = pgTable("site_content", {
  key: varchar("key", { length: 60 }).primaryKey(),
  value: jsonb("value").notNull(),
  needsReview: boolean("needs_review").notNull().default(false),
  updatedAt: updated(),
});

export const images = pgTable("images", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: varchar("filename", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 60 }).notNull(),
  size: integer("size").notNull(),
  data: bytea("data").notNull(),
  alt: varchar("alt", { length: 300 }).notNull().default(""),
  createdAt: created(),
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 150 }).notNull(),
  summary: text("summary").notNull(),
  body: text("body").notNull().default(""),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  icon: varchar("icon", { length: 40 }).notNull().default("code"),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  needsReview: boolean("needs_review").notNull().default(false),
  createdAt: created(),
  updatedAt: updated(),
});

export const caseStudyStatus = ["draft", "published", "archived"] as const;
export type CaseStudyStatus = (typeof caseStudyStatus)[number];

export const caseStudies = pgTable(
  "case_studies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    title: varchar("title", { length: 200 }).notNull(),
    summary: text("summary").notNull(),
    coverImageId: uuid("cover_image_id").references(() => images.id, { onDelete: "set null" }),
    clientContext: text("client_context").notNull().default(""),
    challenge: text("challenge").notNull().default(""),
    solution: text("solution").notNull().default(""),
    features: jsonb("features").$type<string[]>().notNull().default([]),
    technology: text("technology").notNull().default(""),
    outcome: text("outcome").notNull().default(""),
    body: text("body").notNull().default(""),
    status: varchar("status", { length: 20 }).$type<CaseStudyStatus>().notNull().default("draft"),
    needsReview: boolean("needs_review").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    publishedAt: ts("published_at"),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [index("case_studies_status_idx").on(t.status)],
);

export const caseStudyImages = pgTable("case_study_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  caseStudyId: uuid("case_study_id")
    .notNull()
    .references(() => caseStudies.id, { onDelete: "cascade" }),
  imageId: uuid("image_id")
    .notNull()
    .references(() => images.id, { onDelete: "cascade" }),
  caption: varchar("caption", { length: 300 }).notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: created(),
});

/* ---------------------------------- Leads --------------------------------- */

export const inquiryStatus = ["new", "contacted", "in_progress", "closed"] as const;
export type InquiryStatus = (typeof inquiryStatus)[number];

export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 254 }),
    phone: varchar("phone", { length: 40 }),
    message: text("message").notNull(),
    status: varchar("status", { length: 20 }).$type<InquiryStatus>().notNull().default("new"),
    adminNotes: text("admin_notes").notNull().default(""),
    privacyAckAt: ts("privacy_ack_at").notNull(),
    privacyNoticeVersion: varchar("privacy_notice_version", { length: 40 }).notNull(),
    emailSentAt: ts("email_sent_at"),
    emailError: text("email_error"),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [index("inquiries_created_idx").on(t.createdAt), index("inquiries_status_idx").on(t.status)],
);

export const bookingStatus = ["confirmed", "cancelled"] as const;
export type BookingStatus = (typeof bookingStatus)[number];

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    phone: varchar("phone", { length: 40 }).notNull(),
    topic: text("topic").notNull().default(""),
    startAt: ts("start_at").notNull(),
    endAt: ts("end_at").notNull(),
    status: varchar("status", { length: 20 }).$type<BookingStatus>().notNull().default("confirmed"),
    googleEventId: varchar("google_event_id", { length: 255 }),
    googleEventLink: text("google_event_link"),
    manageTokenHash: varchar("manage_token_hash", { length: 64 }).notNull(),
    rescheduleCount: integer("reschedule_count").notNull().default(0),
    privacyAckAt: ts("privacy_ack_at").notNull(),
    privacyNoticeVersion: varchar("privacy_notice_version", { length: 40 }).notNull(),
    cancelledAt: ts("cancelled_at"),
    cancelledBy: varchar("cancelled_by", { length: 20 }),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [
    index("bookings_start_idx").on(t.startAt),
    uniqueIndex("bookings_token_idx").on(t.manageTokenHash),
  ],
);

/* --------------------------------- Chatbot -------------------------------- */

export const knowledgeCategories = ["faq", "company", "service", "case_study", "general"] as const;
export type KnowledgeCategory = (typeof knowledgeCategories)[number];

export const knowledgeEntries = pgTable("knowledge_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: varchar("category", { length: 20 }).$type<KnowledgeCategory>().notNull().default("faq"),
  question: varchar("question", { length: 300 }).notNull(),
  answer: text("answer").notNull(),
  keywords: varchar("keywords", { length: 500 }).notNull().default(""),
  enabled: boolean("enabled").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: created(),
  updatedAt: updated(),
});

export const conversationStatus = ["open", "reviewed", "resolved"] as const;
export type ConversationStatus = (typeof conversationStatus)[number];

export const chatConversations = pgTable(
  "chat_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Random, client-held identifier; lets a visitor continue their own conversation only.
    sessionId: varchar("session_id", { length: 64 }).notNull().unique(),
    visitorName: varchar("visitor_name", { length: 120 }),
    visitorContact: varchar("visitor_contact", { length: 254 }),
    status: varchar("status", { length: 20 }).$type<ConversationStatus>().notNull().default("open"),
    isLead: boolean("is_lead").notNull().default(false),
    messageCount: integer("message_count").notNull().default(0),
    lastMessageAt: ts("last_message_at").notNull().defaultNow(),
    createdAt: created(),
  },
  (t) => [index("chat_conv_created_idx").on(t.createdAt)],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => chatConversations.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 12 }).$type<"user" | "assistant">().notNull(),
    content: text("content").notNull(),
    provider: varchar("provider", { length: 40 }),
    createdAt: created(),
  },
  (t) => [index("chat_msg_conv_idx").on(t.conversationId)],
);

/* ------------------------------- Rate limits ------------------------------ */

export const rateLimits = pgTable("rate_limits", {
  key: varchar("key", { length: 200 }).primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: ts("window_start").notNull().defaultNow(),
});
