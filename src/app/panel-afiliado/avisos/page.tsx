import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAffiliateSaleNotifications } from "@/lib/data/affiliateDeals";
import { AffiliateSaleNotices } from "@/components/panel/AffiliateSaleNotices";
import { copy } from "@/lib/copy";

export default async function AffiliateAvisosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const [notices, { data: profile }] = await Promise.all([
    getAffiliateSaleNotifications(user.id),
    supabase.from("profiles").select("username, alias").eq("id", user.id).single(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[var(--em-2)] uppercase">
          <span className="panel-pulse-dot" />
          Ventas de tus referidos
        </div>
        <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-semibold text-white">{copy.affiliatePanel.avisos}</h1>
        <p className="mt-2 text-[15px] text-[var(--muted)]">{copy.affiliatePanel.avisosSubtitle}</p>
      </div>
      <AffiliateSaleNotices
        notices={notices}
        affiliateUsername={profile?.username ?? ""}
        affiliateAlias={profile?.alias ?? null}
      />
    </div>
  );
}
