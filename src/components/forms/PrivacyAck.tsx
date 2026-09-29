"use client";

import Link from "next/link";

/**
 * Privacy notice summary + affirmative acknowledgment (never pre-ticked).
 * The full, Auryx-approved notice lives at /privacy and is editable in Admin.
 */
export function PrivacyAck({
  checked,
  onChange,
  error,
  purpose,
  retention,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
  purpose: string;
  retention: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-sm leading-relaxed text-muted" id="privacy-summary">
        <strong className="font-semibold text-ink">Privacy notice:</strong> Auryx Software will use the information
        you provide {purpose}. It is accessible only to authorized Auryx personnel and our service providers, and is
        kept for up to {retention}. You can ask to access, correct or delete your data at any time via info@auryx.net.
        Read the full{" "}
        <Link href="/privacy" target="_blank" className="font-medium text-navy-700 underline underline-offset-2">
          Privacy Notice
        </Link>
        .
      </p>
      <label className="mt-3 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          name="privacyAck"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={!!error}
          aria-describedby={`privacy-summary${error ? " privacy-error" : ""}`}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-line accent-navy-600"
        />
        <span className="text-sm font-medium text-ink">
          I acknowledge that I have read and understood the Privacy Notice.
        </span>
      </label>
      {error && (
        <p id="privacy-error" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
