"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { signUpAgent } from "@/lib/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmailConfirmModal } from "@/components/auth/EmailConfirmModal";
import { copy } from "@/lib/copy";

export function AgentSignupForm() {
  const [state, formAction, pending] = useActionState(signUpAgent, undefined);
  // Controlled so a failed submit (e.g. username/RUC rejected) doesn't wipe
  // everything else already typed. Password left uncontrolled on purpose.
  const [values, setValues] = useState({ fullName: "", username: "", email: "", phone: "", city: "", ruc: "" });
  const setField = (name: keyof typeof values) => (e: ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [name]: e.target.value }));

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.success && <EmailConfirmModal />}
      <Input
        id="fullName"
        name="fullName"
        label={copy.auth.fullName}
        labelClassName="font-display-light text-slate-700"
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
        labelClassName="font-display-light text-slate-700"
        required
        autoComplete="username"
        placeholder="juan-perez"
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
        labelClassName="font-display-light text-slate-700"
        required
        autoComplete="email"
        value={values.email}
        onChange={setField("email")}
        error={state?.fieldErrors?.email}
        className="bg-white!"
      />
      <Input
        id="phone"
        name="phone"
        label={copy.auth.phone}
        labelClassName="font-display-light text-slate-700"
        required
        autoComplete="tel"
        placeholder="+595 9xx xxx xxx"
        value={values.phone}
        onChange={setField("phone")}
        error={state?.fieldErrors?.phone}
        className="bg-white!"
      />
      <Input
        id="city"
        name="city"
        label={copy.auth.city}
        labelClassName="font-display-light text-slate-700"
        required
        autoComplete="address-level2"
        value={values.city}
        onChange={setField("city")}
        error={state?.fieldErrors?.city}
        className="bg-white!"
      />
      <Input
        id="ruc"
        name="ruc"
        label={copy.auth.ruc}
        labelClassName="font-display-light text-slate-700"
        required
        placeholder="80012345-6"
        value={values.ruc}
        onChange={setField("ruc")}
        error={state?.fieldErrors?.ruc}
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
        error={state?.fieldErrors?.password}
        className="bg-white!"
      />

      {state?.error && !state.fieldErrors && <p className="text-sm text-red-600">{state.error}</p>}

      <Button type="submit" size="lg" disabled={pending} className="font-display border! border-black! bg-black! text-white! hover:bg-white! hover:text-black!">
        {pending ? "Creando cuenta..." : copy.auth.submitAgent}
      </Button>
    </form>
  );
}
