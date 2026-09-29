"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { contactSchema, fieldErrors } from "@/lib/validation";
import { Field } from "./Field";
import { PrivacyAck } from "./PrivacyAck";

type Errors = Record<string, string>;

export function ContactForm({ contactEmail }: { contactEmail: string }) {
  const startedAt = useRef(Date.now());
  const [values, setValues] = useState({ name: "", email: "", phone: "", message: "", website: "" });
  const [privacyAck, setPrivacyAck] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [serverMessage, setServerMessage] = useState("");
  const statusRef = useRef<HTMLDivElement>(null);

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...values, privacyAck, startedAt: startedAt.current };
    const parsed = contactSchema.safeParse(payload);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      const first = Object.keys(errs)[0];
      document.getElementById(first === "privacyAck" ? "contact-privacy" : `contact-${first}`)?.focus();
      return;
    }
    setErrors({});
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("sent");
      } else {
        if (json.errors) setErrors(json.errors);
        setServerMessage(json.message ?? "");
        setStatus("error");
      }
    } catch {
      setServerMessage("");
      setStatus("error");
    }
    requestAnimationFrame(() => statusRef.current?.focus());
  }

  if (status === "sent") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="card p-8 text-center outline-none sm:p-12">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" aria-hidden />
        <h2 className="mt-4 text-2xl font-bold">Thank you, your message has been sent.</h2>
        <p className="mx-auto mt-3 max-w-md text-muted">
          We&apos;ve received your message and the Auryx team will get back to you
          {values.email || values.phone ? " using the contact details you provided" : ""}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-5 p-6 sm:p-8" aria-labelledby="contact-form-title">
      <h2 id="contact-form-title" className="text-xl font-bold">
        Send a message
      </h2>

      {status === "error" && (
        <div ref={statusRef} tabIndex={-1} role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 outline-none">
          {serverMessage ||
            `Something went wrong while sending your message. Please try again or contact us directly at ${contactEmail}.`}
        </div>
      )}

      <Field id="contact-name" label="Name / Nickname" required error={errors.name}>
        {(a) => <input {...a} type="text" autoComplete="name" maxLength={120} className="field" value={values.name} onChange={set("name")} />}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="contact-email" label="Email" error={errors.email}>
          {(a) => <input {...a} type="email" autoComplete="email" maxLength={254} className="field" value={values.email} onChange={set("email")} />}
        </Field>
        <Field id="contact-phone" label="Contact number" error={errors.phone}>
          {(a) => <input {...a} type="tel" autoComplete="tel" maxLength={40} className="field" value={values.phone} onChange={set("phone")} />}
        </Field>
      </div>
      <p className="-mt-2 text-sm text-muted">Add an email or contact number if you&apos;d like us to reply.</p>

      <Field id="contact-message" label="Message" required error={errors.message}>
        {(a) => (
          <textarea {...a} rows={6} maxLength={5000} className="field resize-y" value={values.message} onChange={set("message")} />
        )}
      </Field>

      {/* Honeypot — hidden from people and assistive tech */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} />
        </label>
      </div>

      <div id="contact-privacy" tabIndex={-1} className="outline-none">
        <PrivacyAck
          checked={privacyAck}
          onChange={setPrivacyAck}
          error={errors.privacyAck}
          purpose="to respond to your inquiry and follow up where appropriate"
          retention="12 months"
        />
      </div>

      <button type="submit" className="btn-navy w-full sm:w-auto" disabled={!privacyAck || status === "sending"} aria-disabled={!privacyAck || status === "sending"}>
        {status === "sending" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
        {status === "sending" ? "Sending…" : "Send Message"}
      </button>
      {!privacyAck && <p className="text-sm text-muted">Please acknowledge the Privacy Notice to enable sending.</p>}
    </form>
  );
}
