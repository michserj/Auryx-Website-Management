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

export async function createDb(url: string | undefined = databaseUrl()): Promise<Database> {
  if (isPglite(url)) {
    if (process.env.VERCEL) {
      // Serverless functions have no persistent disk, so the embedded database can't be used there.
      throw new Error("DATABASE_URL is not set. Connect a Postgres database (e.g. Neon) to the Vercel project.");
    }
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
