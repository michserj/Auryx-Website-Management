import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Mail, MapPin } from "lucide-react";
import { getContent } from "@/lib/settings";
import { ContactForm } from "@/components/forms/ContactForm";
import { PageHero } from "@/components/Sections";

export const metadata: Metadata = {
  title: "Contact",
  description: "Send Auryx Software a message about your project, process or question.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const site = await getContent("site");
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Tell us what you're working on"
        text="Whether you have a question, an idea or a process that needs improving, send us a message and the Auryx team will get back to you."
      />
      <section className="container-page grid gap-10 py-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ContactForm contactEmail={site.contactEmail} />
        </div>
        <aside className="space-y-5 lg:col-span-5">
          <div className="card p-7">
            <h2 className="font-semibold">Other ways to reach us</h2>
            <ul className="mt-5 space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-navy-600" aria-hidden />
                <div>
                  <p className="text-sm text-muted">Email</p>
                  <a href={`mailto:${site.contactEmail}`} className="font-medium text-navy-700 hover:underline">
                    {site.contactEmail}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-navy-600" aria-hidden />
                <div>
                  <p className="text-sm text-muted">Location</p>
                  <p className="font-medium">{site.location}</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-navy-900 p-7 text-white">
            <div className="chart-grid absolute inset-0" aria-hidden />
            <div className="relative">
              <CalendarDays className="h-6 w-6 text-gold-400" aria-hidden />
              <h2 className="mt-4 text-lg font-semibold">Prefer to talk it through?</h2>
              <p className="mt-2 text-sm text-navy-100">
                Book a consultation, Monday to Friday, 8:00 AM to 5:00 PM Philippine time.
              </p>
              <Link href="/consultation" className="btn-primary mt-5">
                Book a Consultation
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}
