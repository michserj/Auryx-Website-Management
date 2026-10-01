import "dotenv/config";
import path from "node:path";
import { databaseUrl, isPglite } from "../src/lib/db/connect";

// Applies SQL migrations from ./drizzle to the configured database.
async function main() {
  const url = databaseUrl();
  if (process.env.VERCEL && isPglite(url)) {
    throw new Error("DATABASE_URL is not set. Connect a Postgres database (e.g. Neon) to this Vercel project first.");
  }
  const migrationsFolder = path.resolve("drizzle");
  if (isPglite(url)) {
    const { createDb } = await import("../src/lib/db/connect");
    await createDb(url); // PGlite migrates on open
  } else {
    const postgres = (await import("postgres")).default;
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const client = postgres(url!, { max: 1, prepare: false, ssl: process.env.DATABASE_SSL === "disable" ? false : "prefer" });
    await migrate(drizzle(client), { migrationsFolder });
    await client.end();
  }
  console.log("✔ Database migrated");
}

main().catch((err) => {
  console.error("Migration failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
