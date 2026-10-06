import { createServiceClient } from "@/lib/supabase/service";
import { DLOCAL_GO_PLANS, listDlocalGoExecutions, listDlocalGoSubscriptions, type DlocalGoPlanId } from "@/lib/dlocalGo";
import { restoreHiddenPropertiesOnUpgrade } from "@/lib/actions/properties";

const PERIOD_DAYS = 30;

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// Links a dLocal subscription to the agent whose checkout created it. Only
// links when there's exactly one unlinked pending subscription for that plan
// — with two, guessing could attach a subscription to the wrong agent, so
// it's left for manual review instead.
async function linkUnlinkedSubscriptions(planId: DlocalGoPlanId, dlocalIds: string[]) {
  const service = createServiceClient();
  const { data: linked } = await service.from("subscriptions").select("dlocal_go_subscription_id").not("dlocal_go_subscription_id", "is", null);
  const linkedIds = new Set((linked ?? []).map((row) => row.dlocal_go_subscription_id));

  for (const dlocalId of dlocalIds) {
    if (linkedIds.has(dlocalId)) continue;

    const { data: candidates } = await service
      .from("subscriptions")
      .select("id")
      .eq("plan", planId)
      .eq("status", "pending")
      .is("dlocal_go_subscription_id", null);

    if (candidates?.length === 1) {
      await service.from("subscriptions").update({ dlocal_go_subscription_id: dlocalId }).eq("id", candidates[0].id);
      linkedIds.add(dlocalId);
    }
  }
}

export type DlocalGoSyncSummary = { subscriptionsChecked: number; paymentsCreated: number; unlinked: number };

// Reconciles dLocal Go subscriptions into our tables. Every COMPLETED
// execution becomes a payments row, moved to 'approved' — that status update
// is what fires the FacturaSend invoicing trigger.
export async function syncDlocalGoSubscriptions(): Promise<DlocalGoSyncSummary> {
  const service = createServiceClient();
  const summary: DlocalGoSyncSummary = { subscriptionsChecked: 0, paymentsCreated: 0, unlinked: 0 };

  for (const planKey of Object.keys(DLOCAL_GO_PLANS) as DlocalGoPlanId[]) {
    const { planId } = DLOCAL_GO_PLANS[planKey];
    const dlocalSubs = await listDlocalGoSubscriptions(planId);
    await linkUnlinkedSubscriptions(
      planKey,
      dlocalSubs.map((s) => s.id)
    );

    for (const dlocalSub of dlocalSubs) {
      summary.subscriptionsChecked += 1;

      const { data: subscription } = await service
        .from("subscriptions")
        .select("id, agent_id, plan, status")
        .eq("dlocal_go_subscription_id", dlocalSub.id)
        .maybeSingle();
      if (!subscription) {
        summary.unlinked += 1;
        continue;
      }
      // A cancelled or switched subscription must not be re-activated by an old execution.
      if (subscription.plan !== planKey) continue;

      const executions = (await listDlocalGoExecutions(planId, dlocalSub.id)).sort((a, b) =>
        a.created_at.localeCompare(b.created_at)
      );

      for (const execution of executions) {
        const { data: existing } = await service
          .from("payments")
          .select("id, status")
          .eq("dlocal_go_payment_id", execution.order_id)
          .maybeSingle();

        if (execution.status === "COMPLETED") {
          if (existing?.status === "approved") continue;
          if (existing) {
            await service.from("payments").update({ status: "approved" }).eq("id", existing.id);
          } else {
            const { data: inserted } = await service
              .from("payments")
              .insert({
                subscription_id: subscription.id,
                dlocal_go_payment_id: execution.order_id,
                dlocal_go_tipo: "recurrente",
                amount: execution.amount_paid,
                currency: "PYG",
                plan: subscription.plan,
                status: "initiated",
              })
              .select("id")
              .single();
            // Insert first, then update — the invoicing trigger only fires on an UPDATE to 'approved'.
            if (inserted) await service.from("payments").update({ status: "approved" }).eq("id", inserted.id);
            summary.paymentsCreated += 1;
          }
        } else if (execution.status === "DECLINED" && !existing) {
          await service.from("payments").insert({
            subscription_id: subscription.id,
            dlocal_go_payment_id: execution.order_id,
            dlocal_go_tipo: "recurrente",
            amount: execution.amount_paid,
            currency: "PYG",
            plan: subscription.plan,
            status: "rejected",
            error_message: "dLocal Go rechazó el cobro de la renovación.",
          });
        }
      }

      const latest = executions[executions.length - 1];
      if (!latest) continue;

      if (latest.status === "COMPLETED") {
        const wasActive = subscription.status === "active";
        const periodStart = new Date(latest.created_at);
        await service
          .from("subscriptions")
          .update({
            status: "active",
            period_start: periodStart.toISOString().slice(0, 10),
            period_end: addDays(periodStart, PERIOD_DAYS).toISOString().slice(0, 10),
          })
          .eq("id", subscription.id);
        await service.from("agent_profiles").update({ is_active: true }).eq("id", subscription.agent_id);

        if (!wasActive && (subscription.plan === "pro" || subscription.plan === "fundador")) {
          await restoreHiddenPropertiesOnUpgrade(subscription.agent_id);
        }
      } else if (latest.status === "DECLINED") {
        await service.from("subscriptions").update({ status: "past_due" }).eq("id", subscription.id);
        await service.from("agent_profiles").update({ is_active: false }).eq("id", subscription.agent_id);
      }
    }
  }

  return summary;
}
