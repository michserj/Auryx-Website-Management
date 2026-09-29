import Link from "next/link";
import { asc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { ServiceIcon } from "@/components/ServiceIcon";
import { AdminPage, Badge, EmptyState, NeedsReview } from "@/components/admin/ui";

export const metadata = { title: "Services" };

export default async function AdminServicesPage() {
  await requireAdmin();
  const db = await getDb();
  const rows = await db.select().from(schema.services).orderBy(asc(schema.services.sortOrder), asc(schema.services.title));
  return (
    <AdminPage
      title="Services"
      description="Service descriptions shown on the website and used as chatbot knowledge."
      actions={
        <Link href="/admin/services/new" className="btn-navy">
          <Plus className="h-4 w-4" aria-hidden /> New service
        </Link>
      }
    >
      {rows.length === 0 ? (
        <EmptyState>No services yet.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {rows.map((s) => (
            <li key={s.id}>
              <Link href={`/admin/services/${s.id}`} className="card flex items-center gap-4 p-5 hover:border-navy-200">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-gold-400">
                  <ServiceIcon name={s.icon} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{s.title}</span>
                  <span className="block truncate text-sm text-muted">{s.summary}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {s.needsReview && <NeedsReview />}
                  <Badge kind={s.published ? "published" : "draft"}>{s.published ? "Published" : "Hidden"}</Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminPage>
  );
}
