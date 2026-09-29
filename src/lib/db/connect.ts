// Shared by the Next.js app and CLI scripts (no "server-only" import here).
import path from "node:path";
import { drizzle as drizzlePg, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

export function isPglite(url: string | undefined) {
  return !url || url.startsWith("pglite:");
}

export async function createDb(url: string | undefined): Promise<Database> {
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
  });
  return drizzlePg(client, { schema });
}
