import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentLeadPipeline } from "@/lib/data/leads";
import { LeadsTable } from "@/components/panel/LeadsTable";
import { copy } from "@/lib/copy";

export default async function LeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const [rows, { data: agentProfile }] = await Promise.all([
    getAgentLeadPipeline(user.id),
    supabase.from("agent_profiles").select("slug").eq("id", user.id).single(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-white">{copy.panel.leads}</h1>
      <LeadsTable rows={rows} agentSlug={agentProfile?.slug ?? ""} />
    </div>
  );
}
