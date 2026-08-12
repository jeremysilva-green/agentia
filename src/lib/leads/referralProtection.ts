import { createServiceClient } from "@/lib/supabase/service";

export const REFERRAL_PROTECTION_DAYS = 180;

function generateReferralCode() {
  return `REF-${crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

/**
 * Creates (or protects) a named lead from a "Chat" click.
 *
 * Referral protection: if this exact buyer (matched by phone) already has a
 * lead on this property whose protection window hasn't expired, the ORIGINAL
 * affiliate attribution is kept — even if this new click carries a different
 * ref or none at all. Only once the window expires can the property be
 * re-attributed on the next contact.
 */
export async function upsertLeadFromChatClick({
  propertyId,
  buyerName,
  buyerPhone,
  ref,
}: {
  propertyId: string;
  buyerName: string;
  buyerPhone: string;
  ref: string | null;
}): Promise<{ referralCode: string; leadId: string } | { error: string }> {
  const service = createServiceClient();

  const { data: property } = await service.from("properties").select("agent_id").eq("id", propertyId).single();
  if (!property) return { error: "Propiedad no encontrada." };

  let incomingAffiliateLinkId: string | null = null;
  if (ref) {
    const { data: refProfile } = await service.from("profiles").select("id").eq("username", ref).maybeSingle();
    if (refProfile) {
      const { data: link } = await service
        .from("affiliate_links")
        .select("id")
        .eq("property_id", propertyId)
        .eq("user_id", refProfile.id)
        .maybeSingle();
      incomingAffiliateLinkId = link?.id ?? null;
    }
  }

  const { data: existing } = await service
    .from("leads")
    .select("id, protected_until, referral_code")
    .eq("property_id", propertyId)
    .eq("buyer_phone", buyerPhone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const now = new Date();

  if (existing && new Date(existing.protected_until) >= now) {
    await service.from("leads").update({ buyer_name: buyerName }).eq("id", existing.id);
    return { referralCode: existing.referral_code, leadId: existing.id };
  }

  const protectedUntil = new Date(now);
  protectedUntil.setDate(protectedUntil.getDate() + REFERRAL_PROTECTION_DAYS);

  const { data: created, error } = await service
    .from("leads")
    .insert({
      referral_code: generateReferralCode(),
      property_id: propertyId,
      agent_id: property.agent_id,
      affiliate_link_id: incomingAffiliateLinkId,
      buyer_name: buyerName,
      buyer_phone: buyerPhone,
      referral_date: now.toISOString(),
      protected_until: protectedUntil.toISOString(),
    })
    .select("id, referral_code")
    .single();

  if (error || !created) return { error: "No se pudo registrar el lead." };

  return { referralCode: created.referral_code, leadId: created.id };
}
