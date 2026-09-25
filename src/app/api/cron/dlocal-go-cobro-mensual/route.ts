import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { chargeSubscriptionDlocalGo } from "@/lib/dlocalGoSubscription";

// dLocal Go equivalent of the old bancard-cobro-mensual cron. Selects
// trialing subscriptions whose trial just ended, or active subscriptions
// whose period_end is today or earlier. Only agents with a dLocal Go card on
// file get charged here; agents without one are left for subscriptions-check
// to mark past_due.
function isAuthorized(request: Request) {
  const bearer = request.headers.get("authorization");
  return bearer === `Bearer ${process.env.CRON_SECRET}`;
}

async function runDlocalGoCobroMensual() {
  const service = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  const [{ data: trialsDue }, { data: renewalsDue }] = await Promise.all([
    service.from("subscriptions").select("id, agent_id").eq("status", "trialing").lte("trial_ends_at", now),
    service.from("subscriptions").select("id, agent_id").eq("status", "active").lte("period_end", today),
  ]);

  const due = [...(trialsDue ?? []), ...(renewalsDue ?? [])];
  const results: { agentId: string; success: boolean; error?: string }[] = [];

  for (const subscription of due) {
    const { data: agentProfile } = await service
      .from("agent_profiles")
      .select("tarjeta_guardada, proveedor_tarjeta")
      .eq("id", subscription.agent_id)
      .single();

    if (!agentProfile?.tarjeta_guardada || agentProfile.proveedor_tarjeta !== "dLocalGo") {
      continue;
    }

    const result = await chargeSubscriptionDlocalGo(subscription.agent_id);
    results.push({ agentId: subscription.agent_id, success: result.success, error: "error" in result ? result.error : undefined });

    if (!result.success) {
      console.error(`[dlocal-go-cobro-mensual] agent ${subscription.agent_id}: cobro falló — ${result.error}`);
    }
  }

  return { ok: true, processed: results.length, results };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await runDlocalGoCobroMensual());
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await runDlocalGoCobroMensual());
}
