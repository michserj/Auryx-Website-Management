import Link from "next/link";
import { and, count, desc, eq, gte, or } from "drizzle-orm";
import { CalendarDays, Inbox, MessagesSquare, Star } from "lucide-react";
import { getDb, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { isEmailConfigured } from "@/lib/email";
import { isGoogleCalendarConfigured } from "@/lib/booking/calendar";
import { describeProvider } from "@/lib/chatbot/providers";
import { INQUIRY_STATUS_LABEL } from "@/lib/inquiries";
import { AdminPage, Badge, EmptyState, Panel, fmtDate } from "@/components/admin/ui";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  await requireAdmin();
  const db = await getDb();
  const now = new Date();

  const [[newInq], [upcoming], [openChats], [leads], inquiries, bookings, chats, reviewContent, reviewServices, reviewCases, auditRows] =
    await Promise.all([
      db.select({ n: count() }).from(schema.inquiries).where(eq(schema.inquiries.status, "new")),
      db
        .select({ n: count() })
        .from(schema.bookings)
        .where(and(eq(schema.bookings.status, "confirmed"), gte(schema.bookings.startAt, now))),
      db.select({ n: count() }).from(schema.chatConversations).where(eq(schema.chatConversations.status, "open")),
      db
        .select({ n: count() })
        .from(schema.chatConversations)
        .where(and(eq(schema.chatConversations.isLead, true), eq(schema.chatConversations.status, "open"))),
      db.select().from(schema.inquiries).orderBy(desc(schema.inquiries.createdAt)).limit(5),
      db
        .select()
        .from(schema.bookings)
        .where(and(eq(schema.bookings.status, "confirmed"), gte(schema.bookings.startAt, now)))
        .orderBy(schema.bookings.startAt)
        .limit(5),
      db.select().from(schema.chatConversations).orderBy(desc(schema.chatConversations.lastMessageAt)).limit(5),
      db.select({ key: schema.siteContent.key }).from(schema.siteContent).where(eq(schema.siteContent.needsReview, true)),
      db.select({ id: schema.services.id, title: schema.services.title }).from(schema.services).where(eq(schema.services.needsReview, true)),
      db
        .select({ id: schema.caseStudies.id, title: schema.caseStudies.title })
        .from(schema.caseStudies)
        .where(or(eq(schema.caseStudies.needsReview, true))),
      db.select().from(schema.auditLog).orderBy(desc(schema.auditLog.createdAt)).limit(8),
    ]);

  const stats = [
    { label: "New inquiries", value: newInq.n, href: "/admin/inquiries?status=new", icon: Inbox },
    { label: "Upcoming consultations", value: upcoming.n, href: "/admin/bookings", icon: CalendarDays },
    { label: "Open chats", value: openChats.n, href: "/admin/chatbot/conversations?status=open", icon: MessagesSquare },
    { label: "Possible leads (chat)", value: leads.n, href: "/admin/chatbot/conversations?lead=1", icon: Star },
  ];

  const integrations = [
    { name: "Email delivery", ok: isEmailConfigured(), off: "Not configured, emails are logged only" },
    { name: "Google Calendar", ok: isGoogleCalendarConfigured(), off: "Not configured, bookings saved locally only" },
    { name: "Chat assistant", ok: !describeProvider().startsWith("FAQ"), off: describeProvider(), on: describeProvider() },
    { name: "Retention job", ok: !!process.env.CRON_SECRET, off: "CRON_SECRET not set, schedule not active" },
  ];

  const reviewCount = reviewContent.length + reviewServices.length + reviewCases.length;

  return (
    <AdminPage title="Dashboard" description="Recent activity across the Auryx website.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card flex items-center gap-4 p-5 hover:border-navy-200">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-gold-400">
              <s.icon className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-2xl font-bold">{s.value}</span>
              <span className="text-sm text-muted">{s.label}</span>
            </span>
          </Link>
        ))}
      </div>

      {reviewCount > 0 && (
        <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
          <strong>{reviewCount} content item(s) need Auryx review before launch:</strong>{" "}
          {[
            ...reviewContent.map((c) => `${c.key} page`),
            ...reviewServices.map((s) => s.title),
            ...reviewCases.map((c) => `case study “${c.title}”`),
          ].join(", ")}
          . Open each item and save it with “Needs review” unticked once approved.
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Recent inquiries">
          {inquiries.length === 0 ? (
            <EmptyState>No inquiries yet.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {inquiries.map((i) => (
                <li key={i.id}>
                  <Link href={`/admin/inquiries/${i.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-navy-700">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{i.name}</span>
                      <span className="block truncate text-sm text-muted">{i.message}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <Badge kind={i.status}>{INQUIRY_STATUS_LABEL[i.status]}</Badge>
                      <span className="mt-1 block text-xs text-muted">{fmtDate(i.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Upcoming consultations">
          {bookings.length === 0 ? (
            <EmptyState>No upcoming consultations.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {bookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{b.name}</span>
                    <span className="block truncate text-sm text-muted">{b.email}</span>
                  </span>
                  <span className="shrink-0 text-sm font-medium text-navy-700">{fmtDate(b.startAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent chatbot activity">
          {chats.length === 0 ? (
            <EmptyState>No conversations yet.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {chats.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/chatbot/conversations/${c.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-navy-700">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{c.visitorName ?? "Anonymous visitor"}</span>
                      <span className="block truncate font-mono text-xs text-muted">{c.sessionId.slice(0, 12)}…</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {c.isLead && <Badge kind="lead">Lead</Badge>}
                      <Badge kind={c.status}>{c.status}</Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="System status">
          <ul className="space-y-3 text-sm">
            {integrations.map((i) => (
              <li key={i.name} className="flex items-start justify-between gap-4">
                <span className="font-medium">{i.name}</span>
                <span className={`text-right ${i.ok ? "text-green-700" : "text-orange-700"}`}>{i.ok ? (i.on ?? "Configured") : i.off}</span>
              </li>
            ))}
          </ul>
          <h3 className="mt-6 text-sm font-semibold">Recent admin activity</h3>
          <ul className="mt-2 space-y-1.5 text-xs text-muted">
            {auditRows.map((a) => (
              <li key={a.id}>
                {fmtDate(a.createdAt)} · {a.action}
                {a.entity ? ` · ${a.entity}` : ""}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AdminPage>
  );
}
