import { createClient } from "@/lib/supabase/server";
import { DAY_OF_WEEK_VALUES } from "@/lib/constants/dayOfWeek";
import type { AgentAvailability } from "@/types/domain";

export async function getAgentAvailability(agentId: string): Promise<AgentAvailability[]> {
  const supabase = await createClient();

  const { data } = await supabase.from("agent_availability").select("*").eq("agent_id", agentId);

  const rows = data ?? [];
  return rows.sort(
    (a, b) => DAY_OF_WEEK_VALUES.indexOf(a.day_of_week) - DAY_OF_WEEK_VALUES.indexOf(b.day_of_week)
  );
}
