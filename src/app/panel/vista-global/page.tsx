import { redirect } from "next/navigation";
import {
  Users,
  Building2,
  MousePointerClick,
  Eye,
  Inbox,
  MessageCircle,
  CalendarClock,
  FileSignature,
  Link2,
  Wallet,
  Star,
  Banknote,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getVistaGlobalStats, getArrEligibility } from "@/lib/data/vistaGlobal";
import { VistaGlobalReportButton } from "@/components/panel/VistaGlobalReportButton";
import { VistaGlobalFunnel } from "@/components/panel/vistaGlobal/VistaGlobalFunnel";
import { VistaGlobalDonut } from "@/components/panel/vistaGlobal/VistaGlobalDonut";
import { AnnualReportCard } from "@/components/panel/vistaGlobal/AnnualReportCard";
import { Reveal } from "@/components/panel/theme/Reveal";
import { CountUp } from "@/components/panel/theme/CountUp";
import { SpotlightCard } from "@/components/panel/theme/SpotlightCard";
import { cn } from "@/lib/cn";
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
  const daysElapsed = Math.max(0, 365 - arrEligibility.daysRemaining);

  const tiles: { label: string; icon: typeof Users; value: number; display: string; sub?: string; highlight?: boolean }[] = [
    { label: copy.panel.statLeads, icon: Users, value: stats.leads, display: stats.leads.toLocaleString("es-PY") },
    {
      label: copy.panel.statTotalProperties,
      icon: Building2,
      value: stats.totalProperties,
      display: stats.totalProperties.toLocaleString("es-PY"),
    },
    {
      label: copy.panel.statPortfolioClicks,
      icon: MousePointerClick,
      value: stats.portfolioClicks,
      display: stats.portfolioClicks.toLocaleString("es-PY"),
      highlight: true,
    },
    {
      label: copy.panel.statPropertyClicks,
      icon: Eye,
      value: stats.propertyClicks,
      display: stats.propertyClicks.toLocaleString("es-PY"),
    },
    {
      label: copy.panel.statSolicitudes,
      icon: Inbox,
      value: solicitudesTotal,
      display: solicitudesTotal.toLocaleString("es-PY"),
      sub: `${stats.solicitudesVendedor} vendedor · ${stats.solicitudesComprador} comprador`,
    },
    {
      label: copy.panel.statConversations,
      icon: MessageCircle,
      value: stats.conversations,
      display: stats.conversations.toLocaleString("es-PY"),
    },
    {
      label: copy.panel.statAgendamientos,
      icon: CalendarClock,
      value: stats.agendamientos,
      display: stats.agendamientos.toLocaleString("es-PY"),
    },
    {
      label: copy.panel.statAcuerdosSigned,
      icon: FileSignature,
      value: stats.acuerdosSigned,
      display: stats.acuerdosSigned.toLocaleString("es-PY"),
    },
    {
      label: copy.panel.statAffiliateClicks,
      icon: Link2,
      value: stats.affiliateLinkClicks,
      display: stats.affiliateLinkClicks.toLocaleString("es-PY"),
    },
    {
      label: copy.panel.statAffiliatesPaid,
      icon: Wallet,
      value: stats.affiliatesPaid,
      display: stats.affiliatesPaid.toLocaleString("es-PY"),
    },
    {
      label: copy.panel.statRatings,
      icon: Star,
      value: stats.ratingsTotal,
      display: stats.ratingsTotal.toLocaleString("es-PY"),
      sub: stats.ratingsTotal > 0 ? `${stats.ratingsAvg.toFixed(1)}★ promedio` : undefined,
    },
    {
      label: copy.panel.statMrr,
      icon: Banknote,
      value: stats.salesPYG,
      display: formatMoney(stats.salesPYG, "PYG"),
      sub: stats.salesUSD > 0 ? formatMoney(stats.salesUSD, "USD") : undefined,
    },
  ];

  const funnelSteps = [
    { label: copy.panel.statPortfolioClicks, value: stats.portfolioClicks },
    { label: copy.panel.statPropertyClicks, value: stats.propertyClicks },
    { label: copy.panel.statLikes, value: stats.likes },
    { label: copy.panel.statConversations, value: stats.conversations },
    { label: copy.panel.statLeads, value: stats.leads },
    { label: copy.panel.statAgendamientos, value: stats.agendamientos },
    { label: "Ventas cerradas", value: stats.salesCount },
  ];

  const donutSegments = [
    { label: "Tu portafolio", value: stats.portfolioClicks },
    { label: "Propiedades", value: stats.propertyClicks },
    { label: "Enlaces de afiliados", value: stats.affiliateLinkClicks },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[var(--em-2)] uppercase">
            <span className="panel-pulse-dot" />
            Métricas del mes
          </div>
          <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-semibold text-white">{copy.panel.vistaGlobal}</h1>
          <p className="mt-2 text-[15px] text-[var(--muted)]">
            {copy.panel.vistaGlobalSubtitle} <b className="text-[#e6e6e6]">{stats.monthLabel.charAt(0).toUpperCase() + stats.monthLabel.slice(1)}.</b>
          </p>
        </div>
        <VistaGlobalReportButton />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tiles.map((tile, i) => (
          <Reveal key={tile.label} delay={(((i % 4) + 1) as 1 | 2 | 3 | 4)}>
            <SpotlightCard
              className={cn(
                "relative flex min-h-[112px] flex-col gap-1 overflow-hidden rounded-[18px] border p-4 transition-transform duration-300 hover:-translate-y-1",
                tile.highlight
                  ? "border-transparent bg-gradient-to-br from-[#0a8f5c] to-[#05492f]"
                  : "border-[var(--line)] bg-[var(--ink-2)] hover:border-[#0a8f5c88]"
              )}
            >
              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className={cn("text-[12.5px]", tile.highlight ? "text-[#dff7ec]" : "text-[var(--muted)]")}>{tile.label}</span>
                <span
                  className={cn(
                    "grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[10px]",
                    tile.highlight ? "bg-white/20 text-white" : "bg-[#13c47f17] text-[var(--em-2)]"
                  )}
                >
                  <tile.icon size={16} />
                </span>
              </div>
              <b className="relative z-10 mt-auto pt-3 font-display text-[26px] leading-none font-semibold text-white">
                {tile.label === copy.panel.statMrr ? tile.display : <CountUp value={tile.value} />}
              </b>
              {tile.sub && <span className={cn("relative z-10 text-[11px]", tile.highlight ? "text-white/70" : "text-[var(--muted)]")}>{tile.sub}</span>}
            </SpotlightCard>
          </Reveal>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <Reveal>
          <div className="rounded-[22px] border border-[var(--line)] bg-[var(--ink-2)] p-6">
            <h2 className="font-display text-xl font-semibold text-white">Embudo del mes</h2>
            <p className="mt-1 text-[13px] text-[var(--muted)]">De los clics a las ventas, con el % que pasa de cada paso al siguiente.</p>
            <div className="mt-5">
              <VistaGlobalFunnel steps={funnelSteps} />
            </div>
          </div>
        </Reveal>

        <Reveal delay={1}>
          <div className="rounded-[22px] border border-[var(--line)] bg-[var(--ink-2)] p-6">
            <h2 className="font-display text-xl font-semibold text-white">Origen de los clics</h2>
            <p className="mt-1 text-[13px] text-[var(--muted)]">Dónde hicieron clic tus visitantes este mes.</p>
            <div className="mt-5">
              <VistaGlobalDonut segments={donutSegments} />
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal>
        <AnnualReportCard daysElapsed={daysElapsed} eligible={arrEligibility.eligible} daysRemaining={arrEligibility.daysRemaining} />
      </Reveal>
    </div>
  );
}
