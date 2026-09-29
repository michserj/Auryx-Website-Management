"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getDb, schema } from "@/lib/db";
import { slugify } from "@/lib/content";
import { fieldErrors } from "@/lib/validation";
import { SERVICE_ICON_NAMES } from "@/components/admin/icon-names";
import type { ActionResult } from "@/components/admin/ActionForm";

const lines = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

const serviceSchema = z.object({
  title: z.string().trim().min(1, "Required").max(150),
  slug: z.string().trim().regex(/^[a-z0-9-]{2,100}$/, "Lowercase letters, numbers and dashes only"),
  summary: z.string().trim().min(1, "Required").max(500),
  body: z.string().trim().max(10000),
  features: z.array(z.string().max(120)).max(20),
  icon: z.enum(SERVICE_ICON_NAMES),
  sortOrder: z.coerce.number().int().min(0).max(999),
  published: z.boolean(),
  needsReview: z.boolean(),
});

function parse(fd: FormData) {
  const title = String(fd.get("title") ?? "");
  return serviceSchema.safeParse({
    title,
    slug: String(fd.get("slug") || slugify(title)),
    summary: fd.get("summary"),
    body: fd.get("body") ?? "",
    features: lines(fd.get("features")),
    icon: fd.get("icon"),
    sortOrder: fd.get("sortOrder") || 0,
    published: fd.get("published") === "on",
    needsReview: fd.get("needsReview") === "on",
  });
}

export async function saveService(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = fd.get("id") ? z.uuid().parse(fd.get("id")) : null;
  const parsed = parse(fd);
  if (!parsed.success) return { ok: false, message: "Please fix the errors below.", errors: fieldErrors(parsed.error) };
  const db = await getDb();
  const [clash] = await db.select({ id: schema.services.id }).from(schema.services).where(eq(schema.services.slug, parsed.data.slug));
  if (clash && clash.id !== id) return { ok: false, message: "Another service already uses this URL slug." };

  let savedId = id;
  if (id) {
    await db.update(schema.services).set({ ...parsed.data, updatedAt: new Date() }).where(eq(schema.services.id, id));
  } else {
    [{ id: savedId }] = await db.insert(schema.services).values(parsed.data).returning({ id: schema.services.id });
  }
  await audit(admin.email, id ? "service.update" : "service.create", "service", savedId!);
  revalidatePath("/", "layout");
  if (!id) redirect(`/admin/services/${savedId}`);
  return { ok: true, message: "Saved." };
}

export async function deleteService(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = z.uuid().parse(fd.get("id"));
  const db = await getDb();
  await db.delete(schema.services).where(eq(schema.services.id, id));
  await audit(admin.email, "service.delete", "service", id);
  revalidatePath("/", "layout");
  redirect("/admin/services");
}
