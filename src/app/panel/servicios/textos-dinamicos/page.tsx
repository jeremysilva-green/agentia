import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Type } from "lucide-react";
import { getAgentContext } from "@/lib/data/panel";
import { createClient } from "@/lib/supabase/server";
import { MotionTextsFrame } from "@/components/panel/MotionTextsFrame";
import { hasActiveProAccess, BASICO_FREE_MOTION_TRIES } from "@/lib/plans";
import { getFundadorSeatsRemaining } from "@/lib/data/fundador";

export default async function TextosDinamicosPage() {
  const ctx = await getAgentContext();
  if (!ctx) redirect("/ingresar");

  const eligible = hasActiveProAccess(ctx.subscription);

  const supabase = await createClient();
  const { data: credits } = await supabase
    .from("agent_ai_credits")
    .select("free_motion_tries_used")
    .eq("agent_id", ctx.userId)
    .maybeSingle();

  const fundadorSeatsRemaining = eligible ? 1 : await getFundadorSeatsRemaining();

  return (
    <div className="flex flex-col gap-4">
      <Link href="/panel/servicios" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} />
        Volver a Servicios
      </Link>

      <h1 className="font-display flex items-center gap-2 text-2xl font-semibold text-white">
        <Type size={22} className="text-emerald-400" />
        Textos Dinámicos
      </h1>

      <MotionTextsFrame
        isFree={!eligible}
        triesRemaining={Math.max(0, BASICO_FREE_MOTION_TRIES - (credits?.free_motion_tries_used ?? 0))}
        triesTotal={BASICO_FREE_MOTION_TRIES}
        fundadorSeatsRemaining={fundadorSeatsRemaining}
      />
    </div>
  );
}
