"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { availabilitySchema, type AvailabilityEntryInput } from "@/lib/validations/availability";

export type AvailabilityActionState = { error?: string } | undefined;

export async function saveAvailability(entries: AvailabilityEntryInput[]): Promise<AvailabilityActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a ingresar." };

  const parsed = availabilitySchema.safeParse(entries);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const service = createServiceClient();

  const { error: deleteError } = await service.from("agent_availability").delete().eq("agent_id", user.id);
  if (deleteError) return { error: "No se pudo guardar la disponibilidad." };

  if (parsed.data.length > 0) {
    const { error: insertError } = await service.from("agent_availability").insert(
      parsed.data.map((entry) => ({
        agent_id: user.id,
        day_of_week: entry.day_of_week,
        start_time: entry.start_time,
        end_time: entry.end_time,
      }))
    );
    if (insertError) return { error: "No se pudo guardar la disponibilidad." };
  }

  revalidatePath("/panel/agendamientos");
  return undefined;
}
