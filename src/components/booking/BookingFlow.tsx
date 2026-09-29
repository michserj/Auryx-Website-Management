"use client";

import { useRef, useState } from "react";
import { CalendarCheck2, Loader2 } from "lucide-react";
import { bookingSchema, fieldErrors } from "@/lib/validation";
import { Field } from "../forms/Field";
import { PrivacyAck } from "../forms/PrivacyAck";
import { formatSlot, SlotPicker, type BookingConfig } from "./SlotPicker";

export function BookingFlow({ config, calendarInvites }: { config: BookingConfig; calendarInvites: boolean }) {
  const [start, setStart] = useState<string | null>(null);
  const [values, setValues] = useState({ name: "", email: "", phone: "", topic: "", website: "" });
  const [privacyAck, setPrivacyAck] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...values, start: start ?? "", privacyAck };
    const parsed = bookingSchema.safeParse(payload);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      const first = Object.keys(errs)[0];
      document.getElementById(first === "start" ? "booking-slot" : first === "privacyAck" ? "booking-privacy" : `booking-${first}`)?.focus();
      return;
    }
    setErrors({});
    setStatus("sending");
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setConfirmed(json.start);
        setStatus("done");
      } else {
        if (json.errors) setErrors(json.errors);
        if (json.code === "unavailable") setStart(null);
        setMessage(json.message ?? "");
        setStatus("error");
      }
    } catch {
      setMessage("");
      setStatus("error");
    }
    requestAnimationFrame(() => liveRef.current?.focus());
  }

  if (status === "done" && confirmed) {
    return (
      <div ref={liveRef} tabIndex={-1} role="status" className="card p-8 text-center outline-none sm:p-12">
        <CalendarCheck2 className="mx-auto h-12 w-12 text-green-600" aria-hidden />
        <h2 className="mt-4 text-2xl font-bold">Your consultation is booked</h2>
        <p className="mt-3 text-lg font-semibold text-navy-700">
          {formatSlot(confirmed, config.timezone, { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}{" "}
          <span className="font-normal text-muted">(Philippine time)</span>
        </p>
        <p className="mx-auto mt-4 max-w-md text-muted">
          A confirmation has been sent to <strong className="text-ink">{values.email}</strong>, including a private link to
          reschedule or cancel.{calendarInvites && " You'll also receive a calendar invitation."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="card space-y-8 p-6 sm:p-8">
      {status === "error" && (
        <div ref={liveRef} tabIndex={-1} role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 outline-none">
          {message || "Something went wrong while booking your consultation. Please try again or contact us at info@auryx.net."}
        </div>
      )}

      <div id="booking-slot" tabIndex={-1} className="outline-none">
        <SlotPicker config={config} value={start} onChange={setStart} />
        {errors.start && <p className="field-error">{errors.start}</p>}
      </div>

      <fieldset className="space-y-5 border-t border-line pt-8">
        <legend className="field-label -mb-1">3. Your details</legend>
        <Field id="booking-name" label="Name" required error={errors.name}>
          {(a) => <input {...a} type="text" autoComplete="name" maxLength={120} className="field" value={values.name} onChange={set("name")} />}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="booking-email" label="Email" required error={errors.email} hint="We'll send your confirmation here.">
            {(a) => <input {...a} type="email" autoComplete="email" maxLength={254} className="field" value={values.email} onChange={set("email")} />}
          </Field>
          <Field id="booking-phone" label="Contact number" required error={errors.phone}>
            {(a) => <input {...a} type="tel" autoComplete="tel" maxLength={40} className="field" value={values.phone} onChange={set("phone")} />}
          </Field>
        </div>
        <Field id="booking-topic" label="What would you like to discuss?" error={errors.topic}>
          {(a) => <textarea {...a} rows={4} maxLength={1000} className="field resize-y" value={values.topic} onChange={set("topic")} />}
        </Field>
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input type="text" tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} />
          </label>
        </div>
      </fieldset>

      <div id="booking-privacy" tabIndex={-1} className="outline-none">
        <PrivacyAck
          checked={privacyAck}
          onChange={setPrivacyAck}
          error={errors.privacyAck}
          purpose="to schedule and manage your consultation (including creating a Google Calendar event) and to follow up afterwards"
          retention="12 months"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" className="btn-navy" disabled={!privacyAck || !start || status === "sending"}>
          {status === "sending" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {status === "sending" ? "Booking…" : "Confirm Booking"}
        </button>
        {start ? (
          <p className="text-sm text-muted">
            Selected:{" "}
            <strong className="text-ink">
              {formatSlot(start, config.timezone, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </strong>{" "}
            · {config.durationMinutes} min
          </p>
        ) : (
          <p className="text-sm text-muted">Choose a time and acknowledge the Privacy Notice to continue.</p>
        )}
      </div>
    </form>
  );
}
