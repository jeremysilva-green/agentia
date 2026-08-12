"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAgendamientoStatus, type AgendamientoStatus } from "@/lib/constants/agendamientoStatus";

export type AgendamientoActionState = { error?: string } | undefined;

export async function updateAgendamientoStatus(
  agendamientoId: string,
  status: AgendamientoStatus
): Promise<AgendamientoActionState> {
  if (!isAgendamientoStatus(status)) return { error: "Estado inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Volvé a ingresar." };

  const { data: agendamiento } = await supabase
    .from("agendamientos")
    .select("id, agent_id")
    .eq("id", agendamientoId)
    .single();
  if (!agendamiento || agendamiento.agent_id !== user.id) return { error: "No se encontró el agendamiento." };

  const service = createServiceClient();
  const { error } = await service.from("agendamientos").update({ status }).eq("id", agendamientoId);
  if (error) return { error: "No se pudo actualizar el estado." };

  revalidatePath("/panel/agendamientos");
  return undefined;
}
