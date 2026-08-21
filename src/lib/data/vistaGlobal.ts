import { createClient } from "@/lib/supabase/server";

export type RangeStats = {
  leads: number;
  portfolioClicks: number;
  propertyClicks: number;
  affiliateLinkClicks: number;
  solicitudesVendedor: number;
  solicitudesComprador: number;
  conversations: number;
  agendamientos: number;
  acuerdosSigned: number;
  salesPYG: number;
  salesUSD: number;
  affiliatesPaid: number;
};

export type VistaGlobalStats = RangeStats & {
  monthLabel: string;
  monthStart: Date;
  totalProperties: number;
  ratingsTotal: number;
  ratingsAvg: number;
};

export type ArrStats = RangeStats & {
  rangeStart: Date;
  rangeEnd: Date;
  totalProperties: number;
  ratingsTotal: number;
  ratingsAvg: number;
};

export type ArrEligibility = {
  eligible: boolean;
  accountCreatedAt: Date;
  daysRemaining: number;
};

const MONTH_LABELS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// Every metric here is a count/sum over [rangeStart, rangeEnd) — shared by
// the monthly Vista Global view and the annual ARR report, which are the
// same set of stats over different windows.
async function getRangeStats(agentId: string, rangeStart: Date, rangeEnd: Date): Promise<RangeStats> {
  const supabase = await createClient();
  const startIso = rangeStart.toISOString();
  const endIso = rangeEnd.toISOString();

  const [
    { count: leads },
    { count: portfolioClicks },
    { count: propertyClicks },
    { count: affiliateLinkClicks },
    { count: solicitudesVendedor },
    { count: solicitudesComprador },
    { count: conversations },
    { count: agendamientos },
    { count: acuerdosSigned },
    { data: soldRows },
    { data: paidLeads },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .gte("created_at", startIso)
      .lt("created_at", endIso),
    supabase
      .from("portfolio_views")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .gte("created_at", startIso)
      .lt("created_at", endIso),
    supabase
      .from("lead_events")
      .select("id, properties!inner(agent_id)", { count: "exact", head: true })
      .eq("properties.agent_id", agentId)
      .eq("event_type", "view")
      .gte("created_at", startIso)
      .lt("created_at", endIso),
    supabase
      .from("lead_events")
      .select("id, properties!inner(agent_id)", { count: "exact", head: true })
      .eq("properties.agent_id", agentId)
      .eq("event_type", "view")
      .not("affiliate_link_id", "is", null)
      .gte("created_at", startIso)
      .lt("created_at", endIso),
    supabase
      .from("client_requests")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .eq("kind", "vendedor")
      .gte("created_at", startIso)
      .lt("created_at", endIso),
    supabase
      .from("client_requests")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .eq("kind", "comprador")
      .gte("created_at", startIso)
      .lt("created_at", endIso),
    supabase
      .from("chat_conversations")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .gte("created_at", startIso)
      .lt("created_at", endIso),
    supabase
      .from("agendamientos")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .gte("created_at", startIso)
      .lt("created_at", endIso),
    supabase
      .from("private_agreements")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .gte("owner_signed_at", startIso)
      .lt("owner_signed_at", endIso),
    supabase
      .from("properties")
      .select("price, currency")
      .eq("agent_id", agentId)
      .eq("status", "sold")
      .gte("sold_at", startIso)
      .lt("sold_at", endIso),
    supabase
      .from("leads")
      .select("affiliate_links(user_id)")
      .eq("agent_id", agentId)
      .not("commission_paid_at", "is", null)
      .gte("commission_paid_at", startIso)
      .lt("commission_paid_at", endIso),
  ]);

  let salesPYG = 0;
  let salesUSD = 0;
  for (const row of soldRows ?? []) {
    if (row.currency === "USD") salesUSD += row.price;
    else salesPYG += row.price;
  }

  const affiliatesPaid = new Set(
    (paidLeads as unknown as { affiliate_links: { user_id: string } | null }[] | null ?? [])
      .map((row) => row.affiliate_links?.user_id)
      .filter((id): id is string => Boolean(id))
  ).size;

  return {
    leads: leads ?? 0,
    portfolioClicks: portfolioClicks ?? 0,
    propertyClicks: propertyClicks ?? 0,
    affiliateLinkClicks: affiliateLinkClicks ?? 0,
    solicitudesVendedor: solicitudesVendedor ?? 0,
    solicitudesComprador: solicitudesComprador ?? 0,
    conversations: conversations ?? 0,
    agendamientos: agendamientos ?? 0,
    acuerdosSigned: acuerdosSigned ?? 0,
    salesPYG,
    salesUSD,
    affiliatesPaid,
  };
}

async function getSnapshotStats(agentId: string) {
  const supabase = await createClient();
  const [{ count: totalProperties }, { data: ratings }] = await Promise.all([
    supabase.from("properties").select("id", { count: "exact", head: true }).eq("agent_id", agentId),
    supabase.from("agent_ratings").select("rating").eq("agent_id", agentId),
  ]);

  const ratingsTotal = ratings?.length ?? 0;
  const ratingsAvg = ratingsTotal > 0 ? ratings!.reduce((sum, r) => sum + r.rating, 0) / ratingsTotal : 0;

  return { totalProperties: totalProperties ?? 0, ratingsTotal, ratingsAvg };
}

export async function getVistaGlobalStats(agentId: string): Promise<VistaGlobalStats> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [rangeStats, snapshot] = await Promise.all([
    getRangeStats(agentId, monthStart, monthEnd),
    getSnapshotStats(agentId),
  ]);

  const monthLabel = `${MONTH_LABELS[monthStart.getMonth()]} ${monthStart.getFullYear()}`;

  return { ...rangeStats, ...snapshot, monthLabel, monthStart };
}

// Gated on account age rather than calendar-year boundary — an agent needs
// a full 12 months of activity behind them before an annual report says
// anything meaningful, regardless of when in the calendar year they joined.
export async function getArrEligibility(agentId: string): Promise<ArrEligibility> {
  const supabase = await createClient();
  const { data } = await supabase.from("agent_profiles").select("created_at").eq("id", agentId).single();

  const accountCreatedAt = data?.created_at ? new Date(data.created_at) : new Date();
  const oneYearLater = new Date(accountCreatedAt);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  const msRemaining = oneYearLater.getTime() - Date.now();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

  return { eligible: daysRemaining === 0, accountCreatedAt, daysRemaining };
}

// Trailing 12 months from today, not the calendar year — matches the
// account-age eligibility gate above (always a real, complete year).
export async function getArrStats(agentId: string): Promise<ArrStats> {
  const now = new Date();
  const rangeEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const rangeStart = new Date(rangeEnd);
  rangeStart.setFullYear(rangeStart.getFullYear() - 1);

  const [rangeStats, snapshot] = await Promise.all([
    getRangeStats(agentId, rangeStart, rangeEnd),
    getSnapshotStats(agentId),
  ]);

  return { ...rangeStats, ...snapshot, rangeStart, rangeEnd };
}
