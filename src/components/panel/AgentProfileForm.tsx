"use client";

import { useActionState, useRef, useState, type ChangeEvent } from "react";
import { User, Phone, MapPin, CreditCard, Globe, Tag, Check } from "lucide-react";
import { AvatarUploader } from "@/components/panel/AvatarUploader";
import { Input } from "@/components/ui/Input";
import { SingleSelectDropdown } from "@/components/ui/SingleSelectDropdown";
import { updateAgentProfile } from "@/lib/actions/profile";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import type { SifenCity } from "@/types/domain";

const darkInputClass =
  "bg-black/30! border-[var(--line)]! text-white! placeholder:text-[var(--muted)]! focus:border-[var(--em)]! focus:ring-[var(--em)]/20!";

function FieldGroup({
  icon: Icon,
  title,
  subtitle,
  children,
  delay,
}: {
  icon: typeof User;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <section className="rounded-[22px] border border-[var(--line)] bg-[var(--ink-2)] p-5 sm:p-6" style={{ animationDelay: delay ? `${delay}ms` : undefined }}>
      <div className="mb-4.5 flex items-center gap-3">
        <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-xl border border-[#13c47f33] bg-[#13c47f17] text-[var(--em-2)]">
          <Icon size={18} />
        </span>
        <div>
          <h3 className="font-display text-[17px] font-semibold text-white">{title}</h3>
          <p className="mt-0.5 text-xs text-[var(--muted)]">{subtitle}</p>
        </div>
      </div>
      <div className="grid gap-3.5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function AgentProfileForm({
  userId,
  avatarUrl,
  fullName,
  phone,
  city,
  ruc,
  brandName,
  logoUrl,
  ci,
  address,
  sifenCityId,
  sifenCities,
}: {
  userId: string;
  avatarUrl: string | null;
  fullName: string | null;
  phone: string | null;
  city: string | null;
  ruc: string | null;
  brandName: string | null;
  logoUrl: string | null;
  ci: string | null;
  address: string | null;
  sifenCityId: string | null;
  sifenCities: SifenCity[];
}) {
  const [state, formAction, pending] = useActionState(updateAgentProfile, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // Controlled so a failed save doesn't revert an in-progress edit back to
  // the previously-saved value (React resets uncontrolled fields after
  // every action call, even on error).
  const initial = {
    fullName: fullName ?? "",
    phone: phone ?? "",
    city: city ?? "",
    ruc: ruc ?? "",
    brandName: brandName ?? "",
    ci: ci ?? "",
    address: address ?? "",
  };
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const setField = (name: keyof typeof values) => (e: ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [name]: e.target.value }));

  // Once a save succeeds, the just-submitted values become the new "saved"
  // baseline the dirty-check compares against. Adjusted during render
  // (React's documented "adjusting state when a prop changes" pattern)
  // rather than in an effect, so it takes effect in the same render
  // `state` changes instead of one render later, and without the
  // ref-during-render this codebase's lint config disallows.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.success) setSaved(values);
  }

  function handleDiscard() {
    setValues(saved);
  }

  const isDirty = JSON.stringify(values) !== JSON.stringify(saved);
  const dirtyCount = Object.keys(values).filter((k) => values[k as keyof typeof values] !== saved[k as keyof typeof saved]).length;

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr] lg:items-start">
      <aside className="flex flex-col gap-5 rounded-[26px] border border-[var(--line)] bg-[radial-gradient(120%_70%_at_50%_0%,#0a8f5c30,transparent_60%)] bg-[var(--ink-2)] p-6 text-center lg:sticky lg:top-6">
        <div className="flex flex-col items-center">
          <AvatarUploader userId={userId} initialAvatarUrl={avatarUrl} variant="circle" displayName={values.fullName} />
          <h2 className="mt-4 font-display text-xl font-semibold text-white">{values.fullName || "Agente"}</h2>
          <span className="mt-1.5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--em-2)]">
            <Tag size={14} />
            {values.brandName || "Agentia"}
          </span>
        </div>

        <div className="flex flex-col gap-2 text-left">
          <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2.5 text-[13.5px]">
            <Phone size={15} className="shrink-0 text-[var(--em-2)]" />
            <span className="text-[var(--muted)]">Teléfono</span>
            <b className="ml-auto truncate font-semibold text-white">{values.phone || "—"}</b>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2.5 text-[13.5px]">
            <MapPin size={15} className="shrink-0 text-[var(--em-2)]" />
            <span className="text-[var(--muted)]">Ciudad</span>
            <b className="ml-auto truncate font-semibold text-white">{values.city || "—"}</b>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2.5 text-[13.5px]">
            <CreditCard size={15} className="shrink-0 text-[var(--em-2)]" />
            <span className="text-[var(--muted)]">RUC</span>
            <b className="ml-auto truncate font-semibold text-white">{values.ruc || "—"}</b>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-dashed border-[#333] p-3.5 text-left transition-colors hover:border-[var(--em)]">
          <AvatarUploader
            userId={userId}
            initialAvatarUrl={logoUrl}
            variant="compact"
            displayName={values.brandName || values.fullName}
            target="logo"
            pathPrefix="logo-"
            errorMessage="No se pudo guardar el logo."
            className="h-[60px]! w-[60px]! border-[var(--line)]! bg-black/30!"
          />
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-[0.1em] text-[#8d8d8d] uppercase">Logo del agente</p>
            <p className="mt-0.5 text-[13px] font-semibold text-[var(--em-2)]">Cambiar logo</p>
          </div>
        </div>
      </aside>

      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <FieldGroup icon={User} title="Datos personales" subtitle="Así te ven tus clientes.">
          <div className="sm:col-span-2">
            <Input
              id="fullName"
              name="fullName"
              label={copy.profile.fullName}
              value={values.fullName}
              onChange={setField("fullName")}
              error={state?.fieldErrors?.fullName}
              required
              className={darkInputClass}
            />
          </div>
          <Input
            id="phone"
            name="phone"
            type="tel"
            label={copy.profile.phone}
            value={values.phone}
            onChange={setField("phone")}
            error={state?.fieldErrors?.phone}
            required
            className={darkInputClass}
          />
          <Input
            id="city"
            name="city"
            label={copy.profile.city}
            value={values.city}
            onChange={setField("city")}
            error={state?.fieldErrors?.city}
            required
            className={darkInputClass}
          />
          <Input
            id="ci"
            name="ci"
            label="Cédula de Identidad (CI)"
            value={values.ci}
            onChange={setField("ci")}
            error={state?.fieldErrors?.ci}
            placeholder="1234567"
            className={darkInputClass}
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
            className={darkInputClass}
          />
        </FieldGroup>

        <FieldGroup icon={MapPin} title="Dirección" subtitle="Usada en tus contratos y acuerdos." delay={60}>
          <div className="sm:col-span-2">
            <Input
              id="address"
              name="address"
              label="Dirección"
              value={values.address}
              onChange={setField("address")}
              error={state?.fieldErrors?.address}
              placeholder="Calle, número, barrio"
              className={darkInputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <SingleSelectDropdown
              name="sifenCityId"
              label="Ciudad"
              showAllOption={false}
              searchable
              searchPlaceholder="Buscar ciudad..."
              defaultValue={sifenCityId ?? ""}
              options={sifenCities.map((c) => ({
                value: c.id,
                label: `${c.ciudad_desc} — ${c.distrito_desc}, ${c.departamento_desc}`,
              }))}
              buttonClassName={darkInputClass}
              panelClassName="border-[var(--line)]! bg-[var(--ink-2)]!"
            />
          </div>
        </FieldGroup>

        <FieldGroup icon={Globe} title="Tu Marca" subtitle="El nombre que aparece en tu portafolio." delay={120}>
          <div className="sm:col-span-2">
            <Input
              id="brandName"
              name="brandName"
              label={copy.profile.brandName}
              value={values.brandName}
              onChange={setField("brandName")}
              error={state?.fieldErrors?.brandName}
              placeholder="Ej: Inmobiliaria del Este"
              className={darkInputClass}
            />
          </div>
        </FieldGroup>

        {state?.error && !state.fieldErrors && <p className="text-sm text-[#ff8a8a]">{state.error}</p>}

        <div
          className={cn(
            "sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl border p-3 pl-4.5 backdrop-blur-md transition-colors",
            isDirty ? "border-[#13c47f55] bg-[#151515ea]" : "border-white/10 bg-[#151515ea]"
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2 text-[13.5px] text-[var(--muted)]">
            <span className={cn("h-2 w-2 shrink-0 rounded-full", isDirty ? "bg-amber-400" : "bg-[#444]")} />
            {isDirty ? (
              <span className="truncate text-[#e6e6e6]">
                {dirtyCount} cambio{dirtyCount === 1 ? "" : "s"} sin guardar
              </span>
            ) : (
              "Todo guardado"
            )}
          </span>
          <button
            type="button"
            onClick={handleDiscard}
            disabled={!isDirty}
            className="h-11 rounded-xl border border-[var(--line)] px-4 text-sm font-semibold text-[#cfcfcf] transition-colors hover:border-[#4a4a4a] hover:text-white disabled:opacity-40"
          >
            Descartar
          </button>
          <button
            type="submit"
            disabled={pending || !isDirty}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--em)] px-4.5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_var(--em-glow)] transition-colors hover:bg-[var(--em-2)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            <Check size={16} />
            {pending ? copy.profile.saving : "Guardar cambios"}
          </button>
        </div>
        {state?.success && !isDirty && <p className="text-sm text-[var(--em-2)]">{copy.profile.saved}</p>}
      </form>
    </div>
  );
}
