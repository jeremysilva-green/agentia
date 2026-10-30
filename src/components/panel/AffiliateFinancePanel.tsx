import { PanelBadge } from "@/components/panel/theme/PanelBadge";
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
    { label: "Comisión del mes", value: formatMoney(summary.commissionThisMonth, summary.currency), highlight: true },
    { label: "Pendiente de cobro", value: formatMoney(summary.pendingPayment, summary.currency) },
    { label: "Ventas cerradas", value: String(summary.closedSalesCount) },
    { label: "Clics en tus enlaces", value: String(summary.linkClicks) },
  ];

  return (
    <div className="rounded-[26px] border border-[var(--line)] bg-[radial-gradient(120%_70%_at_50%_0%,#0a8f5c24,transparent_60%)] bg-[var(--ink-2)] p-5 text-white sm:p-6">
      <h2 className="font-display text-lg font-semibold">Panel de {displayName}</h2>
      <p className="mt-0.5 text-sm text-[var(--muted)]">Detalle financiero, solo visible para vos</p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={
              stat.highlight
                ? "rounded-2xl border border-[#13c47f55] bg-[#13c47f12] p-4"
                : "rounded-2xl border border-white/[0.06] bg-black/30 p-4"
            }
          >
            <p className="text-xs font-medium text-[var(--muted)]">{stat.label}</p>
            <p className="font-display mt-1.5 text-xl font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {summary.deals.length > 0 && (
        <div className="mt-5 divide-y divide-white/[0.06] border-t border-white/[0.06]">
          {summary.deals.map((deal) => (
            <div key={deal.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span className="truncate font-medium text-white">{deal.property_title}</span>
              <div className="flex items-center gap-3 whitespace-nowrap">
                <span className="text-[var(--muted)]">{formatMoney(deal.sale_price, deal.currency)}</span>
                <span className="font-medium text-white">{formatMoney(deal.commission_amount, deal.currency)}</span>
                <PanelBadge tone={deal.paid ? "emerald" : "amber"}>{deal.paid ? "Pagada" : "Pendiente"}</PanelBadge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
