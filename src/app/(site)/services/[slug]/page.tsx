import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { getPublishedServices, getServiceBySlug } from "@/lib/content";
import { ServiceIcon } from "@/components/ServiceIcon";
import { Markdown } from "@/components/Markdown";
import { CtaBand, PageHero } from "@/components/Sections";

export async function generateMetadata(props: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const s = await getServiceBySlug(slug);
  if (!s) return { title: "Service not found" };
  return {
    title: s.title,
    description: s.summary,
    alternates: { canonical: `/services/${s.slug}` },
    openGraph: { title: `${s.title} · Auryx Software`, description: s.summary },
  };
}

export default async function ServicePage(props: PageProps<"/services/[slug]">) {
  const { slug } = await props.params;
  const [service, all] = await Promise.all([getServiceBySlug(slug), getPublishedServices()]);
  if (!service) notFound();
  const others = all.filter((s) => s.id !== service.id);

  return (
    <>
      <PageHero eyebrow="Service" title={service.title} text={service.summary}>
        <Link
          href="/services"
          className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-navy-200 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> All services
        </Link>
      </PageHero>
      <section className="container-page grid gap-12 py-20 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Markdown className="prose-lg">{service.body}</Markdown>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/consultation" className="btn-navy">
              Book a Consultation
            </Link>
            <Link href="/contact" className="btn-outline">
              Send a Message
            </Link>
          </div>
        </div>
        <aside className="lg:col-span-5">
          <div className="card p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-gold-400">
                <ServiceIcon name={service.icon} />
              </span>
              <h2 className="font-semibold">What this can include</h2>
            </div>
            <ul className="mt-6 space-y-3">
              {service.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          {others.length > 0 && (
            <nav aria-label="Other services" className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Other services</h2>
              <ul className="mt-3 space-y-1">
                {others.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/services/${o.slug}`}
                      className="block rounded-lg px-3 py-2 text-navy-700 hover:bg-navy-50"
                    >
                      {o.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </aside>
      </section>
      <CtaBand />
    </>
  );
}
