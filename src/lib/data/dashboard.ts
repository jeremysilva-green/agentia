import { createClient } from "@/lib/supabase/server";
import { AGENT_COMMISSION_PCT } from "@/lib/constants/commission";

export type AgentDashboardStats = {
  availableCount: number;
  soldCount: number;
  interactionsCount: number;
  soldThisMonthCount: number;
  totalSalesThisMonthPYG: number;
  totalSalesThisMonthUSD: number;
  netIncomePYG: number;
  netIncomeUSD: number;
  viewsThisMonth: number;
  chatsThisMonth: number;
  leadsThisMonth: number;
  monthStart: Date;
};

export type MonthlyTrendPoint = {
  label: string;
  soldCount: number;
  interactions: number;
  netIncomePYG: number;
};

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// Last `months` calendar months (oldest first) of sold-properties and
// property-view activity, bucketed for the trend charts on the dashboard.
// USD sales are counted toward soldCount but left out of netIncomePYG (can't
// be summed with PYG figures) — a minor simplification for the chart.
export async function getAgentMonthlyTrend(agentId: string, months = 6): Promise<MonthlyTrendPoint[]> {
  const supabase = await createClient();

  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const [{ data: soldRows }, { data: viewRows }] = await Promise.all([
    supabase
      .from("properties")
      .select("sold_at, price, currency")
      .eq("agent_id", agentId)
      .eq("status", "sold")
      .gte("sold_at", rangeStart.toISOString()),
    supabase
      .from("lead_events")
      .select("created_at, properties!inner(agent_id)")
      .eq("properties.agent_id", agentId)
      .eq("event_type", "view")
      .gte("created_at", rangeStart.toISOString()),
  ]);

  const buckets = new Map<string, { soldCount: number; interactions: number; netIncomePYG: number }>();
  const order: string[] = [];

  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    order.push(key);
    buckets.set(key, { soldCount: 0, interactions: 0, netIncomePYG: 0 });
  }

  for (const row of soldRows ?? []) {
    if (!row.sold_at) continue;
    const d = new Date(row.sold_at);
    const bucket = buckets.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (!bucket) continue;
    bucket.soldCount += 1;
    if (row.currency !== "USD") bucket.netIncomePYG += row.price * (AGENT_COMMISSION_PCT / 100);
  }

  for (const row of viewRows ?? []) {
    const d = new Date(row.created_at);
    const bucket = buckets.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (bucket) bucket.interactions += 1;
  }

  return order.map((key) => {
    const monthIndex = Number(key.split("-")[1]);
    return { label: MONTH_LABELS[monthIndex], ...buckets.get(key)! };
  });
}

export async function getAgentDashboardStats(agentId: string): Promise<AgentDashboardStats> {
  const supabase = await createClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStartIso = monthStart.toISOString();

  const [
    { count: availableCount },
    { count: soldCount },
    { count: interactionsCount },
    { data: soldThisMonth },
    { count: viewsThisMonth },
    { count: chatsThisMonth },
    { count: leadsThisMonth },
  ] = await Promise.all([
    supabase.from("properties").select("id", { count: "exact", head: true }).eq("agent_id", agentId).eq("status", "available"),
    supabase.from("properties").select("id", { count: "exact", head: true }).eq("agent_id", agentId).eq("status", "sold"),
    supabase
      .from("lead_events")
      .select("id, properties!inner(agent_id)", { count: "exact", head: true })
      .eq("properties.agent_id", agentId),
    supabase
      .from("properties")
      .select("price, currency")
      .eq("agent_id", agentId)
      .eq("status", "sold")
      .gte("sold_at", monthStartIso),
    supabase
      .from("lead_events")
      .select("id, properties!inner(agent_id)", { count: "exact", head: true })
      .eq("properties.agent_id", agentId)
      .eq("event_type", "view")
      .gte("created_at", monthStartIso),
    supabase
      .from("chat_conversations")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .gte("created_at", monthStartIso),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .gte("created_at", monthStartIso),
  ]);

  let totalSalesThisMonthPYG = 0;
  let totalSalesThisMonthUSD = 0;
  for (const row of soldThisMonth ?? []) {
    if (row.currency === "USD") totalSalesThisMonthUSD += row.price;
    else totalSalesThisMonthPYG += row.price;
  }

  return {
    availableCount: availableCount ?? 0,
    soldCount: soldCount ?? 0,
    interactionsCount: interactionsCount ?? 0,
    soldThisMonthCount: soldThisMonth?.length ?? 0,
    totalSalesThisMonthPYG,
    totalSalesThisMonthUSD,
    netIncomePYG: totalSalesThisMonthPYG * (AGENT_COMMISSION_PCT / 100),
    netIncomeUSD: totalSalesThisMonthUSD * (AGENT_COMMISSION_PCT / 100),
    viewsThisMonth: viewsThisMonth ?? 0,
    chatsThisMonth: chatsThisMonth ?? 0,
    leadsThisMonth: leadsThisMonth ?? 0,
    monthStart,
  };
}
