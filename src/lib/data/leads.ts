import { createClient } from "@/lib/supabase/server";
import type { Lead, LeadPipelineRow } from "@/types/domain";

export async function getAgentLeadPipeline(agentId: string): Promise<LeadPipelineRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("leads")
    .select("*, properties(title, price, currency), affiliate_links(profiles(username))")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  type Row = Lead & {
    properties: { title: string; price: number; currency: string } | null;
    affiliate_links: { profiles: { username: string } | null } | null;
  };

  const rows = (data ?? []) as unknown as Row[];

  return rows.map((row) => {
    const { properties, affiliate_links, ...lead } = row;
    return {
      ...lead,
      property_title: properties?.title ?? "Propiedad",
      property_price: properties?.price ?? 0,
      property_currency: properties?.currency ?? "PYG",
      affiliate_username: affiliate_links?.profiles?.username ?? null,
    };
  });
}
