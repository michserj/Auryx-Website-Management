import type { Metadata } from "next";
import { Anchor, Mail, MapPin } from "lucide-react";
import { getContent } from "@/lib/settings";
import { CtaBand, Eyebrow, PageHero } from "@/components/Sections";
import Image from "next/image";
import { BulbMark } from "@/components/Logo";
import { mediaUrl } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Auryx Software is a technology company that helps businesses turn ideas and operational challenges into practical software solutions, with particular expertise in maritime systems.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const [about, site] = await Promise.all([getContent("about"), getContent("site")]);
  return (
    <>
      <PageHero eyebrow="About Auryx" title={about.intro} />

      <section className="container-page grid gap-12 py-20 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Eyebrow>Who we are</Eyebrow>
          <p className="mt-5 text-xl leading-relaxed text-ink sm:text-2xl sm:leading-relaxed">{about.description}</p>
          <p className="mt-6 text-lg font-medium italic text-navy-600">{site.tagline}</p>
        </div>
        <aside className="lg:col-span-5">
          <div className="card space-y-5 p-7">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">At a glance</h2>
            <p className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-navy-600" aria-hidden />
              <span>{site.location}</span>
            </p>
            <p className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-navy-600" aria-hidden />
              <a href={`mailto:${site.contactEmail}`} className="text-navy-700 underline-offset-2 hover:underline">
                {site.contactEmail}
              </a>
            </p>
            <p className="flex items-start gap-3">
              <Anchor className="mt-0.5 h-5 w-5 shrink-0 text-navy-600" aria-hidden />
              <span>Particular expertise in maritime systems and processes</span>
            </p>
          </div>
        </aside>
      </section>

      <section className="bg-surface" aria-labelledby="founder-heading">
        <div className="container-page grid gap-10 py-20 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-4">
            <div className="relative mx-auto flex aspect-square max-w-xs items-center justify-center overflow-hidden rounded-3xl bg-navy-950">
              {about.founderImageId ? (
                <Image
                  src={mediaUrl(about.founderImageId)}
                  alt={about.founderImageAlt || `${about.founderName}, ${about.founderRole} of Auryx Software`}
                  fill
                  sizes="(min-width: 1024px) 320px, 80vw"
                  className="object-cover"
                />
              ) : (
                <>
                  <div className="chart-grid absolute inset-0" aria-hidden />
                  <BulbMark tone="light" className="relative h-24 w-24" />
                </>
              )}
            </div>
          </div>
          <div className="lg:col-span-8">
            <Eyebrow>Founder</Eyebrow>
            <h2 id="founder-heading" className="mt-3 text-3xl font-bold">
              {about.founderName}
            </h2>
            <p className="mt-1 font-medium text-navy-600">{about.founderRole}, Auryx Software</p>
            <p className="mt-6 text-lg leading-relaxed text-muted">{about.founderBio}</p>
          </div>
        </div>
      </section>

      <section className="container-page py-20" aria-labelledby="approach-heading">
        <Eyebrow>Our approach</Eyebrow>
        <h2 id="approach-heading" className="mt-3 text-3xl font-bold">
          {about.approachTitle}
        </h2>
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {about.approach.map((a) => (
            <li key={a.title} className="card p-7">
              <h3 className="text-lg font-semibold">{a.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{a.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <CtaBand />
    </>
  );
}
