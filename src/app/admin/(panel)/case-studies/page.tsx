import Link from "next/link";
import Image from "next/image";
import { asc, desc } from "drizzle-orm";
import { BookOpen, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { mediaUrl } from "@/lib/content";
import { AdminPage, Badge, EmptyState, NeedsReview, fmtDate } from "@/components/admin/ui";

export const metadata = { title: "Case studies" };

export default async function AdminCaseStudiesPage() {
  await requireAdmin();
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.caseStudies)
    .orderBy(asc(schema.caseStudies.sortOrder), desc(schema.caseStudies.updatedAt));

  return (
    <AdminPage
      title="Case studies"
      description="Only publish outcomes and details that are verified and approved for disclosure."
      actions={
        <Link href="/admin/case-studies/new" className="btn-navy">
          <Plus className="h-4 w-4" aria-hidden /> New case study
        </Link>
      }
    >
      {rows.length === 0 ? (
        <EmptyState>No case studies yet.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {rows.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/case-studies/${c.id}`} className="card flex items-center gap-4 p-4 hover:border-navy-200">
                <span className="relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-navy-900">
                  {c.coverImageId ? (
                    <Image src={mediaUrl(c.coverImageId)} alt="" fill sizes="96px" className="object-cover" />
                  ) : (
                    <BookOpen className="h-6 w-6 text-gold-400" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{c.title}</span>
                  <span className="block truncate text-sm text-muted">{c.summary}</span>
                  <span className="text-xs text-muted">Updated {fmtDate(c.updatedAt)}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center">
                  {c.needsReview && <NeedsReview />}
                  <Badge kind={c.status}>{c.status}</Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminPage>
  );
}
