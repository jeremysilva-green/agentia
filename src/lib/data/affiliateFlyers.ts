import { createClient } from "@/lib/supabase/server";
import type { PropertyFlyerRow } from "@/lib/data/propertyFlyers";

/**
 * The affiliate's saved flyers, in the same shape as the agent's so one grid
 * shows both; `share_code` is the affiliate's own /s/<code> link.
 */
export async function listAffiliateFlyersForUser(userId: string): Promise<PropertyFlyerRow[]> {
  const supabase = await createClient();

  const [{ data }, { data: links }] = await Promise.all([
    supabase
      .from("affiliate_flyers")
      .select("*, properties(title, city)")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase.from("short_links").select("property_id, code, click_count").eq("user_id", userId),
  ]);
  const linkByProperty = new Map((links ?? []).map((link) => [link.property_id, link]));

  type Row = {
    id: string;
    property_id: string;
    user_id: string;
    storage_path: string;
    accent_color: string;
    created_at: string;
    updated_at: string;
    properties: { title: string; city: string } | null;
  };

  return ((data ?? []) as unknown as Row[])
    .filter((row) => row.properties)
    .map(({ properties, user_id, ...flyer }) => ({
      ...flyer,
      agent_id: user_id,
      property_title: properties!.title,
      property_city: properties!.city,
      share_code: linkByProperty.get(flyer.property_id)?.code ?? null,
      click_count: linkByProperty.get(flyer.property_id)?.click_count ?? 0,
    }));
}
