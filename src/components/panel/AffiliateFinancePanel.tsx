import type { AffiliateFinanceSummary } from "@/lib/data/affiliateFinance";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("es-PY", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function AffiliateFinancePanel({
  displayName,
  summary,
}: {
  displayName: string;
  summary: AffiliateFinanceSummary;
}) {
  const stats = [
    { label: "Comisión del mes", value: formatMoney(summary.commissionThisMonth, summary.currency) },
    { label: "Pendiente de cobro", value: formatMoney(summary.pendingPayment, summary.currency) },
    { label: "Ventas cerradas", value: String(summary.closedSalesCount) },
    { label: "Clics en tus enlaces", value: String(summary.linkClicks) },
  ];

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 text-white shadow-sm sm:p-6">
      <h2 className="font-display text-lg font-semibold">Panel de {displayName}</h2>
      <p className="mt-0.5 text-sm text-slate-400">Detalle financiero, solo visible para vos</p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
            <p className="text-xs font-medium text-slate-400">{stat.label}</p>
            <p className="font-display mt-1 text-lg font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {summary.deals.length > 0 && (
        <div className="mt-5 divide-y divide-neutral-800 border-t border-neutral-800">
          {summary.deals.map((deal) => (
            <div key={deal.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span className="truncate font-medium text-white">{deal.property_title}</span>
              <div className="flex items-center gap-3 whitespace-nowrap">
                <span className="text-slate-400">{formatMoney(deal.sale_price, deal.currency)}</span>
                <span className="font-medium text-white">{formatMoney(deal.commission_amount, deal.currency)}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    deal.paid ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                  }`}
                >
                  {deal.paid ? "Pagada" : "Pendiente"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
