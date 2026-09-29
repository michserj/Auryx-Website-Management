import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { Logo } from "./Logo";
import { NAV } from "./nav";
import type { SiteSettings } from "@/lib/content-defaults";

export function SiteFooter({ site, services }: { site: SiteSettings; services: { slug: string; title: string }[] }) {
  return (
    <footer className="relative overflow-hidden bg-navy-950 text-navy-100">
      <div className="chart-grid absolute inset-0 opacity-60" aria-hidden />
      <div className="container-page relative grid gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo tone="light" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-navy-200">{site.tagline}</p>
          <ul className="mt-6 space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden />
              <a href={`mailto:${site.contactEmail}`} className="hover:text-white">
                {site.contactEmail}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden />
              <span>{site.location}</span>
            </li>
          </ul>
        </div>

        <nav aria-label="Footer" className="md:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white">Company</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="hover:text-white">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white">Services</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {services.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className="hover:text-white">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white">Get in touch</h2>
          <p className="mt-4 text-sm text-navy-200">Have a challenge in mind? Let&apos;s talk it through.</p>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/consultation" className="btn-primary">
              Book a Consultation
            </Link>
            <Link href="/contact" className="btn-ghost-light">
              Send a Message
            </Link>
          </div>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-navy-300 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Auryx Software. All rights reserved.</p>
          <p className="flex gap-4">
            <Link href="/privacy" className="hover:text-white">
              Privacy Notice
            </Link>
            <span aria-hidden>·</span>
            <span>Accelerated by AI. Guided and reviewed by people.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
