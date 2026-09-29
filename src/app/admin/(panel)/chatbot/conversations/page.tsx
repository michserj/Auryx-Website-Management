import Link from "next/link";
import { and, count, desc, eq, gte, ilike, lte, or, sql, type SQL } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { AdminPage, Badge, EmptyState, Pagination, fmtDate } from "@/components/admin/ui";

export const metadata = { title: "Chatbot conversations" };
const PER_PAGE = 25;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function ConversationsPage(props: PageProps<"/admin/chatbot/conversations">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim().slice(0, 100) : "");
  const q = str("q");
  const status = (schema.conversationStatus as readonly string[]).includes(str("status")) ? str("status") : "";
  const lead = str("lead") === "1";
  const from = DATE_RE.test(str("from")) ? str("from") : "";
  const to = DATE_RE.test(str("to")) ? str("to") : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const f: SQL[] = [];
  if (status) f.push(eq(schema.chatConversations.status, status as (typeof schema.conversationStatus)[number]));
  if (lead) f.push(eq(schema.chatConversations.isLead, true));
  if (from) f.push(gte(schema.chatConversations.lastMessageAt, new Date(`${from}T00:00:00+08:00`)));
  if (to) f.push(lte(schema.chatConversations.createdAt, new Date(`${to}T23:59:59+08:00`)));
  if (q) {
    const like = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
    f.push(
      or(
        ilike(schema.chatConversations.sessionId, like),
        ilike(schema.chatConversations.visitorName, like),
        ilike(schema.chatConversations.visitorContact, like),
        sql`exists (select 1 from ${schema.chatMessages} m where m.conversation_id = ${schema.chatConversations.id} and m.content ilike ${like})`,
      )!,
    );
  }
  const where = f.length ? and(...f) : undefined;
  const db = await getDb();
  const [[total], rows] = await Promise.all([
    db.select({ n: count() }).from(schema.chatConversations).where(where),
    db
      .select()
      .from(schema.chatConversations)
      .where(where)
      .orderBy(desc(schema.chatConversations.lastMessageAt))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
  ]);
  const params = new URLSearchParams(
    Object.entries({ q, status, lead: lead ? "1" : "", from, to }).filter(([, v]) => v) as [string, string][],
  );

  return (
    <AdminPage title="Chatbot conversations" description="Stored conversations are deleted automatically after the configured retention period.">
      <form className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6 lg:items-end" role="search">
        <div className="lg:col-span-2">
          <label htmlFor="q" className="field-label">Search</label>
          <input id="q" name="q" defaultValue={q} placeholder="Text, name, contact or session ID" className="field" />
        </div>
        <div>
          <label htmlFor="status" className="field-label">Status</label>
          <select id="status" name="status" defaultValue={status} className="field">
            <option value="">All</option>
            {schema.conversationStatus.map((s) => (
              <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="from" className="field-label">From</label>
          <input id="from" name="from" type="date" defaultValue={from} className="field" />
        </div>
        <div>
          <label htmlFor="to" className="field-label">To</label>
          <input id="to" name="to" type="date" defaultValue={to} className="field" />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="lead" value="1" defaultChecked={lead} className="h-4 w-4 accent-navy-600" /> Leads only
          </label>
          <button className="btn-navy px-4">Filter</button>
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState>No conversations match.</EmptyState>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-3">Last activity</th>
                <th scope="col" className="px-4 py-3">Session</th>
                <th scope="col" className="px-4 py-3">Visitor</th>
                <th scope="col" className="px-4 py-3">Messages</th>
                <th scope="col" className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-surface">
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtDate(c.lastMessageAt)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/chatbot/conversations/${c.id}`} className="font-mono text-xs text-navy-700 hover:underline">
                      {c.sessionId.slice(0, 16)}…
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {c.visitorName ?? <span className="text-muted">Not shared</span>}
                    {c.visitorContact && <span className="block text-xs text-muted">{c.visitorContact}</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{c.messageCount}</td>
                  <td className="px-4 py-3">
                    <span className="flex flex-wrap gap-1.5">
                      <Badge kind={c.status}>{c.status}</Badge>
                      {c.isLead && <Badge kind="lead">Lead</Badge>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={Math.ceil(total.n / PER_PAGE)} base={`/admin/chatbot/conversations?${params}`} />
    </AdminPage>
  );
}
