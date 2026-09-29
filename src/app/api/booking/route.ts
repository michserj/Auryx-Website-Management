import { NextResponse } from "next/server";
import { bookingSchema, fieldErrors } from "@/lib/validation";
import { assertSameOrigin, HttpError, rateLimit } from "@/lib/security";
import { BookingError, createBooking } from "@/lib/booking/service";
import { getContent } from "@/lib/settings";
import { log } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ message: "Invalid request." }, { status: 400 });
    if (body.website) {
      log.warn("booking.spam_blocked", { reason: "honeypot" });
      return NextResponse.json({ message: "Invalid request." }, { status: 400 });
    }
    if (!(await rateLimit("booking", 5, 3600))) {
      return NextResponse.json(
        { message: "You've made several booking requests recently. Please try again later or send us a message." },
        { status: 429 },
      );
    }
    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Please check the highlighted fields.", errors: fieldErrors(parsed.error) },
        { status: 422 },
      );
    }
    const privacy = await getContent("privacy");
    const { booking } = await createBooking({
      start: new Date(parsed.data.start),
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      topic: parsed.data.topic,
      privacyVersion: privacy.version,
    });
    log.info("booking.created", { bookingId: booking.id });
    return NextResponse.json({ ok: true, start: booking.startAt.toISOString(), end: booking.endAt.toISOString() });
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ message: err.message }, { status: err.status });
    if (err instanceof BookingError) return NextResponse.json({ message: err.message, code: err.code }, { status: 409 });
    log.error("booking.create_failed", {}, err);
    return NextResponse.json(
      { message: "Something went wrong while booking your consultation. Please try again or contact us at info@auryx.net." },
      { status: 500 },
    );
  }
}
