import { createServiceClient } from "@/lib/supabase/service";
import { FUNDADOR_SEAT_LIMIT } from "@/lib/plans";

// Sitewide count, so it needs the service client — RLS scopes the
// request-scoped client's subscription reads to the agent's own row.
export async function getFundadorSeatsRemaining(): Promise<number> {
  const { count } = await createServiceClient()
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("plan", "fundador");
  return Math.max(0, FUNDADOR_SEAT_LIMIT - (count ?? 0));
}
