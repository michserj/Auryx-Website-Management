import { NextResponse, type NextRequest } from "next/server";
import { BookingError, findByToken, getAvailability } from "@/lib/booking/service";
import { isValidDate } from "@/lib/booking/time";
import { rateLimit } from "@/lib/security";
import { log } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "";
  const token = request.nextUrl.searchParams.get("token");
  if (!isValidDate(date)) return NextResponse.json({ message: "Invalid date." }, { status: 400 });

  try {
    if (!(await rateLimit("availability", 120, 600))) {
      return NextResponse.json({ message: "Too many requests. Please wait a moment." }, { status: 429 });
    }
    const exclude = token ? (await findByToken(token))?.id : undefined;
    const { slots, range, settings } = await getAvailability(date, exclude);
    return NextResponse.json(
      { date, timezone: settings.timezone, range, slots: slots.map((s) => s.start.toISOString()) },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    if (err instanceof BookingError) return NextResponse.json({ message: err.message }, { status: 409 });
    log.error("booking.availability_failed", { date }, err);
    return NextResponse.json(
      { message: "We couldn't load available times just now. Please try again, or send us a message instead." },
      { status: 503 },
    );
  }
}
