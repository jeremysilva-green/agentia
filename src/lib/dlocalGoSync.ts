import { createServiceClient } from "@/lib/supabase/service";
import {
  DLOCAL_GO_PLANS,
  listDlocalGoExecutions,
  listDlocalGoSubscriptions,
  type DlocalGoExecution,
  type DlocalGoPlanId,
  type DlocalGoSubscription,
} from "@/lib/dlocalGo";
import { restoreHiddenPropertiesOnUpgrade } from "@/lib/actions/properties";

const PERIOD_DAYS = 30;

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// Links a dLocal subscription to the agent whose checkout created it, in
// order of how trustworthy the signal is:
//   1. external_id on one of its executions — confirmed live to be exactly
//      the agent id we passed on the subscribe link (?external_id=...).
//      An exact match on our own UUID, not a guess.
//   2. The checkout form's client_document matches exactly one agent's
//      profiles.ci.
// There is deliberately no further fallback. An earlier "exactly one
// unlinked pending subscription for this plan" fallback was tried and
// confirmed unsafe TWICE in live testing: it linked a real agent's
// unrelated pending subscription to someone else's payment both times a
// duplicate test checkout left a dangling dLocal subscription with no
// matching local row. Leaving a subscription unlinked for manual review
// is the safe failure mode; guessing is not.
async function linkSubscription(
  planId: DlocalGoPlanId,
  dlocalSub: DlocalGoSubscription,
  executions: DlocalGoExecution[]
): Promise<string | null> {
  const service = createServiceClient();

  async function linkToAgent(agentId: string): Promise<string | null> {
    const { data: candidates } = await service
      .from("subscriptions")
      .select("id")
      .eq("agent_id", agentId)
      .eq("plan", planId)
      .eq("status", "pending")
      .is("dlocal_go_subscription_id", null)
      .order("created_at", { ascending: false })
      .limit(1);
    if (!candidates?.length) return null;
    await service.from("subscriptions").update({ dlocal_go_subscription_id: dlocalSub.id }).eq("id", candidates[0].id);
    return candidates[0].id;
  }

  const externalId = executions.find((e) => e.external_id)?.external_id;
  if (externalId) {
    const linkedId = await linkToAgent(externalId);
    if (linkedId) return linkedId;
  }

  if (dlocalSub.client_document) {
    const { data: profiles } = await service.from("profiles").select("id").eq("ci", dlocalSub.client_document);
    if (profiles?.length === 1) {
      const linkedId = await linkToAgent(profiles[0].id);
      if (linkedId) return linkedId;
    }
  }

  return null;
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

    for (const dlocalSub of dlocalSubs) {
      summary.subscriptionsChecked += 1;

      const executions = (await listDlocalGoExecutions(planId, dlocalSub.id)).sort((a, b) =>
        a.created_at.localeCompare(b.created_at)
      );

      let { data: subscription } = await service
        .from("subscriptions")
        .select("id, agent_id, plan, status")
        .eq("dlocal_go_subscription_id", dlocalSub.id)
        .maybeSingle();

      if (!subscription) {
        const linkedSubscriptionId = await linkSubscription(planKey, dlocalSub, executions);
        if (!linkedSubscriptionId) {
          summary.unlinked += 1;
          continue;
        }
        ({ data: subscription } = await service.from("subscriptions").select("id, agent_id, plan, status").eq("id", linkedSubscriptionId).single());
      }
      if (!subscription) continue;
      // A cancelled or switched subscription must not be re-activated by an old execution.
      if (subscription.plan !== planKey) continue;

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
