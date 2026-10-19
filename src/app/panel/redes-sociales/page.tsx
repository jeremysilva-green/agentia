import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock, ArrowRight, Crown } from "lucide-react";
import { getAgentSocialSharesForAgent } from "@/lib/data/agentSocialShares";
import { listMarketingVideosForAgent } from "@/lib/data/marketingVideos";
import { AgentSocialSharesTable } from "@/components/panel/AgentSocialSharesTable";
import { MarketingVideosGrid } from "@/components/panel/MarketingVideosGrid";
import { getAgentContext } from "@/lib/data/panel";
import { getSiteUrl } from "@/lib/siteUrl";
import { hasActiveProAccess } from "@/lib/plans";
import { Reveal } from "@/components/panel/theme/Reveal";
import { EmptyState } from "@/components/panel/theme/EmptyState";
import { PanelLinkButton } from "@/components/panel/theme/PanelButton";
import { cn } from "@/lib/cn";

export default async function RedesSocialesPage() {
  const ctx = await getAgentContext();
  if (!ctx) redirect("/ingresar");

  const eligibleForVideo = hasActiveProAccess(ctx.subscription);

  const [rows, videos] = await Promise.all([
    getAgentSocialSharesForAgent(ctx.userId),
    eligibleForVideo ? listMarketingVideosForAgent(ctx.userId) : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[var(--em-2)] uppercase">
            <span className="panel-pulse-dot" />
            Marketing
          </div>
          <h1 className="mt-1 font-display text-[clamp(28px,4vw,40px)] font-semibold text-white">Redes Sociales</h1>
          <p className="text-[15px] text-[var(--muted)]">
            Enlaces cortos e imágenes promocionales que generaste para compartir tus propiedades.
          </p>
        </div>
        <Reveal>
          <AgentSocialSharesTable rows={rows} siteUrl={getSiteUrl()} />
        </Reveal>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-xl font-semibold text-white">Videos promocionales</h2>
          <p className="text-[15px] text-[var(--muted)]">
            Videos de 10 segundos generados desde cada propiedad, listos para compartir en Instagram, TikTok y WhatsApp.
          </p>
        </div>

        {!eligibleForVideo ? (
          <Reveal>
            <div className="relative min-h-[380px] overflow-hidden rounded-[26px] border border-[var(--line)] bg-[var(--ink-2)]">
              <div aria-hidden className="flex items-center justify-center gap-5 p-8 opacity-50 blur-[6px]">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "aspect-[9/16] w-[150px] shrink-0 rounded-[22px] border-[5px] border-[#1d1d1d] bg-gradient-to-b from-[#143425] to-black",
                      i === 1 && "-mt-5 w-[170px]"
                    )}
                  />
                ))}
              </div>
              <div
                className="absolute inset-0 z-10 flex items-center justify-center p-6 text-center"
                style={{ background: "radial-gradient(60% 75% at 50% 50%, #0E0E0Ed9, #0E0E0E80 70%, transparent)" }}
              >
                <div className="max-w-md">
                  <span className="mx-auto flex h-[62px] w-[62px] items-center justify-center rounded-[20px] border border-[#13c47f55] bg-[#13c47f1f] text-[var(--em-2)]">
                    <Lock size={26} />
                  </span>
                  <p className="mt-5 text-[15.5px] text-[#c9c9c9]">
                    Esta función está disponible para los planes <b className="text-white">Pro</b> y{" "}
                    <b className="text-white">Fundador</b>. Mejorá tu plan para empezar a usarla.
                  </p>
                  <div className="mt-3.5 flex justify-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold tracking-wide text-white uppercase">
                      <Crown size={13} className="text-[var(--em-2)]" />
                      Pro
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold tracking-wide text-white uppercase">
                      <Crown size={13} className="text-[var(--em-2)]" />
                      Fundador
                    </span>
                  </div>
                  <PanelLinkButton href="/panel/suscripcion" className="mt-5">
                    Ver planes <ArrowRight size={17} />
                  </PanelLinkButton>
                </div>
              </div>
            </div>
          </Reveal>
        ) : videos.length === 0 ? (
          <Reveal>
            <EmptyState
              message={
                <>
                  Todavía no generaste ningún video. Generá uno desde &quot;Propiedades&quot;, con el botón &quot;Generar
                  video&quot; debajo de cada propiedad.
                </>
              }
              action={
                <Link href="/panel/propiedades" className="text-sm font-semibold text-[var(--em-2)] hover:text-white">
                  Ver mis propiedades
                </Link>
              }
            />
          </Reveal>
        ) : (
          <Reveal>
            <MarketingVideosGrid videos={videos} />
          </Reveal>
        )}
      </div>
    </div>
  );
}
