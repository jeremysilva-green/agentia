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
    .select("alias, phone, avatar_url, ci, qr_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[var(--em-2)] uppercase">
          <span className="panel-pulse-dot" />
          Tu cuenta
        </div>
        <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-semibold text-white">{copy.profile.title}</h1>
        <p className="mt-2 text-[15px] text-[var(--muted)]">{copy.profile.subtitle}</p>
      </div>
      <AffiliateProfileForm
        userId={user.id}
        avatarUrl={profile?.avatar_url ?? null}
        alias={profile?.alias ?? null}
        phone={profile?.phone ?? null}
        ci={profile?.ci ?? null}
        qrUrl={profile?.qr_url ?? null}
      />
    </div>
  );
}
