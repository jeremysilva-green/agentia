"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isPlanId, FUNDADOR_SEAT_LIMIT, type PlanId } from "@/lib/plans";
import { enforceBasicoPropertyLimit } from "@/lib/actions/properties";
import { DLOCAL_GO_PLANS, deactivateDlocalGoSubscription } from "@/lib/dlocalGo";

export type CancelSubscriptionState = { error?: string } | undefined;

// "Cancelar suscripción" downgrades immediately to Básico (free) rather
// than fully deactivating the agent — same effect as picking Básico from
// the pricing cards, just under the name/confirm-copy a paying agent
// expects to see. Delegates to selectPlan so there's one place that handles
// stopping the monthly charge and capping active properties at the Básico
// limit.
export async function cancelSubscription(): Promise<CancelSubscriptionState> {
  return selectPlan("basico");
}

export type SelectPlanState = { error?: string } | undefined;

// Switching to "basico" takes effect immediately (free, no payment step).
// Switching to "pro"/"fundador" only records the chosen plan here — the
// caller (PricingPlans) follows up by calling the crear-pedido-pagopar edge
// function client-side, which reads subscription.plan to charge the right
// amount and only flips status to "active" once Pagopar confirms payment.
export async function selectPlan(planId: PlanId): Promise<SelectPlanState> {
  if (!isPlanId(planId)) return { error: "Plan inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a ingresar." };

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, plan, dlocal_go_subscription_id")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!subscription) return { error: "No se encontró tu suscripción." };
  if (subscription.plan === planId) return { error: "Ya tenés este plan activo." };

  const service = createServiceClient();

  if (planId === "fundador") {
    const { count } = await service
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("plan", "fundador");
    if ((count ?? 0) >= FUNDADOR_SEAT_LIMIT) {
      return { error: "Ya se agotaron los cupos del plan Fundador." };
    }
  }

  if (planId === "basico") {
    // Stop dLocal's monthly billing before downgrading locally — if that
    // fails, don't downgrade, or the agent would keep being charged with no
    // record of it on our side.
    if (subscription.dlocal_go_subscription_id && (subscription.plan === "pro" || subscription.plan === "fundador")) {
      try {
        await deactivateDlocalGoSubscription(DLOCAL_GO_PLANS[subscription.plan].planId, subscription.dlocal_go_subscription_id);
      } catch {
        return { error: "No se pudo cancelar la suscripción con dLocal Go. Intentá de nuevo." };
      }
    }

    const { error } = await service
      .from("subscriptions")
      .update({ plan: "basico", status: "active", period_end: null, trial_ends_at: null, dlocal_go_subscription_id: null })
      .eq("id", subscription.id);
    if (error) return { error: "No se pudo cambiar de plan. Intentá de nuevo." };

    await service.from("agent_profiles").update({ is_active: true }).eq("id", user.id);
    await enforceBasicoPropertyLimit(user.id);

    revalidatePath("/panel/suscripcion");
    revalidatePath("/panel");
    revalidatePath("/panel/propiedades");
    return undefined;
  }

  if (subscription.dlocal_go_subscription_id) {
    // Plan MLS is pitched as "everything in Pro, plus the network," so
    // switching into or out of it shouldn't force the usual cancel-first
    // detour other paid-to-paid switches (e.g. pro<->fundador) still
    // require. Deactivate the old dLocal Go subscription first — same call
    // already used for the ->basico path above — then fall through to the
    // normal pending->active flow for the new plan.
    const isMlsSwap = planId === "mls" || subscription.plan === "mls";
    if (!isMlsSwap) {
      return { error: "Cancelá tu plan actual antes de cambiar a otro plan pago." };
    }
    if (subscription.plan === "pro" || subscription.plan === "fundador" || subscription.plan === "mls") {
      try {
        await deactivateDlocalGoSubscription(DLOCAL_GO_PLANS[subscription.plan].planId, subscription.dlocal_go_subscription_id);
      } catch {
        return { error: "No se pudo cancelar la suscripción anterior. Intentá de nuevo." };
      }
    }
  }

  // "pending" until dLocal Go confirms the first charge — otherwise an
  // abandoned checkout would leave the row saying plan="pro" while status
  // is still whatever it was before (e.g. "active" from a free Básico plan).
  // dlocal_go_subscription_id is cleared here too (not just on the ->basico
  // path) so a swap out of an existing paid plan doesn't leave a stale id
  // around to confuse the next dlocal-go-sync run.
  const { error } = await service
    .from("subscriptions")
    .update({ plan: planId, status: "pending", dlocal_go_subscription_id: null })
    .eq("id", subscription.id);
  if (error) return { error: "No se pudo actualizar el plan. Intentá de nuevo." };

  revalidatePath("/panel/suscripcion");
  return undefined;
}
