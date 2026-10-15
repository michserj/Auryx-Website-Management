// Shared by the Next.js app and CLI scripts (no "server-only" import here).
import path from "node:path";
import { drizzle as drizzlePg, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

/** Connection string, also accepting the name Vercel's Postgres (Neon) integration sets. */
export function databaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined;
}

export function isPglite(url: string | undefined) {
  return !url || url.startsWith("pglite:");
}

/**
 * The embedded PGlite database is for local development only. On servers,
 * containers and serverless platforms its files can disappear on restart, so a
 * hosted deployment must use PostgreSQL. Fail loudly instead of losing data.
 * (Set DATABASE_URL=pglite:<dir> explicitly to opt in, e.g. for a local production test.)
 */
export function assertPersistentDatabase(url: string | undefined) {
  const hosted = !!(process.env.VERCEL || process.env.NODE_ENV === "production");
  if (!url && hosted) {
    throw new Error(
      "DATABASE_URL is not set. Production deployments need a PostgreSQL database (e.g. Amazon RDS or Neon). " +
        "Set DATABASE_URL to its connection string.",
    );
  }
  if (url?.startsWith("pglite:") && process.env.VERCEL) {
    throw new Error("The embedded database cannot be used on Vercel. Connect a Postgres database (e.g. Neon).");
  }
}

export async function createDb(url: string | undefined = databaseUrl()): Promise<Database> {
  assertPersistentDatabase(url);
  if (isPglite(url)) {
    const dir = url?.slice("pglite:".length) || "./.data/pglite";
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { mkdirSync } = await import("node:fs");
    // Runtime-only paths: keep the bundler from tracing the whole project.
    const dataDir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), dir);
    mkdirSync(path.dirname(dataDir), { recursive: true });
    const client = new PGlite(dataDir);
    const db = drizzle(client, { schema });
    // Local development convenience: keep the embedded DB schema current.
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    await migrate(db, { migrationsFolder: path.resolve(/*turbopackIgnore: true*/ process.cwd(), "drizzle") });
    return db as unknown as Database;
  }
  const client = postgres(url!, {
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    ssl: process.env.DATABASE_SSL === "disable" ? false : "prefer",
    // Required for pooled (PgBouncer transaction-mode) connections such as Neon's pooler.
    prepare: false,
  });
  return drizzlePg(client, { schema });
}
