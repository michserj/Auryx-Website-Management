import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { getPublishedServices } from "@/lib/content";
import { ServiceIcon } from "@/components/ServiceIcon";
import { CtaBand, PageHero } from "@/components/Sections";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Maritime School Systems, Business Process Automation, Custom Software Development, and IT Consultation & System Integration from Auryx Software.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const services = await getPublishedServices();
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Practical software and technology services"
        text="From maritime education platforms to business automation, we build and connect the systems your organization depends on. AI is used where it adds practical value, guided and reviewed by people."
      />
      <section className="container-page space-y-6 py-20">
        {services.map((s, i) => (
          <article key={s.id} id={s.slug} className="card grid gap-8 p-7 sm:p-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-gold-400">
                  <ServiceIcon name={s.icon} />
                </span>
                <span className="font-mono text-xs text-slate-400">0{i + 1}</span>
              </div>
              <h2 className="mt-5 text-2xl font-bold sm:text-3xl">{s.title}</h2>
              <p className="mt-3 text-lg leading-relaxed text-muted">{s.summary}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href={`/services/${s.slug}`} className="btn-outline">
                  Learn more <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link href="/consultation" className="btn-navy">
                  Discuss your needs
                </Link>
              </div>
            </div>
            <ul className="grid content-start gap-3 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
              {s.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[15px]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </article>
        ))}
        {services.length === 0 && <p className="text-muted">Service information will be available soon.</p>}
      </section>
      <CtaBand
        title="Not sure which service fits?"
        text="Describe your challenge and we'll help you figure out a sensible next step."
      />
    </>
  );
}
