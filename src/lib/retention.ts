import "server-only";
import { lt, sql } from "drizzle-orm";
import { getDb, schema } from "./db";
import { getContent } from "./settings";
import { log } from "./logger";

function monthsAgo(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
}

/**
 * Deletes records older than the configured retention periods.
 * - Chat conversations: by last activity (messages cascade)
 * - Inquiries: by submission date
 * - Bookings: by consultation end time (upcoming bookings are never purged)
 * Runs via /api/cron/retention (scheduled) and opportunistically from the admin dashboard.
 */
export async function runRetention() {
  const r = await getContent("retention");
  const db = await getDb();
  const chats = await db
    .delete(schema.chatConversations)
    .where(lt(schema.chatConversations.lastMessageAt, monthsAgo(r.chatMonths)))
    .returning({ id: schema.chatConversations.id });
  const inquiries = await db
    .delete(schema.inquiries)
    .where(lt(schema.inquiries.createdAt, monthsAgo(r.inquiryMonths)))
    .returning({ id: schema.inquiries.id });
  const bookings = await db
    .delete(schema.bookings)
    .where(lt(schema.bookings.endAt, monthsAgo(r.bookingMonths)))
    .returning({ id: schema.bookings.id });
  await db.delete(schema.rateLimits).where(lt(schema.rateLimits.windowStart, sql`now() - interval '2 days'`));
  await db.delete(schema.auditLog).where(lt(schema.auditLog.createdAt, monthsAgo(24)));

  const summary = { chats: chats.length, inquiries: inquiries.length, bookings: bookings.length };
  log.info("retention.run", summary);
  return summary;
}
