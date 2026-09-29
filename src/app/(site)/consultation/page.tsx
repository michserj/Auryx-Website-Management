import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clock, Globe2 } from "lucide-react";
import { getContent } from "@/lib/settings";
import { bookableRange } from "@/lib/booking/time";
import { isGoogleCalendarConfigured } from "@/lib/booking/calendar";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { PageHero } from "@/components/Sections";

export const metadata: Metadata = {
  title: "Book a Consultation",
  description:
    "Book a consultation with Auryx Software. Available Monday to Friday, 8:00 AM to 5:00 PM Philippine time.",
  alternates: { canonical: "/consultation" },
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function to12h(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export default async function ConsultationPage() {
  const settings = await getContent("booking");
  const range = bookableRange(settings, new Date());
  const days =
    settings.workDays.join(",") === "1,2,3,4,5"
      ? "Monday to Friday"
      : settings.workDays.map((d) => DAY_NAMES[d]).join(", ");

  return (
    <>
      <PageHero
        eyebrow="Consultation"
        title="Book a consultation"
        text="Choose a time that suits you. We'll talk through your goals, your current process, and what a practical next step could look like."
      />
      <section className="container-page grid gap-10 py-16 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {settings.enabled ? (
            <BookingFlow
              calendarInvites={isGoogleCalendarConfigured()}
              config={{
                timezone: settings.timezone,
                workDays: settings.workDays,
                first: range.first,
                last: range.last,
                durationMinutes: settings.durationMinutes,
              }}
            />
          ) : (
            <div className="card p-8">
              <h2 className="text-xl font-bold">Online booking is temporarily unavailable</h2>
              <p className="mt-2 text-muted">
                Please{" "}
                <Link href="/contact" className="font-medium text-navy-700 underline">
                  send us a message
                </Link>{" "}
                and we&apos;ll arrange a time with you.
              </p>
            </div>
          )}
        </div>
        <aside className="lg:col-span-4">
          <div className="card space-y-5 p-7">
            <h2 className="font-semibold">Consultation details</h2>
            <p className="flex items-start gap-3 text-[15px]">
              <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-navy-600" aria-hidden />
              <span>
                {days}
                <br />
                {to12h(settings.dayStart)} to {to12h(settings.dayEnd)}
              </span>
            </p>
            <p className="flex items-start gap-3 text-[15px]">
              <Globe2 className="mt-0.5 h-5 w-5 shrink-0 text-navy-600" aria-hidden />
              <span>Philippine time (PHT, UTC+8)</span>
            </p>
            <p className="flex items-start gap-3 text-[15px]">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-navy-600" aria-hidden />
              <span>{settings.durationMinutes} minutes</span>
            </p>
            <p className="border-t border-line pt-5 text-sm text-muted">
              After booking you&apos;ll receive a confirmation email with a private link to reschedule or cancel.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}
