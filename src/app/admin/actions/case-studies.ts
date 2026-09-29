"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getDb, schema } from "@/lib/db";
import { slugify } from "@/lib/content";
import { fileFrom, ImageError, storeImage } from "@/lib/images";
import { fieldErrors } from "@/lib/validation";
import type { ActionResult } from "@/components/admin/ActionForm";

const text = (max: number) => z.string().trim().max(max);

const caseSchema = z.object({
  title: z.string().trim().min(1, "Required").max(200),
  slug: z.string().trim().regex(/^[a-z0-9-]{2,120}$/, "Lowercase letters, numbers and dashes only"),
  summary: z.string().trim().min(1, "Required").max(600),
  clientContext: text(3000),
  challenge: text(3000),
  solution: text(3000),
  features: z.array(z.string().max(150)).max(30),
  technology: text(3000),
  outcome: text(3000),
  body: text(20000),
  status: z.enum(schema.caseStudyStatus),
  sortOrder: z.coerce.number().int().min(0).max(999),
  needsReview: z.boolean(),
});

const refresh = () => revalidatePath("/", "layout");

export async function saveCaseStudy(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = fd.get("id") ? z.uuid().parse(fd.get("id")) : null;
  const title = String(fd.get("title") ?? "");
  const parsed = caseSchema.safeParse({
    title,
    slug: String(fd.get("slug") || slugify(title)),
    summary: fd.get("summary"),
    clientContext: fd.get("clientContext") ?? "",
    challenge: fd.get("challenge") ?? "",
    solution: fd.get("solution") ?? "",
    features: String(fd.get("features") ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
    technology: fd.get("technology") ?? "",
    outcome: fd.get("outcome") ?? "",
    body: fd.get("body") ?? "",
    status: fd.get("status"),
    sortOrder: fd.get("sortOrder") || 0,
    needsReview: fd.get("needsReview") === "on",
  });
  if (!parsed.success) return { ok: false, message: "Please fix the errors below.", errors: fieldErrors(parsed.error) };

  const db = await getDb();
  const [clash] = await db
    .select({ id: schema.caseStudies.id })
    .from(schema.caseStudies)
    .where(eq(schema.caseStudies.slug, parsed.data.slug));
  if (clash && clash.id !== id) return { ok: false, message: "Another case study already uses this URL slug." };

  let coverImageId: string | undefined;
  const cover = fileFrom(fd, "cover");
  if (cover) {
    try {
      coverImageId = await storeImage(cover, String(fd.get("coverAlt") ?? ""));
    } catch (err) {
      return { ok: false, message: err instanceof ImageError ? err.message : "Could not upload the image." };
    }
  }

  const values = {
    ...parsed.data,
    ...(coverImageId ? { coverImageId } : {}),
    updatedAt: new Date(),
  };

  let savedId = id;
  if (id) {
    const [existing] = await db.select().from(schema.caseStudies).where(eq(schema.caseStudies.id, id));
    if (!existing) return { ok: false, message: "Case study not found." };
    const publishedAt =
      parsed.data.status === "published" && !existing.publishedAt ? new Date() : existing.publishedAt;
    await db.update(schema.caseStudies).set({ ...values, publishedAt }).where(eq(schema.caseStudies.id, id));
    if (coverImageId && existing.coverImageId) {
      await db.delete(schema.images).where(eq(schema.images.id, existing.coverImageId));
    } else if (!coverImageId && existing.coverImageId && fd.has("coverAlt")) {
      await db
        .update(schema.images)
        .set({ alt: String(fd.get("coverAlt")).trim().slice(0, 300) })
        .where(eq(schema.images.id, existing.coverImageId));
    }
  } else {
    [{ id: savedId }] = await db
      .insert(schema.caseStudies)
      .values({ ...values, publishedAt: parsed.data.status === "published" ? new Date() : null })
      .returning({ id: schema.caseStudies.id });
  }
  await audit(admin.email, id ? "case_study.update" : "case_study.create", "case_study", savedId!, `status=${parsed.data.status}`);
  refresh();
  if (!id) redirect(`/admin/case-studies/${savedId}`);
  return { ok: true, message: "Saved." };
}

export async function removeCover(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = z.uuid().parse(fd.get("id"));
  const db = await getDb();
  const [cs] = await db.select().from(schema.caseStudies).where(eq(schema.caseStudies.id, id));
  if (cs?.coverImageId) {
    await db.update(schema.caseStudies).set({ coverImageId: null }).where(eq(schema.caseStudies.id, id));
    await db.delete(schema.images).where(eq(schema.images.id, cs.coverImageId));
  }
  await audit(admin.email, "case_study.cover_remove", "case_study", id);
  refresh();
  return { ok: true, message: "Cover image removed." };
}

export async function addGalleryImage(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = z.uuid().parse(fd.get("caseStudyId"));
  const file = fileFrom(fd, "image");
  if (!file) return { ok: false, message: "Choose an image to upload." };
  const caption = String(fd.get("caption") ?? "").trim().slice(0, 300);
  const alt = String(fd.get("alt") ?? "").trim();
  if (!alt) return { ok: false, message: "Please describe the image (alt text) for accessibility." };
  try {
    const imageId = await storeImage(file, alt);
    const db = await getDb();
    await db.insert(schema.caseStudyImages).values({ caseStudyId: id, imageId, caption });
  } catch (err) {
    return { ok: false, message: err instanceof ImageError ? err.message : "Could not upload the image." };
  }
  await audit(admin.email, "case_study.image_add", "case_study", id);
  refresh();
  return { ok: true, message: "Image added." };
}

export async function removeGalleryImage(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = z.uuid().parse(fd.get("id"));
  const db = await getDb();
  const [row] = await db.select().from(schema.caseStudyImages).where(eq(schema.caseStudyImages.id, id));
  if (row) {
    await db.delete(schema.caseStudyImages).where(eq(schema.caseStudyImages.id, id));
    await db.delete(schema.images).where(eq(schema.images.id, row.imageId));
  }
  await audit(admin.email, "case_study.image_remove", "case_study", row?.caseStudyId);
  refresh();
  return { ok: true, message: "Image removed." };
}

export async function deleteCaseStudy(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = z.uuid().parse(fd.get("id"));
  const db = await getDb();
  const [cs] = await db.select().from(schema.caseStudies).where(eq(schema.caseStudies.id, id));
  if (!cs) redirect("/admin/case-studies");
  const gallery = await db
    .select({ imageId: schema.caseStudyImages.imageId })
    .from(schema.caseStudyImages)
    .where(and(eq(schema.caseStudyImages.caseStudyId, id)));
  await db.delete(schema.caseStudies).where(eq(schema.caseStudies.id, id));
  for (const imgId of [cs.coverImageId, ...gallery.map((g) => g.imageId)].filter(Boolean) as string[]) {
    await db.delete(schema.images).where(eq(schema.images.id, imgId));
  }
  await audit(admin.email, "case_study.delete", "case_study", id, cs.title);
  refresh();
  redirect("/admin/case-studies");
}
