"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

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
