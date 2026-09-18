import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getAgentContext } from "@/lib/data/panel";
import { createClient } from "@/lib/supabase/server";
import { AiEnhanceWidget } from "@/components/panel/AiEnhanceWidget";

const DEFAULT_MONTHLY_ALLOWANCE = 100;

export default async function MejorarConIaPage() {
  const ctx = await getAgentContext();
  if (!ctx) redirect("/ingresar");

  const plan = ctx.subscription?.plan;
  const eligible = plan === "pro" || plan === "fundador";

  if (!eligible) {
    return (
      <div className="flex flex-col gap-6">
        <Link href="/panel/servicios" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={15} />
          Volver a Servicios
        </Link>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-neutral-700 bg-neutral-950 px-6 py-16 text-center">
          <Sparkles size={32} className="text-emerald-400" />
          <h1 className="font-display text-xl font-semibold text-white">Mejorar con IA</h1>
          <p className="max-w-sm text-sm text-slate-400">
            Esta función está disponible para los planes Pro y Fundador. Mejorá tu plan para empezar a usarla.
          </p>
          <Link
            href="/panel/suscripcion"
            className="mt-2 inline-flex h-10 items-center justify-center rounded-lg bg-emerald-500 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
          >
            Ver planes
          </Link>
        </div>
      </div>
    );
  }

  // Lazy-created on first real charge (try_charge_ai_credit) — no row yet
  // just means the agent hasn't used this feature before, so the default
  // allowance is exactly what they'd see once one exists.
  const supabase = await createClient();
  const { data: credits } = await supabase
    .from("agent_ai_credits")
    .select("credits_remaining, plan_monthly_allowance")
    .eq("agent_id", ctx.userId)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/panel/servicios" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} />
        Volver a Servicios
      </Link>

      <AiEnhanceWidget
        creditsRemaining={credits?.credits_remaining ?? DEFAULT_MONTHLY_ALLOWANCE}
        creditsTotal={credits?.plan_monthly_allowance ?? DEFAULT_MONTHLY_ALLOWANCE}
      />
    </div>
  );
}
