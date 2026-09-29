import "server-only";
import { getDb, schema } from "./db";
import { log } from "./logger";

export async function audit(
  actor: string,
  action: string,
  entity?: string,
  entityId?: string,
  details?: string,
) {
  try {
    const db = await getDb();
    await db.insert(schema.auditLog).values({ actor, action, entity, entityId, details });
  } catch (err) {
    log.error("audit.write_failed", { action }, err);
  }
}
