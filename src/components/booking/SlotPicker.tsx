"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export type BookingConfig = {
  timezone: string;
  workDays: number[];
  first: string;
  last: string;
  durationMinutes: number;
};

function addDays(date: string, n: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const weekday = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();

export function formatSlot(iso: string, tz: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-PH", { timeZone: tz, ...opts }).format(new Date(iso));
}

const PAGE = 5;

/** Two-step picker: working day → available time. All times shown in Philippine time. */
export function SlotPicker({
  config,
  token,
  value,
  onChange,
}: {
  config: BookingConfig;
  token?: string;
  value: string | null;
  onChange: (iso: string | null) => void;
}) {
  const days = useMemo(() => {
    const out: string[] = [];
    for (let d = config.first; d <= config.last; d = addDays(d, 1)) {
      if (config.workDays.includes(weekday(d))) out.push(d);
    }
    return out;
  }, [config]);

  const [page, setPage] = useState(0);
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const localTz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : config.timezone;
  const showLocal = localTz !== config.timezone;

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setSlots(null);
    const qs = new URLSearchParams({ date, ...(token ? { token } : {}) });
    fetch(`/api/booking/availability?${qs}`)
      .then(async (r) => {
        const json = await r.json().catch(() => ({}));
        if (cancelled) return;
        if (!r.ok) throw new Error(json.message);
        setSlots(json.slots);
      })
      .catch((e: Error) => !cancelled && setError(e.message || "We couldn't load available times. Please try again."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [date, token]);

  const visible = days.slice(page * PAGE, page * PAGE + PAGE);
  const pages = Math.ceil(days.length / PAGE);

  return (
    <div>
      <fieldset>
        <legend className="field-label">1. Choose a day</legend>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line text-navy-700 hover:bg-navy-50 disabled:opacity-40"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            aria-label="Earlier days"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <ul className="grid flex-1 grid-cols-5 gap-2">
            {visible.map((d) => {
              const selected = d === date;
              return (
                <li key={d}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setDate(d);
                      onChange(null);
                    }}
                    className={`flex w-full flex-col items-center rounded-lg border px-1 py-2.5 text-center transition-colors ${
                      selected
                        ? "border-navy-600 bg-navy-600 text-white"
                        : "border-line bg-white text-ink hover:border-navy-300 hover:bg-navy-50"
                    }`}
                  >
                    <span className={`text-[11px] font-semibold uppercase ${selected ? "text-navy-100" : "text-muted"}`}>
                      {formatSlot(`${d}T04:00:00Z`, "UTC", { weekday: "short" })}
                    </span>
                    <span className="text-lg font-bold leading-tight">{Number(d.slice(8))}</span>
                    <span className={`text-[11px] ${selected ? "text-navy-100" : "text-muted"}`}>
                      {formatSlot(`${d}T04:00:00Z`, "UTC", { month: "short" })}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line text-navy-700 hover:bg-navy-50 disabled:opacity-40"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= pages - 1}
            aria-label="Later days"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </fieldset>

      <fieldset className="mt-6" aria-live="polite" aria-busy={loading}>
        <legend className="field-label">2. Choose a time (Philippine time, UTC+8)</legend>
        {!date && <p className="text-sm text-muted">Select a day to see available times.</p>}
        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading available times…
          </p>
        )}
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {slots && slots.length === 0 && (
          <p className="rounded-lg bg-surface p-3 text-sm text-muted">No times are available on this day. Please choose another day.</p>
        )}
        {slots && slots.length > 0 && (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((s) => {
              const selected = s === value;
              return (
                <li key={s}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onChange(s)}
                    className={`w-full rounded-lg border px-2 py-2.5 text-sm font-semibold transition-colors ${
                      selected
                        ? "border-gold-500 bg-gold-500 text-navy-950"
                        : "border-line bg-white text-navy-800 hover:border-navy-300 hover:bg-navy-50"
                    }`}
                  >
                    {formatSlot(s, config.timezone, { hour: "numeric", minute: "2-digit" })}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {value && showLocal && (
          <p className="mt-3 text-sm text-muted">
            That&apos;s {formatSlot(value, localTz, { weekday: "short", hour: "numeric", minute: "2-digit" })} in your
            time zone ({localTz}).
          </p>
        )}
      </fieldset>
    </div>
  );
}
