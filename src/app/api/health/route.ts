import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { log } from "@/lib/logger";

// Health check for load balancers (e.g. AWS ALB / App Runner): 200 when the app
// and its database respond, 503 otherwise. Reveals no configuration details.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    return Response.json({ status: "ok" }, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    log.error("health.failed", {}, err);
    return Response.json({ status: "error" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
