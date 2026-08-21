"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { signUpUser } from "@/lib/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmailConfirmModal } from "@/components/auth/EmailConfirmModal";
import { copy } from "@/lib/copy";

export function UserSignupForm() {
  const [state, formAction, pending] = useActionState(signUpUser, undefined);
  // Controlled so a failed submit (e.g. username taken) doesn't wipe
  // everything else already typed. Password left uncontrolled on purpose.
  const [values, setValues] = useState({ fullName: "", username: "", email: "" });
  const setField = (name: keyof typeof values) => (e: ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [name]: e.target.value }));

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.success && <EmailConfirmModal />}
      <Input
        id="fullName"
        name="fullName"
        label={copy.auth.fullName}
        labelClassName="font-display-light text-white/90"
        required
        autoComplete="name"
        value={values.fullName}
        onChange={setField("fullName")}
        error={state?.fieldErrors?.fullName}
        className="bg-white!"
      />
      <Input
        id="username"
        name="username"
        label={copy.auth.username}
        labelClassName="font-display-light text-white/90"
        required
        autoComplete="username"
        placeholder="juan123"
        value={values.username}
        onChange={setField("username")}
        error={state?.fieldErrors?.username}
        className="bg-white!"
      />
      <Input
        id="email"
        name="email"
        type="email"
        label={copy.auth.email}
        labelClassName="font-display-light text-white/90"
        required
        autoComplete="email"
        value={values.email}
        onChange={setField("email")}
        error={state?.fieldErrors?.email}
        className="bg-white!"
      />
      <Input
        id="password"
        name="password"
        type="password"
        label={copy.auth.password}
        labelClassName="font-display-light text-white/90"
        required
        autoComplete="new-password"
        error={state?.fieldErrors?.password}
        className="bg-white!"
      />

      {state?.error && !state.fieldErrors && <p className="text-sm text-red-400">{state.error}</p>}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="font-display bg-emerald-500! text-white! hover:bg-emerald-600!"
      >
        {pending ? "Creando cuenta..." : copy.auth.submitUser}
      </Button>
    </form>
  );
}
