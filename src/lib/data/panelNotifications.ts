import { createClient } from "@/lib/supabase/server";
import type { PanelSection } from "@/types/domain";

const EPOCH = "1970-01-01T00:00:00.000Z";

// One notification dot per nav section, lit whenever that section has
// activity newer than the agent last viewed it. Each section's "activity"
// signal is scoped to things the agent didn't cause themselves — e.g.
// acuerdos only look at the owner's signature, not the agent's own edits,
// so saving your own part doesn't light up your own dot.
export async function getPanelNotifications(agentId: string): Promise<Record<PanelSection, boolean>> {
  const supabase = await createClient();

  const [{ data: views }, leads, solicitudes, chats, agendamientos, acuerdos] = await Promise.all([
    supabase.from("panel_section_views").select("section, seen_at").eq("agent_id", agentId),
    supabase.from("leads").select("created_at").eq("agent_id", agentId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("client_requests").select("created_at").eq("agent_id", agentId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("chat_conversations").select("updated_at").eq("agent_id", agentId).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("agendamientos").select("created_at").eq("agent_id", agentId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase
      .from("private_agreements")
      .select("owner_signed_at")
      .eq("agent_id", agentId)
      .not("owner_signed_at", "is", null)
      .order("owner_signed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const seenAt = new Map((views ?? []).map((v) => [v.section, v.seen_at]));
  const isNew = (latest: string | null | undefined, section: PanelSection) =>
    Boolean(latest) && latest! > (seenAt.get(section) ?? EPOCH);

  return {
    leads: isNew(leads.data?.created_at, "leads"),
    solicitudes: isNew(solicitudes.data?.created_at, "solicitudes"),
    chats: isNew(chats.data?.updated_at, "chats"),
    agendamientos: isNew(agendamientos.data?.created_at, "agendamientos"),
    acuerdos: isNew(acuerdos.data?.owner_signed_at, "acuerdos"),
  };
}
