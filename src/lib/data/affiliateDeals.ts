import { createClient } from "@/lib/supabase/server";
import type { AffiliateLeadRow, Lead } from "@/types/domain";

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
