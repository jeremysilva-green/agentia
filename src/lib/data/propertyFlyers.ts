import { createClient } from "@/lib/supabase/server";
import type { PropertyFlyer } from "@/types/domain";

export type PropertyFlyerRow = PropertyFlyer & {
  property_title: string;
  property_city: string;
  // The property's short share link (agentia.com.py/sa/<code>), if it has one.
  share_code: string | null;
  click_count: number;
};

export async function listPropertyFlyersForAgent(agentId: string): Promise<PropertyFlyerRow[]> {
  const supabase = await createClient();

  const [{ data }, { data: shares }] = await Promise.all([
    supabase
      .from("property_flyers")
      .select("*, properties(title, city)")
      .eq("agent_id", agentId)
      .order("updated_at", { ascending: false }),
    supabase.from("agent_social_shares").select("property_id, code, click_count").eq("agent_id", agentId),
  ]);
  const shareByProperty = new Map((shares ?? []).map((share) => [share.property_id, share]));

  type Row = PropertyFlyer & { properties: { title: string; city: string } | null };

  return ((data ?? []) as unknown as Row[])
    .filter((row) => row.properties)
    .map(({ properties, ...flyer }) => ({
      ...flyer,
      property_title: properties!.title,
      property_city: properties!.city,
      share_code: shareByProperty.get(flyer.property_id)?.code ?? null,
      click_count: shareByProperty.get(flyer.property_id)?.click_count ?? 0,
    }));
}
