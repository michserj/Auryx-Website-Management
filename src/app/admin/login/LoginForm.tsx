"use client";

import { startTransition, useActionState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { loginAction, type LoginState } from "./actions";

function Submit({ pending }: { pending: boolean }) {
  return (
    <button type="submit" className="btn-navy w-full" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <LogIn className="h-4 w-4" aria-hidden />}
      Sign in
    </button>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, null);
  return (
    // Submitted via onSubmit (not the `action` prop) so React doesn't reset the
    // fields — the password must survive the extra authenticator-code step.
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      {state?.error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="field-label">
          Username
        </label>
        <input id="email" name="email" type="email" autoComplete="username" placeholder="accounts@auryx.net" required defaultValue={state?.email} className="field" />
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>
      {state?.needTotp && (
        <div>
          <label htmlFor="totp" className="field-label">
            Authenticator code
          </label>
          <input
            id="totp"
            name="totp"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]{6,7}"
            maxLength={7}
            autoFocus
            className="field tracking-[0.3em]"
          />
        </div>
      )}
      <Submit pending={pending} />
    </form>
  );
}
