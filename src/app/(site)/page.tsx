import Link from "next/link";
import Image from "next/image";
import { Anchor, ArrowRight, CalendarDays, CheckCircle2, MessageSquare, Sparkles, UserCheck } from "lucide-react";
import { getContent } from "@/lib/settings";
import { getPublishedCaseStudies, getPublishedServices, mediaUrl } from "@/lib/content";
import { ServiceIcon } from "@/components/ServiceIcon";
import { ContourLines } from "@/components/Decor";
import { CtaBand, Eyebrow, TextLink } from "@/components/Sections";

export default async function HomePage() {
  const [home, about, services, cases] = await Promise.all([
    getContent("home"),
    getContent("about"),
    getPublishedServices(),
    getPublishedCaseStudies(),
  ]);
  const featured = cases[0];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div className="chart-grid absolute inset-0" aria-hidden />
        <div
          className="absolute inset-0 bg-[radial-gradient(60rem_30rem_at_85%_-10%,rgba(42,104,169,0.45),transparent_60%)]"
          aria-hidden
        />
        <ContourLines className="absolute inset-x-0 bottom-0 h-56 w-full text-navy-300" />
        <div className="container-page relative grid grid-cols-1 items-center gap-12 py-16 sm:py-24 lg:grid-cols-12">
          <div className="animate-fade-up min-w-0 lg:col-span-7">
            <Eyebrow tone="light">{home.heroEyebrow}</Eyebrow>
            <h1 className="mt-5 text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">{home.heroTitle}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-100">{home.heroText}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/consultation" className="btn-primary px-6">
                <CalendarDays className="h-4 w-4" aria-hidden /> Book a Consultation
              </Link>
              <Link href="/contact" className="btn-ghost-light px-6">
                <MessageSquare className="h-4 w-4" aria-hidden /> Send a Message
              </Link>
            </div>
            <p className="mt-10 text-sm font-medium italic text-gold-300">The Silent Force Behind Smarter Software.</p>
          </div>

          {/* "What we do" panel — informative, not decorative */}
          <div className="min-w-0 lg:col-span-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 backdrop-blur-sm">
              <div className="flex items-center justify-between px-4 pb-2 pt-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-200">What we do</p>
                <p className="font-mono text-[11px] text-navy-300">13.83° N · 120.63° E</p>
              </div>
              <ul className="divide-y divide-white/[0.07]">
                {services.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/services/${s.slug}`}
                      className="group flex items-center gap-4 rounded-xl px-4 py-4 transition-colors hover:bg-white/[0.06]"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400 ring-1 ring-gold-500/25">
                        <ServiceIcon name={s.icon} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-white">{s.title}</span>
                        <span className="mt-0.5 block truncate text-sm text-navy-200">{s.summary}</span>
                      </span>
                      <ArrowRight
                        className="h-4 w-4 shrink-0 text-navy-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gold-400"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="container-page py-20 sm:py-24" aria-labelledby="services-heading">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Eyebrow>Services</Eyebrow>
            <h2 id="services-heading" className="mt-3 text-3xl font-bold sm:text-4xl">
              Four ways we help organizations work smarter
            </h2>
          </div>
          <TextLink href="/services">All services</TextLink>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {services.map((s, i) => (
            <Link
              key={s.id}
              href={`/services/${s.slug}`}
              className="card group relative flex flex-col p-7 transition-all hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-[0_12px_40px_-16px_rgba(14,44,75,0.25)]"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-600 ring-1 ring-navy-100">
                  <ServiceIcon name={s.icon} />
                </span>
                <span className="font-mono text-xs text-slate-400">0{i + 1}</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{s.summary}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {s.features.slice(0, 4).map((f) => (
                  <li key={f} className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-navy-800">
                    {f}
                  </li>
                ))}
              </ul>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600">
                Learn more
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Maritime expertise */}
      <section className="bg-surface" aria-labelledby="maritime-heading">
        <div className="container-page grid items-center gap-12 py-20 sm:py-24 lg:grid-cols-2">
          <div>
            <Eyebrow>Maritime expertise</Eyebrow>
            <h2 id="maritime-heading" className="mt-3 text-3xl font-bold sm:text-4xl">
              Technology grounded in real maritime operations
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              Auryx was founded by {about.founderName}, a maritime professional with hands-on experience as a Captain.
              That practical understanding of maritime operations shapes how we design systems for maritime schools and
              organizations.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <TextLink href="/services/maritime-school-systems">Maritime School Systems</TextLink>
              <TextLink href="/about">About Auryx</TextLink>
            </div>
          </div>
          <div className="card relative overflow-hidden p-8">
            <ContourLines className="absolute inset-0 h-full w-full text-navy-400" />
            <div className="relative">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 text-gold-400">
                <Anchor className="h-6 w-6" aria-hidden />
              </span>
              <blockquote className="mt-6 text-xl font-medium leading-relaxed text-ink">
                &ldquo;We understand the problem, we understand the technology, and we work with you to build a
                practical solution.&rdquo;
              </blockquote>
              <p className="mt-4 text-sm font-semibold text-navy-700">The Auryx approach</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Auryx */}
      <section className="container-page py-20 sm:py-24" aria-labelledby="why-heading">
        <div className="max-w-2xl">
          <Eyebrow>Why Auryx</Eyebrow>
          <h2 id="why-heading" className="mt-3 text-3xl font-bold sm:text-4xl">
            {home.whyTitle}
          </h2>
        </div>
        <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {home.whyItems.map((item) => (
            <li key={item.title} className="border-t-2 border-navy-100 pt-5">
              <CheckCircle2 className="h-5 w-5 text-gold-500" aria-hidden />
              <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{item.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Human-guided AI */}
      <section className="relative overflow-hidden bg-navy-900 text-white" aria-labelledby="ai-heading">
        <div className="chart-grid absolute inset-0" aria-hidden />
        <div className="container-page relative grid gap-10 py-16 sm:py-20 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <Eyebrow tone="light">AI, responsibly</Eyebrow>
            <h2 id="ai-heading" className="mt-3 text-3xl font-bold sm:text-4xl">
              {home.aiTitle}
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-navy-100">{home.aiText}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <Sparkles className="h-6 w-6 text-gold-400" aria-hidden />
              <p className="mt-4 font-semibold">AI accelerates</p>
              <p className="mt-1 text-sm text-navy-200">Development, automation and analysis, where it adds practical value.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <UserCheck className="h-6 w-6 text-gold-400" aria-hidden />
              <p className="mt-4 font-semibold">People decide</p>
              <p className="mt-1 text-sm text-navy-200">Every AI-assisted result is guided and reviewed by our team.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured case study */}
      {featured && (
        <section className="container-page py-20 sm:py-24" aria-labelledby="case-heading">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <Eyebrow>Case study</Eyebrow>
              <h2 id="case-heading" className="mt-3 text-3xl font-bold sm:text-4xl">
                Our work in practice
              </h2>
            </div>
            <TextLink href="/case-studies">All case studies</TextLink>
          </div>
          <Link
            href={`/case-studies/${featured.slug}`}
            className="card group mt-10 grid overflow-hidden transition-shadow hover:shadow-[0_12px_40px_-16px_rgba(14,44,75,0.25)] md:grid-cols-2"
          >
            <div className="relative aspect-[16/10] bg-navy-900 md:aspect-auto md:min-h-72">
              {featured.coverImageId ? (
                <Image
                  src={mediaUrl(featured.coverImageId)}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="chart-grid absolute inset-0 flex items-center justify-center">
                  <ContourLines className="absolute inset-0 h-full w-full text-navy-300" />
                  <Anchor className="relative h-12 w-12 text-gold-500" aria-hidden />
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center p-8 sm:p-10">
              <h3 className="text-2xl font-bold">{featured.title}</h3>
              <p className="mt-3 leading-relaxed text-muted">{featured.summary}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {featured.features.slice(0, 5).map((f) => (
                  <li key={f} className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-navy-800">
                    {f}
                  </li>
                ))}
              </ul>
              <span className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600">
                Read the case study
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </div>
          </Link>
        </section>
      )}

      {/* Getting started */}
      <section className="bg-surface" aria-labelledby="start-heading">
        <div className="container-page py-20 sm:py-24">
          <div className="max-w-2xl">
            <Eyebrow>Getting started</Eyebrow>
            <h2 id="start-heading" className="mt-3 text-3xl font-bold sm:text-4xl">
              A simple first conversation
            </h2>
          </div>
          <ol className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              ["Reach out", "Send us a message or book a consultation at a time that suits you."],
              ["Talk it through", "We listen to your goals and learn how your current process works."],
              ["Find a practical path", "Together we explore whether and how technology can help."],
            ].map(([title, text], i) => (
              <li key={title} className="card p-7">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 font-mono text-sm font-semibold text-gold-400">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CtaBand title={home.ctaTitle} text={home.ctaText} />
    </>
  );
}
