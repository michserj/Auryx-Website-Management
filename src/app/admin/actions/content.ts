"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { eq } from "drizzle-orm";
import { getContent, setContent } from "@/lib/settings";
import { getDb, schema } from "@/lib/db";
import { fileFrom, ImageError, storeImage } from "@/lib/images";
import { fieldErrors } from "@/lib/validation";
import type { ActionResult } from "@/components/admin/ActionForm";

const str = (max: number) => z.string().trim().min(1, "Required").max(max);

/** Parses "Title | text" lines into items. */
function pairs(raw: FormDataEntryValue | null) {
  return String(raw ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [title, ...rest] = l.split("|");
      return { title: title.trim(), text: rest.join("|").trim() };
    })
    .filter((p) => p.title && p.text);
}

const done = async (email: string, key: string): Promise<ActionResult> => {
  await audit(email, "content.update", "site_content", key);
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved and published." };
};

export async function saveHome(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = z
    .object({
      heroEyebrow: str(120),
      heroTitle: str(160),
      heroText: str(600),
      aiTitle: str(160),
      aiText: str(800),
      whyTitle: str(160),
      whyItems: z.array(z.object({ title: str(80), text: str(300) })).min(1).max(12),
      ctaTitle: str(160),
      ctaText: str(600),
    })
    .safeParse({ ...Object.fromEntries(fd), whyItems: pairs(fd.get("whyItems")) });
  if (!parsed.success) return { ok: false, message: "Please fix the errors below.", errors: fieldErrors(parsed.error) };
  await setContent("home", parsed.data, { needsReview: fd.get("needsReview") === "on" });
  return done(admin.email, "home");
}

export async function saveAbout(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = z
    .object({
      intro: str(200),
      description: str(2000),
      founderName: str(120),
      founderRole: str(120),
      founderBio: str(3000),
      approachTitle: str(160),
      approach: z.array(z.object({ title: str(80), text: str(300) })).max(9),
    })
    .safeParse({ ...Object.fromEntries(fd), approach: pairs(fd.get("approach")) });
  if (!parsed.success) return { ok: false, message: "Please fix the errors below.", errors: fieldErrors(parsed.error) };
  // Keep the founder photo, which is managed by its own form.
  const current = await getContent("about");
  await setContent(
    "about",
    { ...parsed.data, founderImageId: current.founderImageId, founderImageAlt: current.founderImageAlt },
    { needsReview: fd.get("needsReview") === "on" },
  );
  return done(admin.email, "about");
}

async function deleteImage(id: string | undefined) {
  if (!id) return;
  const db = await getDb();
  await db.delete(schema.images).where(eq(schema.images.id, id));
}

/** Uploads or replaces the founder photo, and/or updates its description. */
export async function saveFounderPhoto(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const about = await getContent("about");
  const alt = String(fd.get("founderImageAlt") ?? "").trim().slice(0, 300) || `${about.founderName}, ${about.founderRole} of Auryx Software`;
  const file = fileFrom(fd, "founderImage");
  if (!file && !about.founderImageId) return { ok: false, message: "Choose a photo to upload." };

  let founderImageId = about.founderImageId;
  if (file) {
    try {
      founderImageId = await storeImage(file, alt);
    } catch (err) {
      return { ok: false, message: err instanceof ImageError ? err.message : "Could not upload the photo." };
    }
  } else if (founderImageId) {
    const db = await getDb();
    await db.update(schema.images).set({ alt }).where(eq(schema.images.id, founderImageId));
  }

  const meta = await getContentMetaSafe();
  await setContent("about", { ...about, founderImageId, founderImageAlt: alt }, { needsReview: meta });
  if (file && about.founderImageId) await deleteImage(about.founderImageId);
  await audit(admin.email, file ? (about.founderImageId ? "founder_photo.replace" : "founder_photo.upload") : "founder_photo.update", "site_content", "about");
  revalidatePath("/", "layout");
  return { ok: true, message: file ? "Photo uploaded and published." : "Photo description saved." };
}

export async function removeFounderPhoto(): Promise<ActionResult> {
  const admin = await requireAdmin();
  const about = await getContent("about");
  if (!about.founderImageId) return { ok: true, message: "No photo to remove." };
  const meta = await getContentMetaSafe();
  await setContent("about", { ...about, founderImageId: undefined, founderImageAlt: undefined }, { needsReview: meta });
  await deleteImage(about.founderImageId);
  await audit(admin.email, "founder_photo.remove", "site_content", "about");
  revalidatePath("/", "layout");
  return { ok: true, message: "Photo removed. The bulb logo is shown instead." };
}

/** Preserves the About page's "needs review" flag when only the photo changes. */
async function getContentMetaSafe() {
  const db = await getDb();
  const [row] = await db
    .select({ needsReview: schema.siteContent.needsReview })
    .from(schema.siteContent)
    .where(eq(schema.siteContent.key, "about"));
  return row?.needsReview ?? false;
}

export async function saveSite(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = z
    .object({ contactEmail: z.email(), location: str(200), tagline: str(200) })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, message: "Please fix the errors below.", errors: fieldErrors(parsed.error) };
  await setContent("site", parsed.data);
  return done(admin.email, "site");
}

export async function savePrivacy(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = z
    .object({
      version: z.string().trim().regex(/^[A-Za-z0-9._-]{1,40}$/, "Letters, numbers, dot, dash, underscore only"),
      lastUpdated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
      body: str(30000),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, message: "Please fix the errors below.", errors: fieldErrors(parsed.error) };
  await setContent("privacy", parsed.data, { needsReview: fd.get("needsReview") === "on" });
  return done(admin.email, "privacy");
}
