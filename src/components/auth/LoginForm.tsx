"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { copy } from "@/lib/copy";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(login, undefined);

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
        className="bg-white!"
      />

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

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
