import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { getDb, schema } from "./db";
import { log } from "./logger";

export async function getPublishedServices() {
  try {
    const db = await getDb();
    return await db
      .select()
      .from(schema.services)
      .where(eq(schema.services.published, true))
      .orderBy(asc(schema.services.sortOrder), asc(schema.services.title));
  } catch (err) {
    log.error("content.services_failed", {}, err);
    return [];
  }
}

export async function getServiceBySlug(slug: string) {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(schema.services)
    .where(and(eq(schema.services.slug, slug), eq(schema.services.published, true)));
  return row ?? null;
}

export async function getPublishedCaseStudies() {
  try {
    const db = await getDb();
    return await db
      .select()
      .from(schema.caseStudies)
      .where(eq(schema.caseStudies.status, "published"))
      .orderBy(asc(schema.caseStudies.sortOrder), desc(schema.caseStudies.publishedAt));
  } catch (err) {
    log.error("content.case_studies_failed", {}, err);
    return [];
  }
}

export async function getCaseStudyBySlug(slug: string) {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(schema.caseStudies)
    .where(and(eq(schema.caseStudies.slug, slug), eq(schema.caseStudies.status, "published")));
  if (!row) return null;
  const gallery = await db
    .select({
      id: schema.caseStudyImages.id,
      imageId: schema.caseStudyImages.imageId,
      caption: schema.caseStudyImages.caption,
      alt: schema.images.alt,
    })
    .from(schema.caseStudyImages)
    .innerJoin(schema.images, eq(schema.images.id, schema.caseStudyImages.imageId))
    .where(eq(schema.caseStudyImages.caseStudyId, row.id))
    .orderBy(asc(schema.caseStudyImages.sortOrder), asc(schema.caseStudyImages.createdAt));
  const cover = row.coverImageId
    ? (await db.select({ alt: schema.images.alt }).from(schema.images).where(eq(schema.images.id, row.coverImageId)))[0]
    : undefined;
  return { ...row, gallery, coverAlt: cover?.alt ?? "" };
}

export function mediaUrl(imageId: string) {
  return `/media/${imageId}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}
