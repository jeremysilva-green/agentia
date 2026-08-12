"use client";

import { useActionState } from "react";
import { signUpUser } from "@/lib/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmailConfirmModal } from "@/components/auth/EmailConfirmModal";
import { copy } from "@/lib/copy";

export function UserSignupForm() {
  const [state, formAction, pending] = useActionState(signUpUser, undefined);

  if (state?.success) return <EmailConfirmModal />;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        id="fullName"
        name="fullName"
        label={copy.auth.fullName}
        labelClassName="font-display-light text-slate-700"
        required
        autoComplete="name"
        className="bg-white!"
      />
      <Input
        id="username"
        name="username"
        label={copy.auth.username}
        labelClassName="font-display-light text-slate-700"
        required
        autoComplete="username"
        placeholder="juan123"
        className="bg-white!"
      />
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
        autoComplete="new-password"
        className="bg-white!"
      />

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="font-display border! border-black! bg-black! text-white! hover:bg-white! hover:text-black!"
      >
        {pending ? "Creando cuenta..." : copy.auth.submitUser}
      </Button>
    </form>
  );
}
