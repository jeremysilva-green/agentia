import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentSocialSharesForAgent } from "@/lib/data/agentSocialShares";
import { AgentSocialSharesTable } from "@/components/panel/AgentSocialSharesTable";

export default async function RedesSocialesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const rows = await getAgentSocialSharesForAgent(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold text-white">Redes Sociales</h1>
        <p className="text-sm text-slate-300">
          Enlaces cortos e imágenes promocionales que generaste para compartir tus propiedades.
        </p>
      </div>
      <AgentSocialSharesTable rows={rows} />
    </div>
  );
}
