"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function rateAgent(
  agentId: string,
  agentSlug: string,
  rating: number,
  visitorId: string
): Promise<{ error?: string }> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Calificación inválida" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !visitorId) {
    return { error: "No se pudo identificar tu visita. Recargá la página e intentá de nuevo." };
  }

  const service = createServiceClient();

  const { error } = user
    ? await service
        .from("agent_ratings")
        .upsert({ agent_id: agentId, user_id: user.id, rating }, { onConflict: "agent_id,rater_key" })
    : await service
        .from("agent_ratings")
        .upsert({ agent_id: agentId, visitor_id: visitorId, rating }, { onConflict: "agent_id,rater_key" });

  if (error) return { error: "No se pudo guardar tu calificación. Intentá de nuevo." };

  revalidatePath(`/agentes/${agentSlug}`);
  revalidatePath("/");
  return {};
}
