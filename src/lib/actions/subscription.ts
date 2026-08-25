"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isPlanId, FUNDADOR_SEAT_LIMIT, type PlanId } from "@/lib/plans";
import { enforceBasicoPropertyLimit } from "@/lib/actions/properties";

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
    .select("id, plan")
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
    const { error } = await service
      .from("subscriptions")
      .update({ plan: "basico", status: "active", period_end: null, trial_ends_at: null })
      .eq("id", subscription.id);
    if (error) return { error: "No se pudo cambiar de plan. Intentá de nuevo." };

    await service.from("agent_profiles").update({ is_active: true }).eq("id", user.id);
    await enforceBasicoPropertyLimit(user.id);

    revalidatePath("/panel/suscripcion");
    revalidatePath("/panel");
    revalidatePath("/panel/propiedades");
    return undefined;
  }

  // "pending" until the Pagopar webhook confirms payment — otherwise an
  // abandoned checkout would leave the row saying plan="pro" while status
  // is still whatever it was before (e.g. "active" from a free Básico plan).
  const { error } = await service
    .from("subscriptions")
    .update({ plan: planId, status: "pending" })
    .eq("id", subscription.id);
  if (error) return { error: "No se pudo actualizar el plan. Intentá de nuevo." };

  revalidatePath("/panel/suscripcion");
  return undefined;
}
