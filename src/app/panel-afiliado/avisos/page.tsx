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
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold text-white">{copy.affiliatePanel.avisos}</h1>
        <p className="text-sm text-slate-300">{copy.affiliatePanel.avisosSubtitle}</p>
      </div>
      <AffiliateSaleNotices
        notices={notices}
        affiliateUsername={profile?.username ?? ""}
        affiliateAlias={profile?.alias ?? null}
      />
    </div>
  );
}
