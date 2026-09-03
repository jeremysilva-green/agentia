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

  const [{ data: profile }, { data: agentProfile }, { data: sifenCities }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone, avatar_url, ci").eq("id", user.id).single(),
    supabase
      .from("agent_profiles")
      .select("city, ruc, brand_name, logo_url, address, sifen_ciudad_id")
      .eq("id", user.id)
      .single(),
    supabase.from("sifen_cities").select("*").order("ciudad_desc"),
  ]);

  const sifenCityId = sifenCities?.find((c) => c.ciudad_id === agentProfile?.sifen_ciudad_id)?.id ?? null;

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
        brandName={agentProfile?.brand_name ?? null}
        logoUrl={agentProfile?.logo_url ?? null}
        ci={profile?.ci ?? null}
        address={agentProfile?.address ?? null}
        sifenCityId={sifenCityId}
        sifenCities={sifenCities ?? []}
      />
    </div>
  );
}
