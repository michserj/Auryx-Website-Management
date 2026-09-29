import { requireAdmin } from "@/lib/auth";
import { getContent, getContentMeta } from "@/lib/settings";
import { ActionForm } from "@/components/admin/ActionForm";
import { AdminPage, Checkbox, Input, NeedsReview, Panel, Textarea, fmtDate } from "@/components/admin/ui";
import { saveAbout, saveHome, savePrivacy, saveSite } from "../../actions/content";

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
