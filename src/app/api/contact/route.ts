import { NextResponse } from "next/server";
import { contactSchema, fieldErrors } from "@/lib/validation";
import { assertSameOrigin, HttpError, rateLimit } from "@/lib/security";
import { createInquiry } from "@/lib/inquiries";
import { getContent } from "@/lib/settings";
import { log } from "@/lib/logger";

const MIN_FILL_MS = 3000;

export async function POST(request: Request) {
  const site = await getContent("site");
  const friendlyError = `Something went wrong while sending your message. Please try again or contact us directly at ${site.contactEmail}.`;
  try {
    await assertSameOrigin();
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid request." }, { status: 400 });
    }

    // Spam checks: silently accept (without storing) so bots get no signal.
    const tooFast = typeof body.startedAt === "number" && Date.now() - body.startedAt < MIN_FILL_MS;
    if (body.website || tooFast) {
      log.warn("contact.spam_blocked", { reason: body.website ? "honeypot" : "too_fast" });
      return NextResponse.json({ ok: true });
    }

    if (!(await rateLimit("contact", 5, 600))) {
      return NextResponse.json(
        { message: `You've sent several messages recently. Please wait a few minutes, or email us at ${site.contactEmail}.` },
        { status: 429 },
      );
    }

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Please check the highlighted fields.", errors: fieldErrors(parsed.error) },
        { status: 422 },
      );
    }
    const { name, message, email, phone } = parsed.data;
    const id = await createInquiry({ name, message, email, phone });
    log.info("contact.received", { inquiryId: id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ message: err.message }, { status: err.status });
    log.error("contact.failed", {}, err);
    return NextResponse.json({ message: friendlyError }, { status: 500 });
  }
}
