import Link from "next/link";
import { asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { describeProvider } from "@/lib/chatbot/providers";
import { ActionForm } from "@/components/admin/ActionForm";
import { KnowledgeFields, categoryLabel } from "@/components/admin/KnowledgeFields";
import { AdminPage, Badge, EmptyState, Panel } from "@/components/admin/ui";
import { saveKnowledge, toggleKnowledge } from "../../../actions/chatbot";

export const metadata = { title: "Chatbot knowledge" };

export default async function KnowledgePage() {
  await requireAdmin();
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.knowledgeEntries)
    .orderBy(asc(schema.knowledgeEntries.category), asc(schema.knowledgeEntries.sortOrder), asc(schema.knowledgeEntries.createdAt));

  return (
    <AdminPage
      title="Chatbot knowledge base"
      description="The assistant answers only from enabled entries below, plus published Services, published Case Studies and the About/General content."
    >
      <p className="mb-6 rounded-xl bg-white p-4 text-sm text-muted ring-1 ring-line">
        <strong className="text-ink">Current engine:</strong> {describeProvider()}. Safety rules (no invented pricing, results,
        guarantees, etc.) are fixed in code and cannot be overridden from this page.
      </p>

      <Panel title="Add entry" className="mb-6">
        <ActionForm action={saveKnowledge} submitLabel="Add entry" resetOnSuccess>
          <KnowledgeFields />
        </ActionForm>
      </Panel>

      {rows.length === 0 ? (
        <EmptyState>No knowledge entries yet.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {rows.map((k) => (
            <li key={k.id} className={`card p-5 ${k.enabled ? "" : "opacity-60"}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{k.question}</span>
                    <Badge kind="draft">{categoryLabel(k.category)}</Badge>
                    {!k.enabled && <Badge kind="cancelled">Disabled</Badge>}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{k.answer}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link href={`/admin/chatbot/knowledge/${k.id}`} className="btn-outline px-3 py-2">
                    Edit
                  </Link>
                  <ActionForm action={toggleKnowledge} submitLabel={k.enabled ? "Disable" : "Enable"} variant="outline" className="flex">
                    <input type="hidden" name="id" value={k.id} />
                    <input type="hidden" name="enabled" value={String(!k.enabled)} />
                  </ActionForm>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminPage>
  );
}
