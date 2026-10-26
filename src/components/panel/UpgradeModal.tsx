"use client";

import Link from "next/link";
import { Check, Crown, Globe, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { PLANS, BASICO_PROPERTY_LIMIT, BASICO_FREE_ENHANCE_TRIES, type PlanId } from "@/lib/plans";

export type UpgradeReason = "properties" | "enhancer" | "video";

const COPY: Record<UpgradeReason, { title: string; body: string }> = {
  properties: {
    title: `Alcanzaste el límite de ${BASICO_PROPERTY_LIMIT} propiedades`,
    body: `El plan Básico permite hasta ${BASICO_PROPERTY_LIMIT} propiedades activas. Con un plan pago publicás sin límites.`,
  },
  enhancer: {
    title: "Usaste tus mejoras gratis",
    body: `Ya probaste las ${BASICO_FREE_ENHANCE_TRIES} mejoras con IA del plan Básico. Con un plan pago seguís mejorando todas las fotos de tus propiedades.`,
  },
  video: {
    title: "Video automático para tus propiedades",
    body: "Generá un video listo para compartir en redes con las fotos de tu propiedad. Disponible en los planes pagos.",
  },
};

// Pro is the default next step; the other two are positioned relative to it
// so a free agent can tell at a glance which one fits them.
const TIERS: { id: Exclude<PlanId, "basico">; pitch: string; icon?: typeof Crown }[] = [
  { id: "pro", pitch: "Propiedades ilimitadas, mejoras con IA, video automático y analíticas." },
  { id: "fundador", pitch: "Lo mismo que Pro a precio reducido. Cupos limitados." },
  { id: "mls", pitch: "Todo lo de Pro, más la red de cooperación MLS entre agencias." },
];

export function UpgradeModal({
  reason,
  open,
  onClose,
  fundadorSeatsRemaining = 1,
}: {
  reason: UpgradeReason;
  open: boolean;
  onClose: () => void;
  fundadorSeatsRemaining?: number;
}) {
  if (!open) return null;
  const { title, body } = COPY[reason];
  const tiers = TIERS.filter((t) => t.id !== "fundador" || fundadorSeatsRemaining > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-emerald-400 bg-black/90 p-5 shadow-xl backdrop-blur-md ring-1 ring-emerald-400"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-white">
          <X size={18} />
        </button>

        <h2 className="pr-6 text-lg font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm text-slate-300">{body}</p>

        <div className="mt-4 flex flex-col gap-2.5">
          {tiers.map(({ id, pitch }) => {
            const plan = PLANS[id];
            const isPro = id === "pro";
            return (
              <Link
                key={id}
                href="/panel/suscripcion"
                className={cn(
                  "block rounded-xl border p-3 transition-colors",
                  isPro ? "border-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15" : "border-white/10 bg-white/5 hover:border-white/25"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
                    {id === "fundador" && <Crown size={14} />}
                    {id === "mls" && <Globe size={14} className="text-violet-300" />}
                    {plan.name}
                    {isPro && (
                      <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Recomendado
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-bold text-white">
                    Gs. {plan.price.toLocaleString("es-PY")}
                    <span className="text-xs font-normal text-slate-400">/mes</span>
                  </span>
                </div>
                <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-300">
                  <Check size={13} className="mt-0.5 shrink-0 text-emerald-400" />
                  {pitch}
                </p>
              </Link>
            );
          })}
        </div>

        <Link href="/panel/suscripcion" className="mt-4 block">
          <span className="flex h-10 w-full items-center justify-center rounded-xl bg-emerald-500 text-sm font-medium text-white transition-colors hover:bg-emerald-600">
            Actualizar a Pro
          </span>
        </Link>
      </div>
    </div>
  );
}
