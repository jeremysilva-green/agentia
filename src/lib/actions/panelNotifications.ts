"use server";

import { createClient } from "@/lib/supabase/server";
import type { PanelSection } from "@/types/domain";

export async function markSectionSeen(section: PanelSection): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("panel_section_views")
    .upsert({ agent_id: user.id, section, seen_at: new Date().toISOString() }, { onConflict: "agent_id,section" });
}
