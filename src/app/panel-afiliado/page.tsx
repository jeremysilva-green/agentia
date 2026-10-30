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
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[var(--em-2)] uppercase">
          <span className="panel-pulse-dot" />
          Panel del afiliado
        </div>
        <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-semibold text-white">{copy.affiliatePanel.title}</h1>
        <p className="mt-2 text-[15px] text-[var(--muted)]">{copy.affiliatePanel.subtitle}</p>
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
