import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAgentContext } from "@/lib/data/panel";
import { createClient } from "@/lib/supabase/server";
import { AiEnhanceWidget } from "@/components/panel/AiEnhanceWidget";
import { hasActiveProAccess, BASICO_FREE_ENHANCE_TRIES } from "@/lib/plans";
import { getFundadorSeatsRemaining } from "@/lib/data/fundador";

const DEFAULT_MONTHLY_ALLOWANCE = 100;

export default async function MejorarConIaPage() {
  const ctx = await getAgentContext();
  if (!ctx) redirect("/ingresar");

  const eligible = hasActiveProAccess(ctx.subscription);

  // Lazy-created on first real charge (try_charge_ai_credit) — no row yet
  // just means the agent hasn't used this feature before, so the default
  // allowance is exactly what they'd see once one exists.
  const supabase = await createClient();
  const { data: credits } = await supabase
    .from("agent_ai_credits")
    .select("credits_remaining, plan_monthly_allowance, free_tries_used")
    .eq("agent_id", ctx.userId)
    .maybeSingle();

  const fundadorSeatsRemaining = eligible ? 1 : await getFundadorSeatsRemaining();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/panel/servicios" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} />
        Volver a Servicios
      </Link>

      <AiEnhanceWidget
        isFree={!eligible}
        creditsRemaining={
          eligible
            ? (credits?.credits_remaining ?? DEFAULT_MONTHLY_ALLOWANCE)
            : Math.max(0, BASICO_FREE_ENHANCE_TRIES - (credits?.free_tries_used ?? 0))
        }
        creditsTotal={eligible ? (credits?.plan_monthly_allowance ?? DEFAULT_MONTHLY_ALLOWANCE) : BASICO_FREE_ENHANCE_TRIES}
        fundadorSeatsRemaining={fundadorSeatsRemaining}
      />
    </div>
  );
}
