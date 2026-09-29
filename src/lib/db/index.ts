import "server-only";
import * as schema from "./schema";
import { createDb, type Database } from "./connect";

export type Db = Database;

const g = globalThis as unknown as { __auryxDb?: Promise<Db> };

/**
 * Returns the shared Drizzle client.
 * - DATABASE_URL=postgres://...  -> PostgreSQL (production; Neon, Supabase, RDS, self-hosted…)
 * - unset or "pglite:<dir>"      -> embedded PGlite (local development / tests, no Docker needed)
 */
export function getDb(): Promise<Db> {
  if (!g.__auryxDb) {
    g.__auryxDb = createDb(process.env.DATABASE_URL).catch((err) => {
      g.__auryxDb = undefined; // allow retry on next request
      throw err;
    });
  }
  return g.__auryxDb;
}

export { schema };
