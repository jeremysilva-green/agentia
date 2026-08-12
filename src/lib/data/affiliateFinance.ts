import { createClient } from "@/lib/supabase/server";

export type AffiliateFinanceDeal = {
  id: string;
  property_title: string;
  sale_price: number;
  currency: string;
  commission_amount: number;
  paid: boolean;
};

export type AffiliateFinanceSummary = {
  commissionThisMonth: number;
  pendingPayment: number;
  closedSalesCount: number;
  linkClicks: number;
  currency: string;
  deals: AffiliateFinanceDeal[];
};

export async function getAffiliateFinanceSummary(userId: string): Promise<AffiliateFinanceSummary> {
  const supabase = await createClient();

  const { data: links } = await supabase.from("affiliate_links").select("id").eq("user_id", userId);
  const linkIds = (links ?? []).map((l) => l.id);

  if (linkIds.length === 0) {
    return { commissionThisMonth: 0, pendingPayment: 0, closedSalesCount: 0, linkClicks: 0, currency: "PYG", deals: [] };
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ data: closedLeads }, { count: linkClicks }] = await Promise.all([
    supabase
      .from("leads")
      .select("id, sale_price, commission_amount, commission_confirmed_at, commission_paid_at, properties(title, currency)")
      .in("affiliate_link_id", linkIds)
      .not("commission_confirmed_at", "is", null)
      .order("commission_confirmed_at", { ascending: false }),
    supabase
      .from("lead_events")
      .select("id", { count: "exact", head: true })
      .in("affiliate_link_id", linkIds)
      .eq("event_type", "view"),
  ]);

  type Row = {
    id: string;
    sale_price: number | null;
    commission_amount: number | null;
    commission_confirmed_at: string | null;
    commission_paid_at: string | null;
    properties: { title: string; currency: string } | null;
  };

  const rows = (closedLeads ?? []) as unknown as Row[];

  let commissionThisMonth = 0;
  let pendingPayment = 0;
  let currency = "PYG";

  const deals: AffiliateFinanceDeal[] = rows.map((row) => {
    const amount = row.commission_amount ?? 0;
    if (row.properties?.currency) currency = row.properties.currency;
    if (row.commission_confirmed_at && row.commission_confirmed_at >= monthStart) commissionThisMonth += amount;
    if (!row.commission_paid_at) pendingPayment += amount;

    return {
      id: row.id,
      property_title: row.properties?.title ?? "Propiedad",
      sale_price: row.sale_price ?? 0,
      currency: row.properties?.currency ?? "PYG",
      commission_amount: amount,
      paid: Boolean(row.commission_paid_at),
    };
  });

  return {
    commissionThisMonth,
    pendingPayment,
    closedSalesCount: rows.length,
    linkClicks: linkClicks ?? 0,
    currency,
    deals,
  };
}
