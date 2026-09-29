import Link from "next/link";
import { asc, desc, gte, lt } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { syncFromCalendar } from "@/lib/booking/service";
import { isGoogleCalendarConfigured } from "@/lib/booking/calendar";
import { ActionForm } from "@/components/admin/ActionForm";
import { AdminPage, Badge, EmptyState, fmtDate } from "@/components/admin/ui";
import { adminCancelBooking, deleteBooking } from "../../actions/bookings";

export const metadata = { title: "Consultations" };

export default async function BookingsPage(props: PageProps<"/admin/bookings">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const view = sp.view === "past" ? "past" : "upcoming";
  const db = await getDb();
  const now = new Date();

  const load = () =>
    view === "upcoming"
      ? db.select().from(schema.bookings).where(gte(schema.bookings.endAt, now)).orderBy(asc(schema.bookings.startAt)).limit(100)
      : db.select().from(schema.bookings).where(lt(schema.bookings.endAt, now)).orderBy(desc(schema.bookings.startAt)).limit(100);

  let rows = await load();
  if (view === "upcoming" && isGoogleCalendarConfigured()) {
    // Reflect changes that authorized users made directly in Google Calendar.
    await syncFromCalendar(rows);
    rows = await load();
  }

  return (
    <AdminPage
      title="Consultations"
      description="Google Calendar is the scheduling source of truth. Authorized Auryx users can also edit events directly in Google Calendar; changes are synced here."
    >
      {!isGoogleCalendarConfigured() && (
        <p className="mb-4 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
          Google Calendar is not configured, so bookings are stored here only and no calendar events are created. See the README → Google
          Calendar setup.
        </p>
      )}
      <div className="mb-4 flex gap-2" role="tablist">
        {(["upcoming", "past"] as const).map((v) => (
          <Link
            key={v}
            href={`/admin/bookings?view=${v}`}
            role="tab"
            aria-selected={view === v}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${view === v ? "bg-navy-900 text-white" : "bg-white text-navy-700 ring-1 ring-line hover:bg-navy-50"}`}
          >
            {v === "upcoming" ? "Upcoming" : "Past"}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState>No {view} consultations.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {rows.map((b) => (
            <li key={b.id} className="card p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold">{fmtDate(b.startAt)}</span>
                    <Badge kind={b.status}>{b.status}</Badge>
                    {b.rescheduleCount > 0 && <span className="text-xs text-muted">rescheduled ×{b.rescheduleCount}</span>}
                  </p>
                  <p className="mt-1 font-medium">{b.name}</p>
                  <p className="text-sm text-muted">
                    <a href={`mailto:${b.email}`} className="hover:underline">{b.email}</a> ·{" "}
                    <a href={`tel:${b.phone}`} className="hover:underline">{b.phone}</a>
                  </p>
                  {b.topic && <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm">{b.topic}</p>}
                  <p className="mt-2 text-xs text-muted">
                    Booked {fmtDate(b.createdAt)}
                    {b.cancelledAt && ` · cancelled ${fmtDate(b.cancelledAt)} by ${b.cancelledBy}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-start gap-2">
                  {b.googleEventLink && (
                    <a href={b.googleEventLink} target="_blank" rel="noopener noreferrer" className="btn-outline px-3 py-2">
                      <ExternalLink className="h-4 w-4" aria-hidden /> Open in Calendar
                    </a>
                  )}
                  {b.status === "confirmed" && view === "upcoming" && (
                    <ActionForm action={adminCancelBooking} submitLabel="Cancel" variant="outline" confirm="Cancel this consultation and notify the visitor?" className="flex flex-col gap-2">
                      <input type="hidden" name="id" value={b.id} />
                    </ActionForm>
                  )}
                  {view === "past" && (
                    <ActionForm action={deleteBooking} submitLabel="Delete" variant="danger" confirm="Permanently delete this booking record?" className="flex flex-col gap-2">
                      <input type="hidden" name="id" value={b.id} />
                    </ActionForm>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminPage>
  );
}
