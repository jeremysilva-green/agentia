"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { Phone, QrCode, Wallet } from "lucide-react";
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
  ci,
  qrUrl,
}: {
  userId: string;
  avatarUrl: string | null;
  alias: string | null;
  phone: string | null;
  ci: string | null;
  qrUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateAffiliateProfile, undefined);
  const [values, setValues] = useState({ alias: alias ?? "", phone: phone ?? "", ci: ci ?? "" });
  const setField = (name: keyof typeof values) => (e: ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [name]: e.target.value }));

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr] lg:items-start">
      <aside className="flex flex-col gap-5 rounded-[26px] border border-[var(--line)] bg-[radial-gradient(120%_70%_at_50%_0%,#0a8f5c30,transparent_60%)] bg-[var(--ink-2)] p-6 text-center lg:sticky lg:top-6">
        <div className="flex flex-col items-center">
          <AvatarUploader userId={userId} initialAvatarUrl={avatarUrl} variant="circle" />
          <p className="mt-4 text-[13px] font-semibold tracking-wide text-[var(--muted)] uppercase">{copy.profile.photo}</p>
        </div>

        <div className="flex flex-col gap-2 text-left">
          <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2.5 text-[13.5px]">
            <Phone size={15} className="shrink-0 text-[var(--em-2)]" />
            <span className="text-[var(--muted)]">Teléfono</span>
            <b className="ml-auto truncate font-semibold text-white">{values.phone || "—"}</b>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2.5 text-[13.5px]">
            <Wallet size={15} className="shrink-0 text-[var(--em-2)]" />
            <span className="text-[var(--muted)]">Alias</span>
            <b className="ml-auto truncate font-semibold text-white">{values.alias || "—"}</b>
          </div>
        </div>
      </aside>

      <form
        action={formAction}
        className="pf-dark flex flex-col gap-4 rounded-[26px] border border-[var(--line)] bg-[var(--ink-2)] p-5 sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex-1">
            <Input
              id="alias"
              name="alias"
              label={copy.profile.alias}
              value={values.alias}
              onChange={setField("alias")}
              error={state?.fieldErrors?.alias}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-slate-700">{copy.profile.qr}</p>
            <AvatarUploader
              userId={userId}
              initialAvatarUrl={qrUrl}
              variant="compact"
              target="qr"
              pathPrefix="qr-"
              emptyIcon={QrCode}
              errorMessage="No se pudo guardar el QR."
            />
          </div>
        </div>

        <Input
          id="phone"
          name="phone"
          type="tel"
          label={copy.profile.phone}
          value={values.phone}
          onChange={setField("phone")}
          error={state?.fieldErrors?.phone}
        />

        <Input
          id="ci"
          name="ci"
          label={copy.profile.ci}
          value={values.ci}
          onChange={setField("ci")}
          error={state?.fieldErrors?.ci}
          placeholder="1234567"
        />
        <p className="-mt-2 text-xs text-slate-500">
          Necesario para generar el acuerdo de comisión cuando un agente cierre una venta que referiste.
        </p>

        {state?.error && !state.fieldErrors && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.success && <p className="text-sm text-emerald-600">{copy.profile.saved}</p>}

        <Button
          type="submit"
          size="lg"
          className="self-start bg-[var(--em)]! text-white! shadow-[0_12px_34px_-12px_var(--em-glow)] hover:bg-[var(--em-2)]!"
          disabled={pending}
        >
          {pending ? copy.profile.saving : copy.profile.save}
        </Button>
      </form>
    </div>
  );
}
