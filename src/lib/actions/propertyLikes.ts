"use server";

import { createServiceClient } from "@/lib/supabase/service";

// Anonymous-visitor like toggle for the marketplace property card's heart
// button, same visitor_id/service-role pattern as rateAgent in
// src/lib/actions/ratings.ts. Fire-and-forget from the client — the UI
// already reflects the toggle optimistically, so this just persists it (and
// feeds the "Embudo del mes" like count on the agent's Vista Global).
export async function toggleLike(propertyId: string, visitorId: string, liked: boolean): Promise<{ error?: string }> {
  if (!visitorId) return { error: "No se pudo identificar tu visita." };

  const service = createServiceClient();

  const { error } = liked
    ? await service.from("property_likes").insert({ property_id: propertyId, visitor_id: visitorId })
    : await service.from("property_likes").delete().eq("property_id", propertyId).eq("visitor_id", visitorId);

  // 23505 = unique violation (agent_ratings' insert path has the same race
  // against a double-click) — the row is already there, which is exactly
  // the end state a "like" click wants, so it isn't a real failure.
  if (error && error.code !== "23505") return { error: "No se pudo guardar." };
  return {};
}
