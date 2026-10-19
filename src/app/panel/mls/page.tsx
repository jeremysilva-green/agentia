import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ShieldAlert, Building2, Lock, ArrowRight, Users, Handshake, Shield } from "lucide-react";
import { getAgentContext } from "@/lib/data/panel";
import { getMlsMembershipStatus } from "@/lib/actions/mlsMembership";
import { hasActiveMlsAccess } from "@/lib/plans";
import { JoinMlsForm } from "@/components/panel/mls/JoinMlsForm";
import { MlsNetworkDiagram } from "@/components/panel/mls/MlsNetworkDiagram";
import { Reveal } from "@/components/panel/theme/Reveal";
import { SpotlightCard } from "@/components/panel/theme/SpotlightCard";
import { PanelLinkButton } from "@/components/panel/theme/PanelButton";
import { copy } from "@/lib/copy";

const FEATURES = [
  { icon: Building2, label: "Compartí propiedades" },
  { icon: Users, label: "Registrá compradores" },
  { icon: Handshake, label: "Cerrá en conjunto" },
  { icon: Shield, label: "Reglas claras" },
];

function MlsHero() {
  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-[28px] border border-[#13c47f33] bg-[radial-gradient(110%_90%_at_90%_0%,#0a8f5c40,transparent_55%),radial-gradient(80%_70%_at_0%_100%,#13c47f14,transparent_60%)] bg-[var(--ink-3)] p-6 sm:p-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#13c47f55] bg-[#13c47f1f] px-3.5 py-2 text-[13px] font-bold text-[var(--em-2)]">
              <Lock size={15} />
              El MLS es parte del Plan MLS
            </span>
            <h2 className="mt-4.5 font-display text-[clamp(28px,3.4vw,44px)] font-semibold text-white">
              Vendé en red con <span className="text-[var(--em-2)]">otras agencias.</span>
            </h2>
            <p className="mt-3.5 max-w-xl text-[16px] text-[#cfd9d4]">
              Red de cooperación entre agentes de distintas agencias: compartí propiedades, registrá compradores y
              cerrá operaciones en conjunto bajo reglas claras.
            </p>
            <div className="mt-6 grid max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm font-semibold text-white transition-colors hover:border-[#13c47f66]"
                >
                  <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[11px] bg-[#13c47f1f] text-[var(--em-2)]">
                    <f.icon size={17} />
                  </span>
                  {f.label}
                </div>
              ))}
            </div>
            <PanelLinkButton href="/panel/suscripcion" className="mt-7">
              Ver Plan MLS <ArrowRight size={18} />
            </PanelLinkButton>
          </div>

          <MlsNetworkDiagram />
        </div>
      </div>
    </Reveal>
  );
}

export default async function MlsPage() {
  const ctx = await getAgentContext();
  if (!ctx) redirect("/ingresar");

  const mlsEligible = hasActiveMlsAccess(ctx.subscription);
  const { membership, currentRuleVersion, needsReaccept } = await getMlsMembershipStatus(ctx.userId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[var(--em-2)] uppercase">
          <span className="panel-pulse-dot" />
          Red de cooperación
        </div>
        <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-semibold text-white">{copy.mls.title}</h1>
      </div>

      {!mlsEligible ? (
        <MlsHero />
      ) : membership?.status === "removed" ? (
        <Reveal>
          <div className="flex items-start gap-3 rounded-[22px] border border-[#ff5a5a44] bg-[#ff5a5a0d] p-6">
            <ShieldAlert className="mt-0.5 shrink-0 text-[#ff8a8a]" size={20} />
            <p className="text-sm text-[#ffb4b4]">
              Tu membresía del MLS fue dada de baja. Si creés que esto es un error, contactanos.
            </p>
          </div>
        </Reveal>
      ) : membership?.status === "active" && !needsReaccept ? (
        <>
          <Reveal>
            <div className="flex items-start gap-3 rounded-[22px] border border-[#13c47f44] bg-[#13c47f12] p-6">
              <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--em-2)]" size={20} />
              <div>
                <p className="text-sm font-semibold text-white">{copy.mls.alreadyMember}</p>
                {membership.activated_at && (
                  <p className="mt-1 text-xs text-[#a9b8b1]">
                    {copy.mls.memberSinceLabel}{" "}
                    {new Date(membership.activated_at).toLocaleDateString("es-PY", { dateStyle: "long" })}
                  </p>
                )}
              </div>
            </div>
          </Reveal>
          <Reveal delay={1}>
            <Link href="/panel/mls/propiedades">
              <SpotlightCard className="flex items-center gap-3.5 rounded-[22px] border border-[var(--line)] bg-[var(--ink-2)] p-6 transition-colors hover:border-[#13c47f88]">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#13c47f44] bg-[#13c47f1f] text-[var(--em-2)]">
                  <Building2 size={20} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Ver propiedades del MLS</p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    Explorá las propiedades activas cargadas por otros miembros.
                  </p>
                </div>
              </SpotlightCard>
            </Link>
          </Reveal>
        </>
      ) : (
        <>
          <MlsHero />
          <Reveal delay={1}>
            <div className="flex flex-col gap-4 rounded-[22px] border border-[var(--line)] bg-[var(--ink-2)] p-6">
              {needsReaccept && (
                <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-sm text-amber-200">
                  {copy.mls.needsReaccept}
                </p>
              )}
              <div>
                <p className="text-sm font-semibold text-white">{copy.mls.joinTitle}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{copy.mls.joinBody}</p>
              </div>
              <JoinMlsForm
                defaultCi={membership?.ci ?? ""}
                defaultAgencyName={membership?.agency_name ?? ""}
                reglamentoBody={currentRuleVersion?.body ?? ""}
                isReaccept={needsReaccept}
              />
            </div>
          </Reveal>
        </>
      )}
    </div>
  );
}
