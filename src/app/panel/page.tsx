import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, CheckCircle2, Users, Wallet } from "lucide-react";
import { getAgentContext } from "@/lib/data/panel";
import { getAgentDashboardStats, getAgentMonthlyTrend } from "@/lib/data/dashboard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SubscriptionStatusBadge } from "@/components/panel/SubscriptionStatusBadge";
import { AvatarUploader } from "@/components/panel/AvatarUploader";
import { MonthlyReportButton } from "@/components/panel/MonthlyReportButton";
import { AnalyticsCharts } from "@/components/panel/AnalyticsCharts";
import { copy } from "@/lib/copy";

function formatPYG(amount: number) {
  return new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(
    amount
  );
}

export default async function PanelOverviewPage() {
  const ctx = await getAgentContext();
  if (!ctx) redirect("/ingresar");

  const [stats, monthlyTrend] = await Promise.all([
    getAgentDashboardStats(ctx.userId),
    getAgentMonthlyTrend(ctx.userId),
  ]);
  const isActive = ctx.agentProfile?.is_active ?? false;

  const statCards = [
    {
      label: copy.panel.dashboardAvailable,
      value: stats.availableCount.toLocaleString("es-PY"),
      icon: Building2,
      bg: "bg-emerald-100",
      color: "text-emerald-800",
    },
    {
      label: copy.panel.dashboardSold,
      value: stats.soldCount.toLocaleString("es-PY"),
      icon: CheckCircle2,
      bg: "bg-emerald-100",
      color: "text-emerald-800",
    },
    {
      label: copy.panel.dashboardInteractions,
      value: stats.interactionsCount.toLocaleString("es-PY"),
      icon: Users,
      bg: "bg-emerald-100",
      color: "text-emerald-800",
    },
    {
      label: copy.panel.dashboardNetIncome,
      value: formatPYG(stats.netIncomePYG),
      sub: stats.netIncomeUSD > 0 ? `+ USD ${stats.netIncomeUSD.toLocaleString("es-PY")}` : null,
      icon: Wallet,
      bg: "bg-emerald-100",
      color: "text-emerald-800",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-white">{copy.panel.overview}</h1>
        <div className="flex items-center gap-3">
          <SubscriptionStatusBadge status={ctx.subscription?.status} />
          <AvatarUploader userId={ctx.userId} initialAvatarUrl={ctx.avatarUrl} variant="compact" />
        </div>
      </div>

      {!isActive && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            {ctx.subscription?.status === "pending"
              ? "Podés armar tu portafolio libremente. Elegí un plan cuando quieras publicarlo."
              : copy.panel.inactiveBanner}
          </p>
          <Link href="/panel/suscripcion">
            <Button size="sm">{copy.panel.activateAccount}</Button>
          </Link>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Analíticas</h2>
        <MonthlyReportButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="flex flex-col gap-3 border-emerald-100! bg-emerald-50! p-5">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={18} />
            </span>
            <div>
              <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
              {stat.sub && <p className="text-xs font-medium text-slate-500">{stat.sub}</p>}
              <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <AnalyticsCharts data={monthlyTrend} />
    </div>
  );
}
