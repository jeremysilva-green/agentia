import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { chargeSubscriptionDlocal } from "@/lib/dlocalSubscription";

// dLocal equivalent of bancard-cobro-mensual / pagopar-cobro-mensual (both
// left running in parallel, untouched). Only agents with a dLocal card on
// file get charged here.
function isAuthorized(request: Request) {
  const bearer = request.headers.get("authorization");
  return bearer === `Bearer ${process.env.CRON_SECRET}`;
}

async function runDlocalCobroMensual() {
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

    if (!agentProfile?.tarjeta_guardada || agentProfile.proveedor_tarjeta !== "dLocal") continue;

    const result = await chargeSubscriptionDlocal(subscription.agent_id);
    results.push({ agentId: subscription.agent_id, success: result.success, error: "error" in result ? result.error : undefined });

    if (!result.success) {
      // Retry once immediately via RESUBMISSION per doc §7 before giving up
      // for this cycle — cheap to attempt, and covers transient declines.
      const retry = await chargeSubscriptionDlocal(subscription.agent_id, { isRetry: true });
      if (retry.success) {
        results[results.length - 1] = { agentId: subscription.agent_id, success: true };
      } else {
        console.error(`[dlocal-cobro-mensual] agent ${subscription.agent_id}: cobro falló — ${result.error}`);
      }
    }
  }

  return { ok: true, processed: results.length, results };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await runDlocalCobroMensual());
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await runDlocalCobroMensual());
}
