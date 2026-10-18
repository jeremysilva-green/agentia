import { createServiceClient } from "@/lib/supabase/service";
import { createMlsNotice } from "@/lib/notices/createMlsNotice";

type ServiceClient = ReturnType<typeof createServiceClient>;

// dlocalGoSync's DECLINED branch and the subscriptions-check cron's lapsed
// branch both used to inline this exact two-table update independently —
// extracted so "and also deactivate MLS membership on lapse" has one place
// to live instead of two copies that could drift. `plan` is passed in by
// the caller rather than re-fetched here, since both call sites already
// have it from their own query.
export async function deactivateSubscription(
  service: ServiceClient,
  { subscriptionId, agentId, plan }: { subscriptionId: string; agentId: string; plan: string | null }
): Promise<void> {
  await service.from("subscriptions").update({ status: "past_due" }).eq("id", subscriptionId);
  await service.from("agent_profiles").update({ is_active: false }).eq("id", agentId);

  if (plan !== "mls") return;

  // Guard (`eq("status", "active")`) keeps this a no-op for a membership
  // that's already inactive or was removed for fraud — removal must never
  // be undone by a plan lapse/renewal cycle.
  const { data: updated } = await service
    .from("mls_memberships")
    .update({ status: "inactive" })
    .eq("user_id", agentId)
    .eq("status", "active")
    .select("id")
    .maybeSingle();

  if (updated) {
    await createMlsNotice({
      recipientUserId: agentId,
      type: "membership_deactivated",
      title: "Tu membresía del MLS quedó inactiva",
      body: "Tu Plan MLS dejó de estar activo, así que tu membresía del MLS pasó a estado inactivo. Tus registros y avisos existentes se conservan — podés reactivarla renovando tu Plan MLS.",
      eventAt: new Date(),
    });
  }
}
