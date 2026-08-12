import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentAgendamientos } from "@/lib/data/agendamientos";
import { getAgentAvailability } from "@/lib/data/availability";
import { AgendamientosTable } from "@/components/panel/AgendamientosTable";
import { AvailabilityButton } from "@/components/panel/AvailabilityButton";
import { copy } from "@/lib/copy";

export default async function AgendamientosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const [rows, availability] = await Promise.all([
    getAgentAgendamientos(user.id),
    getAgentAvailability(user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-slate-900">{copy.panel.agendamientos}</h1>
        <AvailabilityButton availability={availability} />
      </div>
      <AgendamientosTable rows={rows} />
    </div>
  );
}
