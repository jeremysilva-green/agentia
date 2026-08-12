import { createClient } from "@/lib/supabase/server";
import type { AffiliateLink, AffiliateLinkRow, Property } from "@/types/domain";

export async function getAffiliateLinksForUser(userId: string): Promise<AffiliateLinkRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("affiliate_links")
    .select("*, properties(title, city, price, currency, status, listing_type, agent_profiles(slug))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  type Row = AffiliateLink & {
    properties: {
      title: string;
      city: string;
      price: number;
      currency: string;
      status: Property["status"];
      listing_type: Property["listing_type"];
      agent_profiles: { slug: string } | null;
    } | null;
  };

  const rows = (data ?? []) as unknown as Row[];
  const linkIds = rows.map((row) => row.id);

  const [{ data: viewRows }, { data: leadRows }, { data: shortLinkRows }] =
    linkIds.length > 0
      ? await Promise.all([
          supabase.from("lead_events").select("affiliate_link_id").in("affiliate_link_id", linkIds).eq("event_type", "view"),
          supabase.from("leads").select("affiliate_link_id").in("affiliate_link_id", linkIds),
          supabase.from("short_links").select("property_id, code").eq("user_id", userId),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }];

  const shortCodes = new Map<string, string>();
  for (const row of shortLinkRows ?? []) {
    shortCodes.set(row.property_id, row.code);
  }

  const viewCounts = new Map<string, number>();
  for (const row of viewRows ?? []) {
    if (row.affiliate_link_id) viewCounts.set(row.affiliate_link_id, (viewCounts.get(row.affiliate_link_id) ?? 0) + 1);
  }

  const leadCounts = new Map<string, number>();
  for (const row of leadRows ?? []) {
    if (row.affiliate_link_id) leadCounts.set(row.affiliate_link_id, (leadCounts.get(row.affiliate_link_id) ?? 0) + 1);
  }

  return rows
    .filter((row) => row.properties?.agent_profiles)
    .map((row) => {
      const { properties, ...link } = row;
      return {
        ...link,
        property_title: properties!.title,
        property_city: properties!.city,
        property_price: properties!.price,
        property_currency: properties!.currency,
        property_status: properties!.status,
        property_listing_type: properties!.listing_type,
        agent_slug: properties!.agent_profiles!.slug,
        view_count: viewCounts.get(link.id) ?? 0,
        lead_count: leadCounts.get(link.id) ?? 0,
        short_code: shortCodes.get(link.property_id) ?? null,
      };
    });
}
