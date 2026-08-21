import { createClient } from "@/lib/supabase/server";
import { PROPERTY_TYPE_LABELS, isPropertyType } from "@/lib/constants/propertyTypes";
import type { Lead, LeadPipelineRow } from "@/types/domain";

export async function getAgentLeadPipeline(agentId: string): Promise<LeadPipelineRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("leads")
    .select(
      "*, properties(title, price, currency), affiliate_links(profiles(username)), client_requests(property_type, city)"
    )
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  type Row = Lead & {
    properties: { title: string; price: number; currency: string } | null;
    affiliate_links: { profiles: { username: string } | null } | null;
    client_requests: { property_type: string | null; city: string } | null;
  };

  const rows = (data ?? []) as unknown as Row[];

  return rows.map((row) => {
    const { properties, affiliate_links, client_requests, ...lead } = row;
    const requestType = client_requests?.property_type;
    const fallbackTitle = client_requests
      ? `${requestType && isPropertyType(requestType) ? PROPERTY_TYPE_LABELS[requestType].es : "Propiedad"} en ${client_requests.city}`
      : "Propiedad";

    return {
      ...lead,
      property_title: properties?.title ?? fallbackTitle,
      property_price: properties?.price ?? 0,
      property_currency: properties?.currency ?? "PYG",
      affiliate_username: affiliate_links?.profiles?.username ?? null,
    };
  });
}
