"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getDb, schema } from "@/lib/db";
import type { ActionResult } from "@/components/admin/ActionForm";

const updateSchema = z.object({
  id: z.uuid(),
  status: z.enum(schema.inquiryStatus),
  adminNotes: z.string().max(5000),
});

export async function updateInquiry(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = updateSchema.safeParse({
    id: fd.get("id"),
    status: fd.get("status"),
    adminNotes: fd.get("adminNotes") ?? "",
  });
  if (!parsed.success) return { ok: false, message: "Invalid input." };
  const db = await getDb();
  await db
    .update(schema.inquiries)
    .set({ status: parsed.data.status, adminNotes: parsed.data.adminNotes, updatedAt: new Date() })
    .where(eq(schema.inquiries.id, parsed.data.id));
  await audit(admin.email, "inquiry.update", "inquiry", parsed.data.id, `status=${parsed.data.status}`);
  revalidatePath("/admin/inquiries");
  return { ok: true, message: "Saved." };
}

export async function deleteInquiry(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(fd.get("id"));
  if (!id.success) return { ok: false, message: "Invalid input." };
  const db = await getDb();
  await db.delete(schema.inquiries).where(eq(schema.inquiries.id, id.data));
  await audit(admin.email, "inquiry.delete", "inquiry", id.data);
  revalidatePath("/admin/inquiries");
  redirect("/admin/inquiries");
}
