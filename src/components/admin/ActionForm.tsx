"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

export type ActionResult = { ok: boolean; message: string; errors?: Record<string, string> } | null;
type Action = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

function Submit({ label, variant, pending }: { label: string; variant: "primary" | "danger" | "outline"; pending: boolean }) {
  const cls =
    variant === "danger"
      ? "btn bg-red-700 text-white hover:bg-red-800"
      : variant === "outline"
        ? "btn-outline"
        : "btn-navy";
  return (
    <button type="submit" className={cls} disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {label}
    </button>
  );
}

/** Server-action form with pending state, inline result message and optional confirm step. */
export function ActionForm({
  action,
  children,
  submitLabel = "Save changes",
  variant = "primary",
  confirm,
  className = "space-y-5",
  resetOnSuccess = false,
}: {
  action: Action;
  children?: React.ReactNode;
  submitLabel?: string;
  variant?: "primary" | "danger" | "outline";
  confirm?: string;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    // Submitted via onSubmit (not the `action` prop) so React doesn't reset
    // the fields — edits must survive a validation error.
    <form
      ref={formRef}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        if (confirm && !window.confirm(confirm)) return;
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
    >
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <Submit label={submitLabel} variant={variant} pending={pending} />
        {state && (
          <p role={state.ok ? "status" : "alert"} className={`text-sm ${state.ok ? "text-green-700" : "text-red-700"}`}>
            {state.message}
          </p>
        )}
      </div>
      {state?.errors && (
        <ul className="list-disc pl-5 text-sm text-red-700">
          {Object.entries(state.errors).map(([k, v]) => (
            <li key={k}>
              <strong>{k}</strong>: {v}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
