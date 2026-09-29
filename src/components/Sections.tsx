import Link from "next/link";
import { ArrowRight, CalendarDays, MessageSquare } from "lucide-react";
import { Bearing, ContourLines } from "./Decor";

export function Eyebrow({ children, tone = "dark" }: { children: React.ReactNode; tone?: "dark" | "light" }) {
  return (
    <p className={`eyebrow flex items-center gap-2 ${tone === "light" ? "text-gold-400" : ""}`}>
      <Bearing className={`h-3.5 w-3.5 ${tone === "light" ? "text-gold-500" : "text-gold-500"}`} />
      {children}
    </p>
  );
}

export function PageHero({
  eyebrow,
  title,
  text,
  children,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-navy-950 text-white">
      <div className="chart-grid absolute inset-0" aria-hidden />
      <ContourLines className="absolute inset-x-0 bottom-0 h-40 w-full text-navy-300" />
      <div className="container-page relative py-16 sm:py-20">
        <Eyebrow tone="light">{eyebrow}</Eyebrow>
        <h1 className="mt-4 max-w-3xl text-3xl font-bold sm:text-5xl">{title}</h1>
        {text && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-navy-100">{text}</p>}
        {children}
      </div>
    </section>
  );
}

export function CtaBand({
  title = "Let's talk about your challenge.",
  text = "Tell us what you're working on. We'll listen, ask the right questions, and work with you toward a practical solution.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="container-page py-16 sm:py-20">
      <div className="relative overflow-hidden rounded-3xl bg-navy-900 px-6 py-12 text-white sm:px-12 sm:py-14">
        <div className="chart-grid absolute inset-0" aria-hidden />
        <ContourLines className="absolute -right-20 bottom-0 h-full w-2/3 text-gold-400" />
        <div className="relative max-w-2xl">
          <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
          <p className="mt-3 text-navy-100">{text}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/consultation" className="btn-primary">
              <CalendarDays className="h-4 w-4" aria-hidden /> Book a Consultation
            </Link>
            <Link href="/contact" className="btn-ghost-light">
              <MessageSquare className="h-4 w-4" aria-hidden /> Send a Message
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600 hover:text-navy-800"
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}
