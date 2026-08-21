import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgentProfileForm } from "@/components/panel/AgentProfileForm";
import { copy } from "@/lib/copy";

export default async function AgentProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const [{ data: profile }, { data: agentProfile }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone, avatar_url").eq("id", user.id).single(),
    supabase.from("agent_profiles").select("city, ruc").eq("id", user.id).single(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold text-white">{copy.profile.title}</h1>
        <p className="text-sm text-slate-300">{copy.profile.agentSubtitle}</p>
      </div>
      <AgentProfileForm
        userId={user.id}
        avatarUrl={profile?.avatar_url ?? null}
        fullName={profile?.full_name ?? null}
        phone={profile?.phone ?? null}
        city={agentProfile?.city ?? null}
        ruc={agentProfile?.ruc ?? null}
      />
    </div>
  );
}
