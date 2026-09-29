import type { Metadata } from "next";
import Link from "next/link";
import { findByToken } from "@/lib/booking/service";
import { bookableRange } from "@/lib/booking/time";
import { getContent } from "@/lib/settings";
import { ManageBooking } from "@/components/booking/ManageBooking";
import { PageHero } from "@/components/Sections";

export const metadata: Metadata = {
  title: "Manage your consultation",
  robots: { index: false, follow: false },
};

export default async function ManagePage(props: PageProps<"/consultation/manage/[token]">) {
  const { token } = await props.params;
  const [booking, settings] = await Promise.all([findByToken(token), getContent("booking")]);
  const range = bookableRange(settings, new Date());

  return (
    <>
      <PageHero eyebrow="Consultation" title="Manage your consultation" />
      <section className="container-page max-w-3xl py-16">
        {booking ? (
          <ManageBooking
            token={token}
            config={{
              timezone: settings.timezone,
              workDays: settings.workDays,
              first: range.first,
              last: range.last,
              durationMinutes: settings.durationMinutes,
            }}
            booking={{
              start: booking.startAt.toISOString(),
              status: booking.status,
              changeable:
                booking.status === "confirmed" &&
                booking.startAt.getTime() - Date.now() >= settings.changeCutoffHours * 3600_000,
              cutoffHours: settings.changeCutoffHours,
            }}
          />
        ) : (
          <div className="card p-8">
            <h2 className="text-xl font-bold">We couldn&apos;t find this booking</h2>
            <p className="mt-2 text-muted">
              The link may be incorrect, or the booking record may have been removed under our retention policy. Please{" "}
              <Link href="/contact" className="font-medium text-navy-700 underline">
                contact us
              </Link>{" "}
              if you need help.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
