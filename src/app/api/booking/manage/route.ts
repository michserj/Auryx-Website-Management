import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, HttpError, rateLimit } from "@/lib/security";
import { BookingError, cancelBooking, findByToken, rescheduleBooking } from "@/lib/booking/service";
import { log } from "@/lib/logger";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("cancel"), token: z.string().min(20).max(100) }),
  z.object({
    action: z.literal("reschedule"),
    token: z.string().min(20).max(100),
    start: z.iso.datetime({ offset: true }),
  }),
]);

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    if (!(await rateLimit("booking-manage", 20, 3600))) {
      return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
    }
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ message: "Invalid request." }, { status: 400 });

    const booking = await findByToken(parsed.data.token);
    if (!booking) return NextResponse.json({ message: "This link is invalid or has expired." }, { status: 404 });

    if (parsed.data.action === "cancel") {
      await cancelBooking(booking.id, "visitor");
      log.info("booking.cancelled", { bookingId: booking.id, by: "visitor" });
      return NextResponse.json({ ok: true, status: "cancelled" });
    }
    const updated = await rescheduleBooking(booking.id, new Date(parsed.data.start));
    log.info("booking.rescheduled", { bookingId: booking.id });
    return NextResponse.json({ ok: true, start: updated.startAt.toISOString(), end: updated.endAt.toISOString() });
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ message: err.message }, { status: err.status });
    if (err instanceof BookingError) return NextResponse.json({ message: err.message, code: err.code }, { status: 409 });
    log.error("booking.manage_failed", {}, err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again or contact us at info@auryx.net." },
      { status: 500 },
    );
  }
}
