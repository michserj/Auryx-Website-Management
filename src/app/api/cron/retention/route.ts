import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { runRetention } from "@/lib/retention";
import { log } from "@/lib/logger";

/**
 * Scheduled retention purge. Protected by CRON_SECRET (sent as a Bearer token —
 * this is what Vercel Cron sends automatically; system cron can use scripts/retention.ts).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const ok =
    !!secret &&
    auth.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
  if (!ok) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    return NextResponse.json({ ok: true, deleted: await runRetention() });
  } catch (err) {
    log.error("retention.failed", {}, err);
    return NextResponse.json({ message: "Retention job failed" }, { status: 500 });
  }
}
