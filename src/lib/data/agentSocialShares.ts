import { createClient } from "@/lib/supabase/server";
import type { AgentSocialShare, AgentSocialShareRow, Property } from "@/types/domain";

export async function getAgentSocialSharesForAgent(agentId: string): Promise<AgentSocialShareRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("agent_social_shares")
    .select("*, properties(title, city, price, currency, status, listing_type)")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  type Row = AgentSocialShare & {
    properties: {
      title: string;
      city: string;
      price: number;
      currency: string;
      status: Property["status"];
      listing_type: Property["listing_type"];
    } | null;
  };

  const rows = (data ?? []) as unknown as Row[];

  return rows
    .filter((row) => row.properties)
    .map((row) => {
      const { properties, ...share } = row;
      return {
        ...share,
        property_title: properties!.title,
        property_city: properties!.city,
        property_price: properties!.price,
        property_currency: properties!.currency,
        property_status: properties!.status,
        property_listing_type: properties!.listing_type,
      };
    });
}
