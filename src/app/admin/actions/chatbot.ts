"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getDb, schema } from "@/lib/db";
import { fieldErrors } from "@/lib/validation";
import type { ActionResult } from "@/components/admin/ActionForm";

const entrySchema = z.object({
  category: z.enum(schema.knowledgeCategories),
  question: z.string().trim().min(3, "Required").max(300),
  answer: z.string().trim().min(3, "Required").max(4000),
  keywords: z.string().trim().max(500),
  sortOrder: z.coerce.number().int().min(0).max(999),
  enabled: z.boolean(),
});

export async function saveKnowledge(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = fd.get("id") ? z.uuid().parse(fd.get("id")) : null;
  const parsed = entrySchema.safeParse({
    category: fd.get("category"),
    question: fd.get("question"),
    answer: fd.get("answer"),
    keywords: fd.get("keywords") ?? "",
    sortOrder: fd.get("sortOrder") || 0,
    enabled: fd.get("enabled") === "on",
  });
  if (!parsed.success) return { ok: false, message: "Please fix the errors below.", errors: fieldErrors(parsed.error) };
  const db = await getDb();
  if (id) {
    await db.update(schema.knowledgeEntries).set({ ...parsed.data, updatedAt: new Date() }).where(eq(schema.knowledgeEntries.id, id));
  } else {
    await db.insert(schema.knowledgeEntries).values(parsed.data);
  }
  await audit(admin.email, id ? "knowledge.update" : "knowledge.create", "knowledge", id ?? undefined, parsed.data.question.slice(0, 80));
  revalidatePath("/admin/chatbot/knowledge");
  if (id) redirect("/admin/chatbot/knowledge");
  return { ok: true, message: "Entry added." };
}

export async function toggleKnowledge(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = z.uuid().parse(fd.get("id"));
  const enabled = fd.get("enabled") === "true";
  const db = await getDb();
  await db.update(schema.knowledgeEntries).set({ enabled, updatedAt: new Date() }).where(eq(schema.knowledgeEntries.id, id));
  await audit(admin.email, enabled ? "knowledge.enable" : "knowledge.disable", "knowledge", id);
  revalidatePath("/admin/chatbot/knowledge");
  return { ok: true, message: enabled ? "Enabled." : "Disabled." };
}

export async function deleteKnowledge(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = z.uuid().parse(fd.get("id"));
  const db = await getDb();
  await db.delete(schema.knowledgeEntries).where(eq(schema.knowledgeEntries.id, id));
  await audit(admin.email, "knowledge.delete", "knowledge", id);
  revalidatePath("/admin/chatbot/knowledge");
  redirect("/admin/chatbot/knowledge");
}

export async function updateConversation(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = z
    .object({ id: z.uuid(), status: z.enum(schema.conversationStatus), isLead: z.boolean() })
    .safeParse({ id: fd.get("id"), status: fd.get("status"), isLead: fd.get("isLead") === "on" });
  if (!parsed.success) return { ok: false, message: "Invalid input." };
  const db = await getDb();
  await db
    .update(schema.chatConversations)
    .set({ status: parsed.data.status, isLead: parsed.data.isLead })
    .where(eq(schema.chatConversations.id, parsed.data.id));
  await audit(admin.email, "conversation.update", "conversation", parsed.data.id, `status=${parsed.data.status}`);
  revalidatePath("/admin/chatbot/conversations");
  return { ok: true, message: "Saved." };
}

export async function deleteConversation(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = z.uuid().parse(fd.get("id"));
  const db = await getDb();
  await db.delete(schema.chatConversations).where(eq(schema.chatConversations.id, id));
  await audit(admin.email, "conversation.delete", "conversation", id);
  revalidatePath("/admin/chatbot/conversations");
  redirect("/admin/chatbot/conversations");
}
