import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AffiliateProfileForm } from "@/components/panel/AffiliateProfileForm";
import { copy } from "@/lib/copy";

export default async function AffiliateProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { data: profile } = await supabase
    .from("profiles")
    .select("alias, phone, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold text-white">{copy.profile.title}</h1>
        <p className="text-sm text-slate-300">{copy.profile.subtitle}</p>
      </div>
      <AffiliateProfileForm
        userId={user.id}
        avatarUrl={profile?.avatar_url ?? null}
        alias={profile?.alias ?? null}
        phone={profile?.phone ?? null}
      />
    </div>
  );
}
