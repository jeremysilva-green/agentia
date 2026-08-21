"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { AvatarUploader } from "@/components/panel/AvatarUploader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateAgentProfile } from "@/lib/actions/profile";
import { copy } from "@/lib/copy";

export function AgentProfileForm({
  userId,
  avatarUrl,
  fullName,
  phone,
  city,
  ruc,
}: {
  userId: string;
  avatarUrl: string | null;
  fullName: string | null;
  phone: string | null;
  city: string | null;
  ruc: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateAgentProfile, undefined);
  // Controlled so a failed save doesn't revert an in-progress edit back to
  // the previously-saved value (React resets uncontrolled fields after
  // every action call, even on error).
  const [values, setValues] = useState({
    fullName: fullName ?? "",
    phone: phone ?? "",
    city: city ?? "",
    ruc: ruc ?? "",
  });
  const setField = (name: keyof typeof values) => (e: ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [name]: e.target.value }));

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{copy.profile.photo}</p>
        <AvatarUploader userId={userId} initialAvatarUrl={avatarUrl} displayName={fullName ?? undefined} />
      </div>

      <form action={formAction} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <Input
          id="fullName"
          name="fullName"
          label={copy.profile.fullName}
          value={values.fullName}
          onChange={setField("fullName")}
          error={state?.fieldErrors?.fullName}
          required
          className="bg-emerald-50! focus:border-emerald-600! focus:ring-emerald-500/20!"
        />

        <Input
          id="phone"
          name="phone"
          type="tel"
          label={copy.profile.phone}
          value={values.phone}
          onChange={setField("phone")}
          error={state?.fieldErrors?.phone}
          required
          className="bg-emerald-50! focus:border-emerald-600! focus:ring-emerald-500/20!"
        />

        <Input
          id="city"
          name="city"
          label={copy.profile.city}
          value={values.city}
          onChange={setField("city")}
          error={state?.fieldErrors?.city}
          required
          className="bg-emerald-50! focus:border-emerald-600! focus:ring-emerald-500/20!"
        />

        <Input
          id="ruc"
          name="ruc"
          label={copy.profile.ruc}
          value={values.ruc}
          onChange={setField("ruc")}
          error={state?.fieldErrors?.ruc}
          required
          placeholder="80012345-6"
          className="bg-emerald-50! focus:border-emerald-600! focus:ring-emerald-500/20!"
        />

        {state?.error && !state.fieldErrors && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.success && <p className="text-sm text-emerald-600">{copy.profile.saved}</p>}

        <Button type="submit" size="md" className="self-start" disabled={pending}>
          {pending ? copy.profile.saving : copy.profile.save}
        </Button>
      </form>
    </div>
  );
}
