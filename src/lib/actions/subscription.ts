"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isPlanId, FUNDADOR_SEAT_LIMIT, type PlanId } from "@/lib/plans";

export type CancelSubscriptionState = { error?: string } | undefined;

// Cancellation takes effect immediately (not at period end): flips the
// subscription to "canceled" so the daily Pagopar cron (which only ever
// selects status="trialing"/"active" subscriptions) stops charging the
// card, and unpublishes the agent's portfolio. Card-on-file fields on
// agent_profiles are deliberately left untouched so resubscribing later
// doesn't require re-entering payment details.
export async function cancelSubscription(): Promise<CancelSubscriptionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a ingresar." };

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, status")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription) return { error: "No se encontró una suscripción." };
  if (subscription.status === "canceled") return { error: "Tu suscripción ya está cancelada." };

  const service = createServiceClient();
  const { error: subError } = await service
    .from("subscriptions")
    .update({ status: "canceled" })
    .eq("id", subscription.id);
  if (subError) return { error: "No se pudo cancelar la suscripción. Intentá de nuevo." };

  await service.from("agent_profiles").update({ is_active: false }).eq("id", user.id);

  revalidatePath("/panel/suscripcion");
  revalidatePath("/panel");
  return undefined;
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
    revalidatePath("/panel/suscripcion");
    revalidatePath("/panel");
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
