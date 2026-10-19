import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentLeadPipeline } from "@/lib/data/leads";
import { LeadsTable } from "@/components/panel/LeadsTable";
import { Reveal } from "@/components/panel/theme/Reveal";
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
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[var(--em-2)] uppercase">
          <span className="panel-pulse-dot" />
          Compradores interesados
        </div>
        <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-semibold text-white">{copy.panel.leads}</h1>
      </div>
      <Reveal>
        <LeadsTable rows={rows} agentSlug={agentProfile?.slug ?? ""} />
      </Reveal>
    </div>
  );
}
