import { createServiceClient } from "@/lib/supabase/service";

export type AffiliateRankingRow = { name: string; count: number };

const MONTH_LABELS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

// Ranking is shown publicly to incentivize affiliates, so it's computed with
// the service client (leads' RLS only allows the owning agent/affiliate to
// read individual rows) and only ever exposes a name + closed-sale count —
// never commission amounts or buyer/contact data.
export async function getAffiliateRankingForMonth(date = new Date()): Promise<{
  monthLabel: string;
  rows: AffiliateRankingRow[];
}> {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);

  const service = createServiceClient();
  const { data } = await service
    .from("leads")
    .select("affiliate_link_id, affiliate_links(user_id, profiles(full_name, username))")
    .eq("status", "sold")
    .not("affiliate_link_id", "is", null)
    .gte("commission_confirmed_at", start.toISOString())
    .lt("commission_confirmed_at", end.toISOString());

  const counts = new Map<string, AffiliateRankingRow>();
  for (const row of data ?? []) {
    const link = row.affiliate_links as {
      user_id: string;
      profiles: { full_name: string | null; username: string } | null;
    } | null;
    if (!link) continue;

    const name = link.profiles?.full_name || link.profiles?.username || "Afiliado";
    const current = counts.get(link.user_id) ?? { name, count: 0 };
    current.count += 1;
    counts.set(link.user_id, current);
  }

  const rows = Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return { monthLabel: MONTH_LABELS[date.getMonth()], rows };
}
