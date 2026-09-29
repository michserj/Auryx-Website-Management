import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { ActionForm } from "@/components/admin/ActionForm";
import { AdminPage, Badge, Checkbox, Panel, Select, fmtDate } from "@/components/admin/ui";
import { deleteConversation, updateConversation } from "../../../../actions/chatbot";

export const metadata = { title: "Conversation" };

export default async function ConversationPage(props: PageProps<"/admin/chatbot/conversations/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = await getDb();
  const [conv] = await db.select().from(schema.chatConversations).where(eq(schema.chatConversations.id, id));
  if (!conv) notFound();
  const messages = await db
    .select()
    .from(schema.chatMessages)
    .where(eq(schema.chatMessages.conversationId, id))
    .orderBy(asc(schema.chatMessages.createdAt));

  return (
    <AdminPage
      title="Conversation"
      description={`Started ${fmtDate(conv.createdAt)} · last activity ${fmtDate(conv.lastMessageAt)}`}
      actions={
        <Link href="/admin/chatbot/conversations" className="btn-outline">
          <ArrowLeft className="h-4 w-4" aria-hidden /> All conversations
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Transcript" className="lg:col-span-2">
          <ol className="space-y-3">
            {messages.map((m) => (
              <li key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-navy-600 text-white" : "border border-line bg-surface"}`}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <p className={`mt-1 text-[11px] ${m.role === "user" ? "text-navy-100" : "text-muted"}`}>
                    {m.role === "user" ? "Visitor" : `Assistant${m.provider ? ` · ${m.provider}` : ""}`} · {fmtDate(m.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
        <div className="space-y-6">
          <Panel title="Details">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted">Session ID</dt>
                <dd className="break-all font-mono text-xs">{conv.sessionId}</dd>
              </div>
              <div>
                <dt className="text-muted">Name (if shared)</dt>
                <dd className="font-medium">{conv.visitorName ?? "Not shared"}</dd>
              </div>
              <div>
                <dt className="text-muted">Contact (if shared)</dt>
                <dd className="font-medium">{conv.visitorContact ?? "Not shared"}</dd>
              </div>
              <div className="flex gap-2">
                <Badge kind={conv.status}>{conv.status}</Badge>
                {conv.isLead && <Badge kind="lead">Lead</Badge>}
              </div>
            </dl>
          </Panel>
          <Panel title="Review">
            <ActionForm action={updateConversation}>
              <input type="hidden" name="id" value={conv.id} />
              <Select
                label="Status"
                name="status"
                defaultValue={conv.status}
                options={schema.conversationStatus.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))}
              />
              <Checkbox label="Mark as lead (needs human follow-up)" name="isLead" defaultChecked={conv.isLead} />
            </ActionForm>
          </Panel>
          <Panel title="Delete">
            <p className="mb-4 text-sm text-muted">Permanently delete this conversation (e.g. on an erasure request).</p>
            <ActionForm action={deleteConversation} submitLabel="Delete conversation" variant="danger" confirm="Permanently delete this conversation?">
              <input type="hidden" name="id" value={conv.id} />
            </ActionForm>
          </Panel>
        </div>
      </div>
    </AdminPage>
  );
}
