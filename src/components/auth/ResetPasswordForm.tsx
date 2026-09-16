"use client";

import { useActionState } from "react";
import { updatePassword } from "@/lib/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { copy } from "@/lib/copy";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        id="password"
        name="password"
        type="password"
        label={copy.auth.newPassword}
        labelClassName="font-display-light text-slate-700"
        required
        autoComplete="new-password"
        error={state?.fieldErrors?.password}
        className="bg-white!"
      />
      <Input
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        label={copy.auth.confirmPassword}
        labelClassName="font-display-light text-slate-700"
        required
        autoComplete="new-password"
        error={state?.fieldErrors?.confirmPassword}
        className="bg-white!"
      />

      {state?.error && !state.fieldErrors && <p className="text-sm text-red-600">{state.error}</p>}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="font-display border! border-black! bg-black! text-white! hover:bg-white! hover:text-black!"
      >
        {pending ? "Guardando..." : copy.auth.submitNewPassword}
      </Button>
    </form>
  );
}
