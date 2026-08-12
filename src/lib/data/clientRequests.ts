import { createClient } from "@/lib/supabase/server";
import type { ClientRequest } from "@/types/domain";

export async function getAgentClientRequests(
  agentId: string
): Promise<{ vendedor: ClientRequest[]; comprador: ClientRequest[] }> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("client_requests")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  const rows = data ?? [];

  return {
    vendedor: rows.filter((row) => row.kind === "vendedor"),
    comprador: rows.filter((row) => row.kind === "comprador"),
  };
}
