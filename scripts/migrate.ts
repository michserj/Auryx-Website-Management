import "dotenv/config";
import path from "node:path";
import { isPglite } from "../src/lib/db/connect";

// Applies SQL migrations from ./drizzle to the configured database.
async function main() {
  const url = process.env.DATABASE_URL;
  const migrationsFolder = path.resolve("drizzle");
  if (isPglite(url)) {
    const { createDb } = await import("../src/lib/db/connect");
    await createDb(url); // PGlite migrates on open
  } else {
    const postgres = (await import("postgres")).default;
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const client = postgres(url!, { max: 1, ssl: process.env.DATABASE_SSL === "disable" ? false : "prefer" });
    await migrate(drizzle(client), { migrationsFolder });
    await client.end();
  }
  console.log("✔ Database migrated");
}

main().catch((err) => {
  console.error("Migration failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
