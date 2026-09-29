import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { getCaseStudyBySlug, mediaUrl } from "@/lib/content";
import { Markdown } from "@/components/Markdown";
import { CtaBand, Eyebrow, PageHero } from "@/components/Sections";

export async function generateMetadata(props: PageProps<"/case-studies/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const c = await getCaseStudyBySlug(slug);
  if (!c) return { title: "Case study not found" };
  return {
    title: c.title,
    description: c.summary,
    alternates: { canonical: `/case-studies/${c.slug}` },
    openGraph: {
      type: "article",
      title: `${c.title} · Auryx Software`,
      description: c.summary,
      images: c.coverImageId ? [{ url: mediaUrl(c.coverImageId) }] : undefined,
    },
  };
}

function Block({ title, text }: { title: string; text: string }) {
  if (!text.trim()) return null;
  return (
    <section>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-3 whitespace-pre-line text-lg leading-relaxed text-muted">{text}</p>
    </section>
  );
}

export default async function CaseStudyPage(props: PageProps<"/case-studies/[slug]">) {
  const { slug } = await props.params;
  const c = await getCaseStudyBySlug(slug);
  if (!c) notFound();

  return (
    <>
      <PageHero eyebrow="Case Study" title={c.title} text={c.summary}>
        <Link
          href="/case-studies"
          className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-navy-200 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> All case studies
        </Link>
      </PageHero>

      {c.coverImageId && (
        <div className="container-page -mt-4 sm:-mt-8">
          <div className="relative aspect-[21/9] overflow-hidden rounded-2xl border border-line bg-navy-900 shadow-lg">
            <Image
              src={mediaUrl(c.coverImageId)}
              alt={c.coverAlt}
              fill
              priority
              sizes="(min-width: 1152px) 1152px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      )}

      <article className="container-page grid gap-12 py-16 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-8">
          <Block title="Context" text={c.clientContext} />
          <Block title="The challenge" text={c.challenge} />
          <Block title="The solution" text={c.solution} />
          <Block title="Technology & integration" text={c.technology} />
          <Block title="Outcome" text={c.outcome} />
          {c.body.trim() && <Markdown>{c.body}</Markdown>}

          {c.gallery.length > 0 && (
            <section aria-labelledby="gallery-heading">
              <h2 id="gallery-heading" className="text-xl font-bold">
                Project images
              </h2>
              <ul className="mt-5 grid gap-5 sm:grid-cols-2">
                {c.gallery.map((g) => (
                  <li key={g.id}>
                    <figure>
                      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-surface">
                        <Image
                          src={mediaUrl(g.imageId)}
                          alt={g.alt || g.caption}
                          fill
                          sizes="(min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                        />
                      </div>
                      {g.caption && <figcaption className="mt-2 text-sm text-muted">{g.caption}</figcaption>}
                    </figure>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {c.features.length > 0 && (
          <aside className="lg:col-span-4">
            <div className="card sticky top-24 p-7">
              <Eyebrow>Key features</Eyebrow>
              <ul className="mt-5 space-y-3">
                {c.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </article>

      <CtaBand
        title="Want to discuss a similar problem?"
        text="Tell us about your organization's needs and we'll explore what a practical solution could look like."
      />
    </>
  );
}
