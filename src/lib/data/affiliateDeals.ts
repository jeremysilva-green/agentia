import { createClient } from "@/lib/supabase/server";
import { AFFILIATE_COMMISSION_PCT } from "@/lib/constants/commission";
import type { AffiliateLeadRow, AffiliateSaleNotice, Lead } from "@/types/domain";

export async function getAffiliateLeads(userId: string): Promise<AffiliateLeadRow[]> {
  const supabase = await createClient();

  const { data: links } = await supabase.from("affiliate_links").select("id").eq("user_id", userId);
  const linkIds = (links ?? []).map((l) => l.id);
  if (linkIds.length === 0) return [];

  const { data } = await supabase
    .from("leads")
    .select("*, properties(title, agent_profiles(profiles(full_name, username, phone)))")
    .in("affiliate_link_id", linkIds)
    .order("created_at", { ascending: false });

  type Row = Lead & {
    properties: {
      title: string;
      agent_profiles: { profiles: { full_name: string | null; username: string; phone: string | null } | null } | null;
    } | null;
  };

  const rows = (data ?? []) as unknown as Row[];

  return rows.map((row) => {
    const { properties, ...lead } = row;
    const agentProfile = properties?.agent_profiles?.profiles;
    return {
      ...lead,
      property_title: properties?.title ?? "Propiedad",
      agent_name: agentProfile?.full_name || agentProfile?.username || "Agente",
      agent_phone: agentProfile?.phone ?? null,
    };
  });
}

// Properties this affiliate promoted that are now sold. Matched directly on
// properties.status rather than leads.status="sold", since an agent can mark
// a property sold from the property form with no tracked referral lead
// involved at all. When a lead *was* closed for it ("Trato cerrado"), we
// enrich the notice with its commission info; otherwise it's a plain heads-up
// to go contact the agent.
export async function getAffiliateSaleNotifications(userId: string): Promise<AffiliateSaleNotice[]> {
  const supabase = await createClient();

  const { data: links } = await supabase.from("affiliate_links").select("id, property_id").eq("user_id", userId);
  if (!links || links.length === 0) return [];

  const linkIds = links.map((l) => l.id);
  const propertyIds = links.map((l) => l.property_id);

  const [{ data: properties }, { data: closedLeads }] = await Promise.all([
    supabase
      .from("properties")
      .select("id, title, price, sold_at, agent_profiles(profiles(full_name, username, phone))")
      .in("id", propertyIds)
      .eq("status", "sold"),
    supabase
      .from("leads")
      .select("property_id, commission_amount, commission_paid_at, report_path")
      .in("affiliate_link_id", linkIds)
      .eq("status", "sold"),
  ]);

  type PropertyRow = {
    id: string;
    title: string;
    price: number;
    sold_at: string | null;
    agent_profiles: { profiles: { full_name: string | null; username: string; phone: string | null } | null } | null;
  };

  const leadByPropertyId = new Map((closedLeads ?? []).map((lead) => [lead.property_id, lead]));

  return ((properties ?? []) as unknown as PropertyRow[])
    .map((property) => {
      const agentProfile = property.agent_profiles?.profiles;
      const lead = leadByPropertyId.get(property.id);
      // Only leads closed via "Trato cerrado" have a real, agreed commission
      // amount. Otherwise estimate it off the list price so the affiliate at
      // least has a ballpark before they reach out.
      const commissionAmount = lead?.commission_amount ?? Math.round(property.price * (AFFILIATE_COMMISSION_PCT / 100));
      return {
        id: property.id,
        property_id: property.id,
        property_title: property.title,
        sold_at: property.sold_at,
        agent_name: agentProfile?.full_name || agentProfile?.username || "Agente",
        agent_phone: agentProfile?.phone ?? null,
        commission_amount: commissionAmount,
        commission_is_estimate: lead?.commission_amount == null,
        commission_paid_at: lead?.commission_paid_at ?? null,
        report_path: lead?.report_path ?? null,
      };
    })
    .sort((a, b) => (b.sold_at ?? "").localeCompare(a.sold_at ?? ""));
}
