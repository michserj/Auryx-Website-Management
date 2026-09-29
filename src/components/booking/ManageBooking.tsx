"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { formatSlot, SlotPicker, type BookingConfig } from "./SlotPicker";

type Props = {
  token: string;
  config: BookingConfig;
  booking: { start: string; status: "confirmed" | "cancelled"; changeable: boolean; cutoffHours: number };
};

export function ManageBooking({ token, config, booking }: Props) {
  const [state, setState] = useState(booking);
  const [mode, setMode] = useState<"view" | "reschedule" | "confirm-cancel">("view");
  const [start, setStart] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const when = (iso: string) =>
    formatSlot(iso, config.timezone, { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

  async function send(body: object) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/booking/manage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, ...body }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message);
      return json;
    } catch (e) {
      setMessage({ kind: "error", text: (e as Error).message || "Something went wrong. Please try again or contact info@auryx.net." });
      return null;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card space-y-6 p-6 sm:p-8">
      <div>
        <p className="text-sm text-muted">Your consultation</p>
        <p className={`mt-1 text-xl font-bold ${state.status === "cancelled" ? "text-muted line-through" : "text-ink"}`}>
          {when(state.start)} <span className="text-base font-normal text-muted">(Philippine time)</span>
        </p>
        <p className="mt-1 text-sm font-medium">
          Status:{" "}
          <span className={state.status === "cancelled" ? "text-red-700" : "text-green-700"}>
            {state.status === "cancelled" ? "Cancelled" : "Confirmed"}
          </span>
        </p>
      </div>

      {message && (
        <div role={message.kind === "error" ? "alert" : "status"} className={`rounded-lg p-4 text-sm ${message.kind === "error" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>
          {message.text}
        </div>
      )}

      {state.status === "confirmed" && !state.changeable && (
        <p className="rounded-lg bg-surface p-4 text-sm text-muted">
          Online changes are available up to {state.cutoffHours} hours before the consultation. Please contact us at
          info@auryx.net if you need to make a change.
        </p>
      )}

      {state.status === "confirmed" && state.changeable && mode === "view" && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" className="btn-navy" onClick={() => setMode("reschedule")}>
            Reschedule
          </button>
          <button type="button" className="btn-outline" onClick={() => setMode("confirm-cancel")}>
            Cancel consultation
          </button>
        </div>
      )}

      {mode === "confirm-cancel" && (
        <div className="rounded-xl border border-red-200 bg-red-50/60 p-5">
          <p className="font-medium text-ink">Are you sure you want to cancel this consultation?</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="btn bg-red-700 text-white hover:bg-red-800"
              disabled={busy}
              onClick={async () => {
                const ok = await send({ action: "cancel" });
                if (ok) {
                  setState((s) => ({ ...s, status: "cancelled" }));
                  setMode("view");
                  setMessage({ kind: "ok", text: "Your consultation has been cancelled. A confirmation email is on its way." });
                }
              }}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Yes, cancel it
            </button>
            <button type="button" className="btn-outline" onClick={() => setMode("view")}>
              Keep my booking
            </button>
          </div>
        </div>
      )}

      {mode === "reschedule" && (
        <div className="space-y-5 border-t border-line pt-6">
          <SlotPicker config={config} token={token} value={start} onChange={setStart} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="btn-navy"
              disabled={!start || busy}
              onClick={async () => {
                const ok = await send({ action: "reschedule", start });
                if (ok) {
                  setState((s) => ({ ...s, start: ok.start }));
                  setMode("view");
                  setStart(null);
                  setMessage({ kind: "ok", text: "Your consultation has been rescheduled. A confirmation email is on its way." });
                }
              }}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Confirm new time
            </button>
            <button type="button" className="btn-outline" onClick={() => setMode("view")}>
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
