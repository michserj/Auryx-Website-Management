import Link from "next/link";
import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { INQUIRY_STATUS_LABEL } from "@/lib/inquiries";
import { AdminPage, Badge, EmptyState, Pagination, fmtDate } from "@/components/admin/ui";

export const metadata = { title: "Contact inquiries" };
const PER_PAGE = 20;

export default async function InquiriesPage(props: PageProps<"/admin/inquiries">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const status = typeof sp.status === "string" && (schema.inquiryStatus as readonly string[]).includes(sp.status) ? sp.status : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const filters: SQL[] = [];
  if (status) filters.push(eq(schema.inquiries.status, status as (typeof schema.inquiryStatus)[number]));
  if (q) {
    const like = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
    filters.push(
      or(
        ilike(schema.inquiries.name, like),
        ilike(schema.inquiries.email, like),
        ilike(schema.inquiries.phone, like),
        ilike(schema.inquiries.message, like),
      )!,
    );
  }
  const where = filters.length ? and(...filters) : undefined;

  const db = await getDb();
  const [[total], rows] = await Promise.all([
    db.select({ n: count() }).from(schema.inquiries).where(where),
    db
      .select()
      .from(schema.inquiries)
      .where(where)
      .orderBy(desc(schema.inquiries.createdAt))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
  ]);
  const base = `/admin/inquiries?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}) })}`;

  return (
    <AdminPage title="Contact inquiries" description="Messages sent through the website Contact form. Retained for the configured period.">
      <form className="card mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-end" role="search">
        <div className="flex-1">
          <label htmlFor="q" className="field-label">
            Search
          </label>
          <input id="q" name="q" defaultValue={q} placeholder="Name, email, phone or message" className="field" />
        </div>
        <div>
          <label htmlFor="status" className="field-label">
            Status
          </label>
          <select id="status" name="status" defaultValue={status} className="field">
            <option value="">All</option>
            {schema.inquiryStatus.map((s) => (
              <option key={s} value={s}>
                {INQUIRY_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-navy">Filter</button>
      </form>

      {rows.length === 0 ? (
        <EmptyState>No inquiries match.</EmptyState>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-3">Received</th>
                <th scope="col" className="px-4 py-3">Name</th>
                <th scope="col" className="px-4 py-3">Contact</th>
                <th scope="col" className="px-4 py-3">Message</th>
                <th scope="col" className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-surface">
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtDate(r.createdAt)}</td>
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/inquiries/${r.id}`} className="text-navy-700 hover:underline">
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{r.email ?? r.phone ?? "Not provided"}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-muted">{r.message}</td>
                  <td className="px-4 py-3">
                    <Badge kind={r.status}>{INQUIRY_STATUS_LABEL[r.status]}</Badge>
                    {r.emailError && <span className="ml-2 text-xs text-orange-700" title="Email notification failed">⚠ email</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={Math.ceil(total.n / PER_PAGE)} base={base} />
    </AdminPage>
  );
}
