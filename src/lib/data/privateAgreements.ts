import { createClient } from "@/lib/supabase/server";
import type { PrivateAgreement } from "@/types/domain";

export async function getAgentPrivateAgreements(agentId: string): Promise<PrivateAgreement[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("private_agreements")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  return data ?? [];
}
