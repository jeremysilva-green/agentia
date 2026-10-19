import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, CheckCircle2, Users, Wallet, Lock, Pencil, ArrowRight } from "lucide-react";
import { getAgentContext } from "@/lib/data/panel";
import { getAgentDashboardStats, getAgentMonthlyTrend } from "@/lib/data/dashboard";
import { AvatarUploader } from "@/components/panel/AvatarUploader";
import { MonthlyReportButton } from "@/components/panel/MonthlyReportButton";
import { AnalyticsCharts } from "@/components/panel/AnalyticsCharts";
import { Reveal } from "@/components/panel/theme/Reveal";
import { CountUp } from "@/components/panel/theme/CountUp";
import { SpotlightCard } from "@/components/panel/theme/SpotlightCard";
import { PanelLinkButton } from "@/components/panel/theme/PanelButton";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";

export default async function PanelOverviewPage() {
  const ctx = await getAgentContext();
  if (!ctx) redirect("/ingresar");

  const [stats, monthlyTrend] = await Promise.all([
    getAgentDashboardStats(ctx.userId),
    getAgentMonthlyTrend(ctx.userId),
  ]);
  const isActive = ctx.agentProfile?.is_active ?? false;
  const hasAdvancedStats = ctx.subscription?.plan !== "basico";

  const statCards: {
    label: string;
    value: number;
    icon: typeof Building2;
    highlight?: boolean;
    prefix?: string;
    sub?: string | null;
  }[] = [
    { label: copy.panel.dashboardAvailable, value: stats.availableCount, icon: Building2 },
    { label: copy.panel.dashboardSold, value: stats.soldCount, icon: CheckCircle2 },
    { label: copy.panel.dashboardInteractions, value: stats.interactionsCount, icon: Users, highlight: true },
    {
      label: copy.panel.dashboardNetIncome,
      value: Math.round(stats.netIncomePYG),
      icon: Wallet,
      prefix: "Gs. ",
      sub: stats.netIncomeUSD > 0 ? `+ USD ${stats.netIncomeUSD.toLocaleString("es-PY")}` : null,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[var(--em-2)] uppercase">
            <span className="panel-pulse-dot" />
            Panel del agente
          </div>
          <h1 className="mt-2 font-display text-[clamp(30px,4vw,44px)] font-semibold text-white">{copy.panel.overview}</h1>
        </div>
        <div className="flex items-start gap-3.5">
          <div className="pt-1 text-right">
            <p className="font-display text-[15px] text-white">{ctx.fullName ?? "Agente"}</p>
            {ctx.agentProfile?.ruc && <p className="text-[12.5px] text-[var(--muted)]">RUC: {ctx.agentProfile.ruc}</p>}
            <Link
              href="/panel/perfil"
              className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--em-2)] hover:text-white"
            >
              <Pencil size={11} />
              {copy.panel.editProfile}
            </Link>
          </div>
          <div className="shrink-0 rounded-2xl p-[3px] ring-1 ring-[var(--em-2)]/40">
            <AvatarUploader userId={ctx.userId} initialAvatarUrl={ctx.avatarUrl} variant="compact" />
          </div>
        </div>
      </div>

      {!isActive && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm text-amber-200">
            {ctx.subscription?.status === "pending"
              ? "Podés armar tu portafolio libremente. Elegí un plan cuando quieras publicarlo."
              : copy.panel.inactiveBanner}
          </p>
          <PanelLinkButton href="/panel/suscripcion">{copy.panel.activateAccount}</PanelLinkButton>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[13px] font-bold tracking-[0.12em] text-[#cfcfcf] uppercase">Analíticas</h2>
        {hasAdvancedStats && <MonthlyReportButton />}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Reveal key={stat.label} delay={((i % 4) + 1) as 1 | 2 | 3 | 4}>
            <SpotlightCard
              className={cn(
                "relative flex min-h-[178px] flex-col overflow-hidden rounded-[22px] border p-5 transition-transform duration-300 hover:-translate-y-1",
                stat.highlight
                  ? "border-transparent bg-gradient-to-br from-[#0a8f5c] to-[#05492f]"
                  : "border-[var(--line)] bg-[var(--ink-2)] hover:border-[#0a8f5c88]"
              )}
            >
              <span
                className={cn(
                  "relative z-10 flex h-[46px] w-[46px] items-center justify-center rounded-2xl",
                  stat.highlight ? "bg-white/20 text-white" : "bg-[#13c47f17] text-[var(--em-2)]"
                )}
              >
                <stat.icon size={22} />
              </span>
              <div className="relative z-10 mt-auto pt-5">
                <p className="font-display text-[clamp(32px,3.4vw,42px)] font-semibold leading-none text-white">
                  <CountUp value={stat.value} prefix={stat.prefix} />
                </p>
                {stat.sub && <p className="mt-1 text-xs font-medium text-white/70">{stat.sub}</p>}
                <p className={cn("mt-2 text-sm", stat.highlight ? "text-[#dff7ec]" : "text-[var(--muted)]")}>{stat.label}</p>
              </div>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>

      {hasAdvancedStats ? (
        <Reveal>
          <AnalyticsCharts data={monthlyTrend} />
        </Reveal>
      ) : (
        <Reveal>
          <div className="relative overflow-hidden rounded-[26px] border border-[var(--line)] bg-[var(--ink-2)]">
            <div aria-hidden className="pointer-events-none grid gap-4 p-5 opacity-45 blur-[5px] lg:grid-cols-3">
              <AnalyticsCharts data={monthlyTrend} />
            </div>
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-b from-transparent via-[var(--ink-2)]/75 to-[var(--ink-2)] p-6 text-center">
              <div className="max-w-md">
                <span className="mx-auto flex h-[62px] w-[62px] items-center justify-center rounded-[20px] border border-[#13c47f55] bg-[#13c47f1f] text-[var(--em-2)]">
                  <Lock size={26} />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold text-white">
                  Las estadísticas avanzadas son parte del <span className="text-[var(--em-2)]">plan Pro</span>
                </h3>
                <p className="mt-2.5 text-[15px] text-[#b9b9b9]">
                  Interacciones, ventas y balance de ingreso mes a mes, más el reporte descargable.
                </p>
                <PanelLinkButton href="/panel/suscripcion" className="mt-5">
                  Ver plan Pro <ArrowRight size={17} />
                </PanelLinkButton>
              </div>
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}
