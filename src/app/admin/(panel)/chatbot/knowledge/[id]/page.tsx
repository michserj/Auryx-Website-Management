import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { ActionForm } from "@/components/admin/ActionForm";
import { KnowledgeFields } from "@/components/admin/KnowledgeFields";
import { AdminPage, Panel } from "@/components/admin/ui";
import { deleteKnowledge, saveKnowledge } from "../../../../actions/chatbot";

export const metadata = { title: "Edit knowledge entry" };

export default async function EditKnowledgePage(props: PageProps<"/admin/chatbot/knowledge/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = await getDb();
  const [entry] = await db.select().from(schema.knowledgeEntries).where(eq(schema.knowledgeEntries.id, id));
  if (!entry) notFound();

  return (
    <AdminPage
      title="Edit knowledge entry"
      actions={
        <Link href="/admin/chatbot/knowledge" className="btn-outline">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Knowledge base
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <ActionForm action={saveKnowledge}>
            <input type="hidden" name="id" value={entry.id} />
            <KnowledgeFields entry={entry} />
          </ActionForm>
        </Panel>
        <Panel title="Delete entry">
          <ActionForm action={deleteKnowledge} submitLabel="Delete" variant="danger" confirm="Delete this knowledge entry?">
            <input type="hidden" name="id" value={entry.id} />
          </ActionForm>
        </Panel>
      </div>
    </AdminPage>
  );
}
