import { requireAdmin } from "@/lib/auth";
import { getContent, getContentMeta } from "@/lib/settings";
import { ActionForm } from "@/components/admin/ActionForm";
import { AdminPage, Checkbox, Input, NeedsReview, Panel, Textarea, fmtDate } from "@/components/admin/ui";
import Image from "next/image";
import { BulbMark } from "@/components/Logo";
import { mediaUrl } from "@/lib/content";
import { removeFounderPhoto, saveAbout, saveFounderPhoto, savePrivacy, saveHome, saveSite } from "../../actions/content";

export const metadata = { title: "Pages & About" };

const toLines = (items: { title: string; text: string }[]) => items.map((i) => `${i.title} | ${i.text}`).join("\n");

export default async function ContentPage() {
  await requireAdmin();
  const [home, about, site, privacy, homeMeta, aboutMeta, privacyMeta] = await Promise.all([
    getContent("home"),
    getContent("about"),
    getContent("site"),
    getContent("privacy"),
    getContentMeta("home"),
    getContentMeta("about"),
    getContentMeta("privacy"),
  ]);

  return (
    <AdminPage
      title="Pages & About"
      description="Edit approved website copy. Only publish information Auryx can substantiate, with no unverified statistics, clients, certifications or guarantees."
    >
      <nav aria-label="Sections" className="mb-6 flex flex-wrap gap-2 text-sm">
        {[
          ["#site", "General"],
          ["#home", "Home page"],
          ["#about", "About page"],
          ["#founder-photo", "Founder photo"],
          ["#privacy", "Privacy notice"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="rounded-lg bg-white px-3 py-1.5 font-medium text-navy-700 ring-1 ring-line hover:bg-navy-50">
            {label}
          </a>
        ))}
      </nav>

      <div className="space-y-6">
        <Panel title="General" className="scroll-mt-6">
          <span id="site" />
          <ActionForm action={saveSite}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Contact email (receives inquiries)" name="contactEmail" type="email" defaultValue={site.contactEmail} required />
              <Input label="Location" name="location" defaultValue={site.location} required />
            </div>
            <Input label="Tagline" name="tagline" defaultValue={site.tagline} required />
          </ActionForm>
        </Panel>

        <Panel className="scroll-mt-6">
          <span id="home" />
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Home page</h2>
            <span className="flex items-center gap-2 text-xs text-muted">
              {homeMeta.needsReview && <NeedsReview />} Updated {fmtDate(homeMeta.updatedAt)}
            </span>
          </div>
          <ActionForm action={saveHome}>
            <Input label="Hero eyebrow" name="heroEyebrow" defaultValue={home.heroEyebrow} required />
            <Input label="Hero headline (H1)" name="heroTitle" defaultValue={home.heroTitle} required />
            <Textarea label="Hero text" name="heroText" defaultValue={home.heroText} rows={3} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="AI section title" name="aiTitle" defaultValue={home.aiTitle} required />
              <Input label="“Why Auryx” title" name="whyTitle" defaultValue={home.whyTitle} required />
            </div>
            <Textarea label="AI section text" name="aiText" defaultValue={home.aiText} rows={3} required />
            <Textarea
              label="“Why Auryx” items"
              name="whyItems"
              defaultValue={toLines(home.whyItems)}
              rows={7}
              hint="One per line, formatted as: Title | Description"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Closing CTA title" name="ctaTitle" defaultValue={home.ctaTitle} required />
              <Input label="Closing CTA text" name="ctaText" defaultValue={home.ctaText} required />
            </div>
            <Checkbox label="Needs Auryx review" name="needsReview" defaultChecked={homeMeta.needsReview} />
          </ActionForm>
        </Panel>

        <Panel className="scroll-mt-6">
          <span id="about" />
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold">About page</h2>
            <span className="flex items-center gap-2 text-xs text-muted">
              {aboutMeta.needsReview && <NeedsReview />} Updated {fmtDate(aboutMeta.updatedAt)}
            </span>
          </div>
          <ActionForm action={saveAbout}>
            <Input label="Intro headline" name="intro" defaultValue={about.intro} required />
            <Textarea label="Company description" name="description" defaultValue={about.description} rows={4} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Founder name" name="founderName" defaultValue={about.founderName} required />
              <Input label="Founder role" name="founderRole" defaultValue={about.founderRole} required />
            </div>
            <Textarea label="Founder description" name="founderBio" defaultValue={about.founderBio} rows={4} required />
            <Input label="Approach section title" name="approachTitle" defaultValue={about.approachTitle} required />
            <Textarea label="Approach items" name="approach" defaultValue={toLines(about.approach)} rows={4} hint="One per line: Title | Description" />
            <Checkbox label="Needs Auryx review" name="needsReview" defaultChecked={aboutMeta.needsReview} />
          </ActionForm>
        </Panel>

        <Panel title="Founder photo" className="scroll-mt-6">
          <span id="founder-photo" />
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="relative flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-navy-950">
              {about.founderImageId ? (
                <Image src={mediaUrl(about.founderImageId)} alt={about.founderImageAlt ?? ""} fill sizes="160px" className="object-cover" />
              ) : (
                <BulbMark tone="light" className="h-16 w-16" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-4">
              <p className="text-sm text-muted">
                {about.founderImageId
                  ? "This photo is shown on the About page."
                  : "No photo uploaded yet, so the About page shows the Auryx bulb logo."}{" "}
                Use a square or portrait photo (JPEG, PNG or WebP, max 4 MB).
              </p>
              <ActionForm action={saveFounderPhoto} submitLabel={about.founderImageId ? "Save" : "Upload photo"} resetOnSuccess>
                <div>
                  <label htmlFor="f-founderImage" className="field-label">
                    {about.founderImageId ? "Replace photo (optional)" : "Photo"}
                  </label>
                  <input id="f-founderImage" name="founderImage" type="file" accept="image/jpeg,image/png,image/webp" className="field py-2" />
                </div>
                <Input
                  label="Photo description (alt text)"
                  name="founderImageAlt"
                  defaultValue={about.founderImageAlt}
                  placeholder={`${about.founderName}, ${about.founderRole} of Auryx Software`}
                  maxLength={300}
                  hint="Read aloud by screen readers. Leave empty to use the founder's name and role."
                />
              </ActionForm>
              {about.founderImageId && (
                <ActionForm action={removeFounderPhoto} submitLabel="Remove photo" variant="outline" confirm="Remove the founder photo? The bulb logo will be shown instead." />
              )}
            </div>
          </div>
        </Panel>

        <Panel className="scroll-mt-6">
          <span id="privacy" />
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Privacy notice</h2>
            <span className="flex items-center gap-2 text-xs text-muted">
              {privacyMeta.needsReview && <NeedsReview />} Updated {fmtDate(privacyMeta.updatedAt)}
            </span>
          </div>
          <p className="mb-4 rounded-lg bg-surface p-3 text-sm text-muted">
            The final notice must be approved by the responsible Auryx person. Change the version whenever the wording changes, because each
            inquiry and booking records the version the visitor acknowledged. Supports Markdown.
          </p>
          <ActionForm action={savePrivacy}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Version" name="version" defaultValue={privacy.version} required />
              <Input label="Last updated" name="lastUpdated" type="date" defaultValue={privacy.lastUpdated} required />
            </div>
            <Textarea label="Notice (Markdown)" name="body" defaultValue={privacy.body} rows={22} required />
            <Checkbox label="Needs Auryx review (draft)" name="needsReview" defaultChecked={privacyMeta.needsReview} />
          </ActionForm>
        </Panel>
      </div>
    </AdminPage>
  );
}
