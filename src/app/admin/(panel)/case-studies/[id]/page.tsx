import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { mediaUrl } from "@/lib/content";
import { ActionForm } from "@/components/admin/ActionForm";
import { AdminPage, Checkbox, Input, Panel, Select, Textarea } from "@/components/admin/ui";
import {
  addGalleryImage,
  deleteCaseStudy,
  removeCover,
  removeGalleryImage,
  saveCaseStudy,
} from "../../../actions/case-studies";

export const metadata = { title: "Edit case study" };

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft (not visible)" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived (hidden)" },
];

export default async function EditCaseStudyPage(props: PageProps<"/admin/case-studies/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const isNew = id === "new";
  const db = await getDb();
  let c: typeof schema.caseStudies.$inferSelect | undefined;
  let coverAlt = "";
  let gallery: { id: string; imageId: string; caption: string; alt: string }[] = [];

  if (!isNew) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    [c] = await db.select().from(schema.caseStudies).where(eq(schema.caseStudies.id, id));
    if (!c) notFound();
    if (c.coverImageId) {
      [{ alt: coverAlt }] = await db.select({ alt: schema.images.alt }).from(schema.images).where(eq(schema.images.id, c.coverImageId));
    }
    gallery = await db
      .select({ id: schema.caseStudyImages.id, imageId: schema.caseStudyImages.imageId, caption: schema.caseStudyImages.caption, alt: schema.images.alt })
      .from(schema.caseStudyImages)
      .innerJoin(schema.images, eq(schema.images.id, schema.caseStudyImages.imageId))
      .where(eq(schema.caseStudyImages.caseStudyId, c.id))
      .orderBy(asc(schema.caseStudyImages.sortOrder), asc(schema.caseStudyImages.createdAt));
  }

  return (
    <AdminPage
      title={isNew ? "New case study" : c!.title}
      actions={
        <>
          {c?.status === "published" && (
            <Link href={`/case-studies/${c.slug}`} target="_blank" className="btn-outline">
              <ExternalLink className="h-4 w-4" aria-hidden /> View
            </Link>
          )}
          <Link href="/admin/case-studies" className="btn-outline">
            <ArrowLeft className="h-4 w-4" aria-hidden /> All case studies
          </Link>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <ActionForm action={saveCaseStudy} submitLabel={isNew ? "Create case study" : "Save changes"}>
            {c && <input type="hidden" name="id" value={c.id} />}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Project title" name="title" defaultValue={c?.title} required maxLength={200} />
              <Input label="URL slug" name="slug" defaultValue={c?.slug} hint="Leave empty to generate from the title." maxLength={120} />
            </div>
            <Textarea label="Summary" name="summary" defaultValue={c?.summary} rows={2} required maxLength={600} />

            <div className="rounded-xl border border-line p-4">
              <p className="mb-3 text-sm font-semibold">Cover / header image</p>
              {c?.coverImageId && (
                <div className="relative mb-3 aspect-[21/9] overflow-hidden rounded-lg bg-surface">
                  <Image src={mediaUrl(c.coverImageId)} alt={coverAlt} fill sizes="600px" className="object-cover" />
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="f-cover" className="field-label">
                    {c?.coverImageId ? "Replace image" : "Upload image"}
                  </label>
                  <input id="f-cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="field py-2" />
                  <p className="mt-1 text-xs text-muted">JPEG, PNG, WebP or GIF · max 4 MB · landscape works best.</p>
                </div>
                <Input label="Image description (alt text)" name="coverAlt" defaultValue={coverAlt} maxLength={300} />
              </div>
            </div>

            <Textarea label="Client / business context (only where disclosure is approved)" name="clientContext" defaultValue={c?.clientContext} rows={3} maxLength={3000} />
            <Textarea label="Business problem / challenge" name="challenge" defaultValue={c?.challenge} rows={3} maxLength={3000} />
            <Textarea label="Auryx solution" name="solution" defaultValue={c?.solution} rows={3} maxLength={3000} />
            <Textarea label="Key features" name="features" defaultValue={c?.features.join("\n")} rows={5} hint="One per line." />
            <Textarea label="Technology / integration details (where approved)" name="technology" defaultValue={c?.technology} rows={3} maxLength={3000} />
            <Textarea
              label="Outcome / results (verified only)"
              name="outcome"
              defaultValue={c?.outcome}
              rows={3}
              maxLength={3000}
              hint="Leave empty unless results are verified and approved. Never state compliance guarantees without evidence and authorization."
            />
            <Textarea label="Additional content (Markdown)" name="body" defaultValue={c?.body} rows={6} maxLength={20000} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Publication status" name="status" defaultValue={c?.status ?? "draft"} options={STATUS_OPTIONS} />
              <Input label="Sort order" name="sortOrder" type="number" min={0} max={999} defaultValue={c?.sortOrder ?? 0} />
            </div>
            <Checkbox label="Needs Auryx review" name="needsReview" defaultChecked={c?.needsReview ?? true} />
          </ActionForm>
        </Panel>

        {c && (
          <div className="space-y-6">
            <Panel title="Project images">
              {gallery.length > 0 && (
                <ul className="mb-5 space-y-3">
                  {gallery.map((g) => (
                    <li key={g.id} className="flex items-center gap-3">
                      <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-surface">
                        <Image src={mediaUrl(g.imageId)} alt={g.alt} fill sizes="80px" className="object-cover" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">{g.caption || g.alt}</span>
                      <ActionForm action={removeGalleryImage} submitLabel="Remove" variant="outline" confirm="Remove this image?" className="flex">
                        <input type="hidden" name="id" value={g.id} />
                      </ActionForm>
                    </li>
                  ))}
                </ul>
              )}
              <ActionForm action={addGalleryImage} submitLabel="Upload image" resetOnSuccess className="space-y-3">
                <input type="hidden" name="caseStudyId" value={c.id} />
                <div>
                  <label htmlFor="f-image" className="field-label">
                    Image
                  </label>
                  <input id="f-image" name="image" type="file" required accept="image/jpeg,image/png,image/webp,image/gif" className="field py-2" />
                </div>
                <Input label="Alt text" name="alt" required maxLength={300} />
                <Input label="Caption" name="caption" maxLength={300} />
              </ActionForm>
            </Panel>
            {c.coverImageId && (
              <Panel title="Cover image">
                <ActionForm action={removeCover} submitLabel="Remove cover image" variant="outline" confirm="Remove the cover image?">
                  <input type="hidden" name="id" value={c.id} />
                </ActionForm>
              </Panel>
            )}
            <Panel title="Delete case study">
              <p className="mb-4 text-sm text-muted">To hide it but keep it, set the status to Archived.</p>
              <ActionForm action={deleteCaseStudy} submitLabel="Delete permanently" variant="danger" confirm="Delete this case study and its images permanently?">
                <input type="hidden" name="id" value={c.id} />
              </ActionForm>
            </Panel>
          </div>
        )}
      </div>
    </AdminPage>
  );
}
