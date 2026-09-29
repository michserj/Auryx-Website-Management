"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { setContent } from "@/lib/settings";
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
  await setContent("about", parsed.data, { needsReview: fd.get("needsReview") === "on" });
  return done(admin.email, "about");
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
