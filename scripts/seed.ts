import "dotenv/config";
import { createDb } from "../src/lib/db/connect";
import * as schema from "../src/lib/db/schema";
import {
  DEFAULT_ABOUT,
  DEFAULT_CASE_STUDY,
  DEFAULT_FAQ,
  DEFAULT_HOME,
  DEFAULT_PRIVACY,
  DEFAULT_SERVICES,
  DEFAULT_SITE,
} from "../src/lib/content-defaults";

// Idempotent: only inserts content that doesn't exist yet, so it never
// overwrites edits made in the Admin Dashboard.
async function main() {
  const db = await createDb(process.env.DATABASE_URL);

  const content: [string, unknown, boolean][] = [
    ["site", DEFAULT_SITE, false],
    ["home", DEFAULT_HOME, true],
    ["about", DEFAULT_ABOUT, false],
    ["privacy", DEFAULT_PRIVACY, true], // final notice needs Auryx approval
  ];
  for (const [key, value, needsReview] of content) {
    await db.insert(schema.siteContent).values({ key, value, needsReview }).onConflictDoNothing();
  }

  const existingServices = await db.select({ id: schema.services.id }).from(schema.services);
  if (existingServices.length === 0) {
    await db.insert(schema.services).values(
      DEFAULT_SERVICES.map((s, i) => ({ ...s, sortOrder: i, published: true, needsReview: true })),
    );
  }

  const existingCases = await db.select({ id: schema.caseStudies.id }).from(schema.caseStudies);
  if (existingCases.length === 0) {
    await db.insert(schema.caseStudies).values({
      ...DEFAULT_CASE_STUDY,
      status: "published",
      publishedAt: new Date(),
      needsReview: true,
    });
  }

  const existingFaq = await db.select({ id: schema.knowledgeEntries.id }).from(schema.knowledgeEntries);
  if (existingFaq.length === 0) {
    await db.insert(schema.knowledgeEntries).values(DEFAULT_FAQ.map((f, i) => ({ ...f, sortOrder: i })));
  }

  console.log("✔ Seed complete (existing content left untouched)");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
