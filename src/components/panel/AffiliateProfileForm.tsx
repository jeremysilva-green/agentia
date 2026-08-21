"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { AvatarUploader } from "@/components/panel/AvatarUploader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateAffiliateProfile } from "@/lib/actions/profile";
import { copy } from "@/lib/copy";

export function AffiliateProfileForm({
  userId,
  avatarUrl,
  alias,
  phone,
}: {
  userId: string;
  avatarUrl: string | null;
  alias: string | null;
  phone: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateAffiliateProfile, undefined);
  const [values, setValues] = useState({ alias: alias ?? "", phone: phone ?? "" });
  const setField = (name: keyof typeof values) => (e: ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [name]: e.target.value }));

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{copy.profile.photo}</p>
        <AvatarUploader userId={userId} initialAvatarUrl={avatarUrl} />
      </div>

      <form action={formAction} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <Input
          id="alias"
          name="alias"
          label={copy.profile.alias}
          value={values.alias}
          onChange={setField("alias")}
          error={state?.fieldErrors?.alias}
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
