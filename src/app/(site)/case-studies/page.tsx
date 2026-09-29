import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Anchor, ArrowRight } from "lucide-react";
import { getPublishedCaseStudies, mediaUrl } from "@/lib/content";
import { ContourLines } from "@/components/Decor";
import { CtaBand, PageHero } from "@/components/Sections";

export const metadata: Metadata = {
  title: "Case Studies",
  description: "Examples of software and automation solutions developed by Auryx Software.",
  alternates: { canonical: "/case-studies" },
};

export default async function CaseStudiesPage() {
  const cases = await getPublishedCaseStudies();
  return (
    <>
      <PageHero
        eyebrow="Case Studies"
        title="Our work in practice"
        text="A closer look at problems we've worked on and the solutions we developed."
      />
      <section className="container-page py-20">
        {cases.length === 0 ? (
          <p className="text-muted">Case studies will be published here soon.</p>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2">
            {cases.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/case-studies/${c.slug}`}
                  className="card group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-[0_12px_40px_-16px_rgba(14,44,75,0.25)]"
                >
                  <div className="relative aspect-[16/9] bg-navy-900">
                    {c.coverImageId ? (
                      <Image
                        src={mediaUrl(c.coverImageId)}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 50vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="chart-grid absolute inset-0 flex items-center justify-center">
                        <ContourLines className="absolute inset-0 h-full w-full text-navy-300" />
                        <Anchor className="relative h-10 w-10 text-gold-500" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-7">
                    <h2 className="text-xl font-bold">{c.title}</h2>
                    <p className="mt-2 flex-1 leading-relaxed text-muted">{c.summary}</p>
                    <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600">
                      Read the case study
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <CtaBand title="Facing a similar challenge?" text="Let's discuss whether a similar approach could work for your organization." />
    </>
  );
}
