"use client";

import { useActionState, useState } from "react";
import { login, requestPasswordReset } from "@/lib/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { copy } from "@/lib/copy";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(login, undefined);
  const [resetState, resetFormAction, resetPending] = useActionState(requestPasswordReset, undefined);
  // Email is controlled so a failed login doesn't wipe it (React resets
  // uncontrolled <form> fields after every action call, even on error),
  // and so switching into "forgot password" mode can carry over whatever
  // the user already typed.
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"login" | "forgot">("login");

  if (mode === "forgot") {
    if (resetState?.success) {
      return (
        <div className="flex flex-col gap-4 text-center">
          <p className="font-display text-slate-900">{copy.auth.resetEmailSentTitle}</p>
          <p className="text-sm text-slate-600">{copy.auth.resetEmailSentBody}</p>
          <button
            type="button"
            onClick={() => setMode("login")}
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            {copy.auth.backToLogin}
          </button>
        </div>
      );
    }

    return (
      <form action={resetFormAction} className="flex flex-col gap-4">
        <Input
          id="reset-email"
          name="email"
          type="email"
          label={copy.auth.email}
          labelClassName="font-display-light text-slate-700"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={resetState?.fieldErrors?.email}
          className="bg-white!"
        />

        {resetState?.error && !resetState.fieldErrors && <p className="text-sm text-red-600">{resetState.error}</p>}

        <Button
          type="submit"
          size="lg"
          disabled={resetPending}
          className="font-display border! border-black! bg-black! text-white! hover:bg-white! hover:text-black!"
        >
          {resetPending ? "Enviando..." : copy.auth.sendResetLink}
        </Button>
        <button
          type="button"
          onClick={() => setMode("login")}
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          {copy.auth.backToLogin}
        </button>
      </form>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      <Input
        id="email"
        name="email"
        type="email"
        label={copy.auth.email}
        labelClassName="font-display-light text-slate-700"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={state?.fieldErrors?.email}
        className="bg-white!"
      />
      <Input
        id="password"
        name="password"
        type="password"
        label={copy.auth.password}
        labelClassName="font-display-light text-slate-700"
        required
        autoComplete="current-password"
        error={state?.fieldErrors?.password}
        className="bg-white!"
      />
      <button
        type="button"
        onClick={() => setMode("forgot")}
        className="-mt-2 self-end text-sm font-medium text-emerald-700 hover:underline"
      >
        {copy.auth.forgotPassword}
      </button>

      {state?.error && !state.fieldErrors && <p className="text-sm text-red-600">{state.error}</p>}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="font-display border! border-black! bg-black! text-white! hover:bg-white! hover:text-black!"
      >
        {pending ? "Ingresando..." : copy.auth.submitLogin}
      </Button>
    </form>
  );
}
