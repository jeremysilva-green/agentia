import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAffiliateLeads } from "@/lib/data/affiliateDeals";
import { getAffiliateFinanceSummary } from "@/lib/data/affiliateFinance";
import { AffiliateDealsTable } from "@/components/panel/AffiliateDealsTable";
import { AffiliateFinancePanel } from "@/components/panel/AffiliateFinancePanel";
import { copy } from "@/lib/copy";

export default async function AffiliatePanelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const [deals, financeSummary, { data: profile }] = await Promise.all([
    getAffiliateLeads(user.id),
    getAffiliateFinanceSummary(user.id),
    supabase.from("profiles").select("username, full_name, alias").eq("id", user.id).single(),
  ]);

  const displayName = profile?.full_name || profile?.username || "afiliado";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold text-white">{copy.affiliatePanel.title}</h1>
        <p className="text-sm text-slate-300">{copy.affiliatePanel.subtitle}</p>
      </div>
      <AffiliateFinancePanel displayName={displayName} summary={financeSummary} />
      <AffiliateDealsTable
        deals={deals}
        affiliateUsername={profile?.username ?? ""}
        affiliateAlias={profile?.alias ?? null}
      />
    </div>
  );
}
