import "server-only";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { getDb, schema } from "../db";
import { getContent, type BookingSettings } from "../settings";
import { sendEmail, headerSafe } from "../email";
import { log } from "../logger";
import { randomToken, sha256 } from "../security";
import { siteUrl } from "../site-url";
import { getCalendar } from "./calendar";
import {
  addDays,
  bookableRange,
  dateInTz,
  formatInTz,
  generateSlots,
  isSlotAvailable,
  zonedToUtc,
  type Interval,
} from "./time";

export class BookingError extends Error {
  constructor(
    message: string,
    public code: "unavailable" | "not_found" | "too_late" | "cancelled" | "disabled" | "calendar",
  ) {
    super(message);
  }
}

type Db = Awaited<ReturnType<typeof getDb>>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

async function busyIntervals(range: Interval, excludeBookingId?: string, exec?: Db | Tx): Promise<Interval[]> {
  const db = exec ?? (await getDb());
  const rows = await db
    .select({ id: schema.bookings.id, start: schema.bookings.startAt, end: schema.bookings.endAt })
    .from(schema.bookings)
    .where(
      and(
        eq(schema.bookings.status, "confirmed"),
        lt(schema.bookings.startAt, range.end),
        gt(schema.bookings.endAt, range.start),
      ),
    );
  const local = rows.filter((r) => r.id !== excludeBookingId);
  // Google busy times include our own events; when rescheduling, ignore the booking's current slot.
  const excluded = rows.find((r) => r.id === excludeBookingId);
  const google = (await getCalendar().getBusy(range)).filter(
    (b) => !(excluded && b.start.getTime() === excluded.start.getTime() && b.end.getTime() === excluded.end.getTime()),
  );
  return [...local, ...google];
}

function dayRange(date: string, s: BookingSettings): Interval {
  // Pad by a day either side to catch buffers and all-day events.
  return {
    start: zonedToUtc(addDays(date, -1), "00:00", s.timezone),
    end: zonedToUtc(addDays(date, 2), "00:00", s.timezone),
  };
}

export async function getAvailability(date: string, excludeBookingId?: string) {
  const settings = await getContent("booking");
  if (!settings.enabled) throw new BookingError("Online booking is currently unavailable.", "disabled");
  const now = new Date();
  const busy = await busyIntervals(dayRange(date, settings), excludeBookingId);
  return {
    settings,
    range: bookableRange(settings, now),
    slots: generateSlots(date, settings, now, busy),
  };
}

/** Serializes booking writes so two visitors cannot take the same slot. */
async function withBookingLock<T>(fn: (tx: Tx) => Promise<T>) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(84210391)`);
    return fn(tx);
  });
}

type NewBooking = { start: Date; name: string; email: string; phone: string; topic: string; privacyVersion: string };

export async function createBooking(input: NewBooking) {
  const settings = await getContent("booking");
  if (!settings.enabled) throw new BookingError("Online booking is currently unavailable.", "disabled");
  const end = new Date(input.start.getTime() + settings.durationMinutes * 60_000);
  const token = randomToken();

  const booking = await withBookingLock(async (tx) => {
    const busy = await busyIntervals(dayRange(dateInTz(input.start, settings.timezone), settings), undefined, tx);
    if (!isSlotAvailable(input.start, settings, new Date(), busy)) {
      throw new BookingError("Sorry, that time is no longer available. Please choose another slot.", "unavailable");
    }
    const [row] = await tx
      .insert(schema.bookings)
      .values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        topic: input.topic,
        startAt: input.start,
        endAt: end,
        manageTokenHash: sha256(token),
        privacyAckAt: new Date(),
        privacyNoticeVersion: input.privacyVersion,
      })
      .returning();
    return row;
  });

  // Create the Google Calendar event (Google also emails invitations to all attendees).
  try {
    const event = await getCalendar().createEvent({
      summary: `Auryx consultation, ${headerSafe(input.name, 80)}`,
      description: [
        `Consultation booked via auryx.net`,
        ``,
        `Name: ${input.name}`,
        `Email: ${input.email}`,
        `Phone: ${input.phone}`,
        input.topic ? `\nTopic:\n${input.topic}` : "",
        ``,
        `Manage (visitor link): ${siteUrl(`/consultation/manage/${token}`)}`,
      ].join("\n"),
      start: input.start,
      end,
      timezone: settings.timezone,
      attendees: [...settings.notifyEmails, input.email],
      addVideoLink: settings.addVideoLink,
    });
    if (event) {
      const db = await getDb();
      await db
        .update(schema.bookings)
        .set({ googleEventId: event.id, googleEventLink: event.link })
        .where(eq(schema.bookings.id, booking.id));
    }
  } catch (err) {
    log.error("booking.calendar_create_failed", { bookingId: booking.id }, err);
    const db = await getDb();
    await db.delete(schema.bookings).where(eq(schema.bookings.id, booking.id));
    throw new BookingError("We couldn't reach our calendar just now. Please try again shortly.", "calendar");
  }

  await notify("created", { ...booking, endAt: end }, settings, token);
  return { booking, token };
}

export async function findByToken(token: string) {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(schema.bookings)
    .where(eq(schema.bookings.manageTokenHash, sha256(token)));
  return row ?? null;
}

function assertChangeable(b: typeof schema.bookings.$inferSelect, s: BookingSettings) {
  if (b.status === "cancelled") throw new BookingError("This consultation has already been cancelled.", "cancelled");
  if (b.startAt.getTime() - Date.now() < s.changeCutoffHours * 3600_000) {
    throw new BookingError(
      `Consultations can be changed online up to ${s.changeCutoffHours} hours before the start time. Please contact us directly.`,
      "too_late",
    );
  }
}

export async function cancelBooking(id: string, by: "visitor" | "admin") {
  const settings = await getContent("booking");
  const db = await getDb();
  const [b] = await db.select().from(schema.bookings).where(eq(schema.bookings.id, id));
  if (!b) throw new BookingError("Booking not found.", "not_found");
  if (by === "visitor") assertChangeable(b, settings);
  if (b.status === "cancelled") return b;

  if (b.googleEventId) {
    try {
      await getCalendar().cancelEvent(b.googleEventId);
    } catch (err) {
      log.error("booking.calendar_cancel_failed", { bookingId: b.id }, err);
      throw new BookingError("We couldn't update our calendar just now. Please try again shortly.", "calendar");
    }
  }
  const [updated] = await db
    .update(schema.bookings)
    .set({ status: "cancelled", cancelledAt: new Date(), cancelledBy: by, updatedAt: new Date() })
    .where(eq(schema.bookings.id, id))
    .returning();
  await notify("cancelled", updated, settings);
  return updated;
}

export async function rescheduleBooking(id: string, newStart: Date) {
  const settings = await getContent("booking");
  const db = await getDb();
  const [b] = await db.select().from(schema.bookings).where(eq(schema.bookings.id, id));
  if (!b) throw new BookingError("Booking not found.", "not_found");
  assertChangeable(b, settings);
  const newEnd = new Date(newStart.getTime() + settings.durationMinutes * 60_000);

  const updated = await withBookingLock(async (tx) => {
    const busy = await busyIntervals(dayRange(dateInTz(newStart, settings.timezone), settings), b.id, tx);
    if (!isSlotAvailable(newStart, settings, new Date(), busy)) {
      throw new BookingError("Sorry, that time is no longer available. Please choose another slot.", "unavailable");
    }
    if (b.googleEventId) {
      try {
        await getCalendar().updateEventTime(b.googleEventId, newStart, newEnd, settings.timezone);
      } catch (err) {
        log.error("booking.calendar_update_failed", { bookingId: b.id }, err);
        throw new BookingError("We couldn't update our calendar just now. Please try again shortly.", "calendar");
      }
    }
    const [row] = await tx
      .update(schema.bookings)
      .set({ startAt: newStart, endAt: newEnd, rescheduleCount: b.rescheduleCount + 1, updatedAt: new Date() })
      .where(eq(schema.bookings.id, b.id))
      .returning();
    return row;
  });
  await notify("rescheduled", updated, settings);
  return updated;
}

/**
 * Pulls changes made directly in Google Calendar (by authorized Auryx users)
 * back into the booking records. Called when an admin views bookings.
 */
export async function syncFromCalendar(rows: (typeof schema.bookings.$inferSelect)[]) {
  const cal = getCalendar();
  if (cal.name !== "google") return;
  const db = await getDb();
  await Promise.all(
    rows
      .filter((b) => b.status === "confirmed" && b.googleEventId && b.endAt > new Date())
      .map(async (b) => {
        try {
          const ev = await cal.getEvent(b.googleEventId!);
          if (!ev) return;
          if (ev.cancelled) {
            await db
              .update(schema.bookings)
              .set({ status: "cancelled", cancelledAt: new Date(), cancelledBy: "calendar", updatedAt: new Date() })
              .where(eq(schema.bookings.id, b.id));
          } else if (ev.start && ev.end && (ev.start.getTime() !== b.startAt.getTime() || ev.end.getTime() !== b.endAt.getTime())) {
            await db
              .update(schema.bookings)
              .set({ startAt: ev.start, endAt: ev.end, updatedAt: new Date() })
              .where(eq(schema.bookings.id, b.id));
          }
        } catch (err) {
          log.warn("booking.sync_failed", { bookingId: b.id }, err);
        }
      }),
  );
}

async function notify(
  kind: "created" | "cancelled" | "rescheduled",
  b: typeof schema.bookings.$inferSelect,
  s: BookingSettings,
  token?: string,
) {
  const when = `${formatInTz(b.startAt, s.timezone)} (Philippine time)`;
  const manage = token ? siteUrl(`/consultation/manage/${token}`) : null;
  const verb = { created: "confirmed", cancelled: "cancelled", rescheduled: "rescheduled" }[kind];

  const visitorText = [
    `Hi ${b.name},`,
    ``,
    kind === "cancelled"
      ? `Your consultation with Auryx Software on ${when} has been cancelled.`
      : `Your consultation with Auryx Software is ${verb} for ${when}. Duration: ${s.durationMinutes} minutes.`,
    kind === "created" && getCalendar().name === "google"
      ? `You will also receive a Google Calendar invitation with the meeting details.`
      : "",
    manage ? `\nNeed to reschedule or cancel? Use this private link:\n${manage}` : "",
    kind !== "created" && kind !== "cancelled" ? `\nYou can keep using the link from your original confirmation email to make further changes.` : "",
    ``,
    `If you have questions, reply to this email or contact info@auryx.net.`,
    ``,
    `Auryx Software`,
    `The Silent Force Behind Smarter Software.`,
  ]
    .filter((l) => l !== "")
    .join("\n");

  const teamText = [
    `Consultation ${verb}.`,
    ``,
    `When: ${when}`,
    `Name: ${b.name}`,
    `Email: ${b.email}`,
    `Phone: ${b.phone}`,
    b.topic ? `Topic: ${b.topic}` : "",
    b.cancelledBy ? `Cancelled by: ${b.cancelledBy}` : "",
    ``,
    `Admin: ${siteUrl("/admin/bookings")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const results = await Promise.allSettled([
    sendEmail({ to: b.email, subject: `Your Auryx consultation is ${verb}`, text: visitorText, replyTo: "info@auryx.net" }),
    sendEmail({
      to: s.notifyEmails,
      subject: headerSafe(`Consultation ${verb}: ${b.name}`),
      text: teamText,
      replyTo: b.email,
    }),
  ]);
  results.forEach((r, i) => {
    if (r.status === "rejected") log.error("booking.email_failed", { bookingId: b.id, recipient: i === 0 ? "visitor" : "team" }, r.reason);
  });
}
