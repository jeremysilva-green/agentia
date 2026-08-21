import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getVistaGlobalStats, getArrEligibility } from "@/lib/data/vistaGlobal";
import { VistaGlobalReportButton } from "@/components/panel/VistaGlobalReportButton";
import { ArrReportButton } from "@/components/panel/ArrReportButton";
import { copy } from "@/lib/copy";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("es-PY", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export default async function VistaGlobalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const [stats, arrEligibility] = await Promise.all([
    getVistaGlobalStats(user.id),
    getArrEligibility(user.id),
  ]);

  const solicitudesTotal = stats.solicitudesVendedor + stats.solicitudesComprador;

  const tiles: { label: string; value: string; sub?: string }[] = [
    { label: copy.panel.statLeads, value: stats.leads.toLocaleString("es-PY") },
    { label: copy.panel.statTotalProperties, value: stats.totalProperties.toLocaleString("es-PY") },
    { label: copy.panel.statPortfolioClicks, value: stats.portfolioClicks.toLocaleString("es-PY") },
    { label: copy.panel.statPropertyClicks, value: stats.propertyClicks.toLocaleString("es-PY") },
    {
      label: copy.panel.statSolicitudes,
      value: solicitudesTotal.toLocaleString("es-PY"),
      sub: `${stats.solicitudesVendedor} vendedor · ${stats.solicitudesComprador} comprador`,
    },
    { label: copy.panel.statConversations, value: stats.conversations.toLocaleString("es-PY") },
    { label: copy.panel.statAgendamientos, value: stats.agendamientos.toLocaleString("es-PY") },
    { label: copy.panel.statAcuerdosSigned, value: stats.acuerdosSigned.toLocaleString("es-PY") },
    { label: copy.panel.statAffiliateClicks, value: stats.affiliateLinkClicks.toLocaleString("es-PY") },
    { label: copy.panel.statAffiliatesPaid, value: stats.affiliatesPaid.toLocaleString("es-PY") },
    {
      label: copy.panel.statRatings,
      value: stats.ratingsTotal.toLocaleString("es-PY"),
      sub: stats.ratingsTotal > 0 ? `${stats.ratingsAvg.toFixed(1)}★ promedio` : undefined,
    },
    {
      label: copy.panel.statMrr,
      value: formatMoney(stats.salesPYG, "PYG"),
      sub: stats.salesUSD > 0 ? formatMoney(stats.salesUSD, "USD") : undefined,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">{copy.panel.vistaGlobal}</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {copy.panel.vistaGlobalSubtitle} {stats.monthLabel.charAt(0).toUpperCase() + stats.monthLabel.slice(1)}.
          </p>
        </div>
        <VistaGlobalReportButton />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <p className="text-xs font-medium text-slate-400">{tile.label}</p>
            <p className="font-display mt-1 text-lg font-semibold text-white">{tile.value}</p>
            {tile.sub && <p className="mt-0.5 text-[11px] text-slate-500">{tile.sub}</p>}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">{copy.panel.arrReportTitle}</h2>
            <p className="mt-0.5 text-sm text-slate-400">{copy.panel.arrReportSubtitle}</p>
          </div>
          <ArrReportButton eligible={arrEligibility.eligible} daysRemaining={arrEligibility.daysRemaining} />
        </div>
      </div>
    </div>
  );
}
