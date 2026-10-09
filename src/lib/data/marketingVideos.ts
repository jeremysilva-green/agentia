import { createClient } from "@/lib/supabase/server";
import type { MarketingVideo, Property } from "@/types/domain";

export type MarketingVideoRow = MarketingVideo & {
  property_title: string;
  property_price: number;
  property_currency: string;
  property_listing_type: Property["listing_type"];
  property_city: string;
  property_address: string | null;
  property_updated_at: string;
};

export async function listMarketingVideosForAgent(agentId: string): Promise<MarketingVideoRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("marketing_videos")
    .select("*, properties(title, price, currency, listing_type, city, address, updated_at)")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  type Row = MarketingVideo & {
    properties: {
      title: string;
      price: number;
      currency: string;
      listing_type: Property["listing_type"];
      city: string;
      address: string | null;
      updated_at: string;
    } | null;
  };

  const rows = (data ?? []) as unknown as Row[];

  return rows
    .filter((row) => row.properties)
    .map((row) => {
      const { properties, ...video } = row;
      return {
        ...video,
        property_title: properties!.title,
        property_price: properties!.price,
        property_currency: properties!.currency,
        property_listing_type: properties!.listing_type,
        property_city: properties!.city,
        property_address: properties!.address,
        property_updated_at: properties!.updated_at,
      };
    });
}

export async function getMarketingVideoForProperty(propertyId: string): Promise<MarketingVideo | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("marketing_videos").select("*").eq("property_id", propertyId).maybeSingle();
  return data;
}
