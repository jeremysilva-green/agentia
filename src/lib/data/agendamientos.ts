import { createClient } from "@/lib/supabase/server";
import type { Agendamiento, AgendamientoRow } from "@/types/domain";

export async function getAgentAgendamientos(agentId: string): Promise<AgendamientoRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("agendamientos")
    .select("*, properties(title)")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  type Row = Agendamiento & { properties: { title: string } | null };
  const rows = (data ?? []) as unknown as Row[];

  return rows.map((row) => {
    const { properties, ...agendamiento } = row;
    return { ...agendamiento, property_title: properties?.title ?? "Propiedad" };
  });
}
