import { createClient } from "@/lib/supabase/server";
import type { AgentChatRow, ChatConversation } from "@/types/domain";

export async function getAgentChats(agentId: string): Promise<AgentChatRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("chat_conversations")
    .select("*, properties(title)")
    .eq("agent_id", agentId)
    .order("updated_at", { ascending: false });

  type Row = ChatConversation & { properties: { title: string } | null };
  const rows = (data ?? []) as unknown as Row[];

  return rows.map((row) => {
    const { properties, ...conversation } = row;
    return { ...conversation, property_title: properties?.title ?? "Propiedad" };
  });
}
