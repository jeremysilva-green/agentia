import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { getAgentSocialSharesForAgent } from "@/lib/data/agentSocialShares";
import { listMarketingVideosForAgent } from "@/lib/data/marketingVideos";
import { AgentSocialSharesTable } from "@/components/panel/AgentSocialSharesTable";
import { MarketingVideosGrid } from "@/components/panel/MarketingVideosGrid";
import { getAgentContext } from "@/lib/data/panel";
import { getSiteUrl } from "@/lib/siteUrl";

export default async function RedesSocialesPage() {
  const ctx = await getAgentContext();
  if (!ctx) redirect("/ingresar");

  const eligibleForVideo = ctx.subscription?.plan === "pro" || ctx.subscription?.plan === "fundador";

  const [rows, videos] = await Promise.all([
    getAgentSocialSharesForAgent(ctx.userId),
    eligibleForVideo ? listMarketingVideosForAgent(ctx.userId) : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-semibold text-white">Redes Sociales</h1>
          <p className="text-sm text-slate-300">
            Enlaces cortos e imágenes promocionales que generaste para compartir tus propiedades.
          </p>
        </div>
        <AgentSocialSharesTable rows={rows} siteUrl={getSiteUrl()} />
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-xl font-semibold text-white">Videos promocionales</h2>
          <p className="text-sm text-slate-300">
            Videos de 10 segundos generados desde cada propiedad, listos para compartir en Instagram, TikTok y WhatsApp.
          </p>
        </div>

        {!eligibleForVideo ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-neutral-700 bg-neutral-950 px-6 py-16 text-center">
            <Lock size={32} className="text-emerald-400" />
            <p className="max-w-sm text-sm text-slate-400">
              Esta función está disponible para los planes Pro y Fundador. Mejorá tu plan para empezar a usarla.
            </p>
            <Link
              href="/panel/suscripcion"
              className="mt-2 inline-flex h-10 items-center justify-center rounded-lg bg-emerald-500 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
            >
              Ver planes
            </Link>
          </div>
        ) : videos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-10 text-center text-sm text-white/50">
            Todavía no generaste ningún video. Generá uno desde &quot;Propiedades&quot;, con el botón &quot;Generar
            video&quot; debajo de cada propiedad.{" "}
            <Link href="/panel/propiedades" className="underline">
              Ver mis propiedades
            </Link>
          </p>
        ) : (
          <MarketingVideosGrid videos={videos} />
        )}
      </div>
    </div>
  );
}
