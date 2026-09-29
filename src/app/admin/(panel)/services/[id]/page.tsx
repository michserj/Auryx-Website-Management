import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { ActionForm } from "@/components/admin/ActionForm";
import { SERVICE_ICON_NAMES } from "@/components/admin/icon-names";
import { AdminPage, Checkbox, Input, Panel, Select, Textarea } from "@/components/admin/ui";
import { deleteService, saveService } from "../../../actions/services";

export const metadata = { title: "Edit service" };

export default async function EditServicePage(props: PageProps<"/admin/services/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const isNew = id === "new";
  let s: typeof schema.services.$inferSelect | undefined;
  if (!isNew) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    const db = await getDb();
    [s] = await db.select().from(schema.services).where(eq(schema.services.id, id));
    if (!s) notFound();
  }

  return (
    <AdminPage
      title={isNew ? "New service" : s!.title}
      actions={
        <>
          {s?.published && (
            <Link href={`/services/${s.slug}`} target="_blank" className="btn-outline">
              <ExternalLink className="h-4 w-4" aria-hidden /> View
            </Link>
          )}
          <Link href="/admin/services" className="btn-outline">
            <ArrowLeft className="h-4 w-4" aria-hidden /> All services
          </Link>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <ActionForm action={saveService} submitLabel={isNew ? "Create service" : "Save changes"}>
            {s && <input type="hidden" name="id" value={s.id} />}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Title" name="title" defaultValue={s?.title} required maxLength={150} />
              <Input label="URL slug" name="slug" defaultValue={s?.slug} hint="Leave empty to generate from the title." maxLength={100} />
            </div>
            <Textarea label="Summary" name="summary" defaultValue={s?.summary} rows={2} required maxLength={500} />
            <Textarea label="Description (Markdown)" name="body" defaultValue={s?.body} rows={8} maxLength={10000} />
            <Textarea label="Features" name="features" defaultValue={s?.features.join("\n")} rows={6} hint="One per line." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Icon" name="icon" defaultValue={s?.icon ?? "code"} options={SERVICE_ICON_NAMES.map((n) => ({ value: n, label: n }))} />
              <Input label="Sort order" name="sortOrder" type="number" min={0} max={999} defaultValue={s?.sortOrder ?? 0} />
            </div>
            <div className="flex flex-wrap gap-6">
              <Checkbox label="Published" name="published" defaultChecked={s?.published ?? true} />
              <Checkbox label="Needs Auryx review" name="needsReview" defaultChecked={s?.needsReview ?? false} />
            </div>
          </ActionForm>
        </Panel>
        {s && (
          <Panel title="Delete service">
            <p className="mb-4 text-sm text-muted">To hide it temporarily, untick “Published” instead.</p>
            <ActionForm action={deleteService} submitLabel="Delete" variant="danger" confirm="Delete this service permanently?">
              <input type="hidden" name="id" value={s.id} />
            </ActionForm>
          </Panel>
        )}
      </div>
    </AdminPage>
  );
}
