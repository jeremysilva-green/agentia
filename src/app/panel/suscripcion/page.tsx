import { redirect } from "next/navigation";
import { ChevronDown, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAgentContext } from "@/lib/data/panel";
import { SubscriptionStatusBadge } from "@/components/panel/SubscriptionStatusBadge";
import { DlocalGoCheckoutButton } from "@/components/panel/DlocalGoCheckoutButton";
import { CancelSubscriptionButton } from "@/components/panel/CancelSubscriptionButton";
import { PricingPlans } from "@/components/panel/PricingPlans";
import { Reveal } from "@/components/panel/theme/Reveal";
import { PLANS, isPlanId, FUNDADOR_SEAT_LIMIT, BASICO_PROPERTY_LIMIT } from "@/lib/plans";
import { copy } from "@/lib/copy";

function daysUntil(isoDate: string) {
  return Math.max(0, Math.ceil((new Date(isoDate).getTime() - Date.now()) / 86_400_000));
}

export default async function SuscripcionPage() {
  const ctx = await getAgentContext();
  if (!ctx) redirect("/ingresar");

  const supabase = await createClient();
  const service = createServiceClient();
  const [{ data: payments }, { count: fundadorCount }, { count: activePropertyCount }] = await Promise.all([
    supabase
      .from("payments")
      .select("*")
      .eq("subscription_id", ctx.subscription?.id ?? "")
      .order("created_at", { ascending: false })
      .limit(10),
    // Sitewide count, so this needs the service client — RLS scopes the
    // request-scoped client's subscription reads to the agent's own row.
    service.from("subscriptions").select("id", { count: "exact", head: true }).eq("plan", "fundador"),
    supabase.from("properties").select("id", { count: "exact", head: true }).eq("agent_id", ctx.userId).eq("status", "available"),
  ]);
  const fundadorSeatsRemaining = Math.max(0, FUNDADOR_SEAT_LIMIT - (fundadorCount ?? 0));

  const status = ctx.subscription?.status;
  const currentPlan = ctx.subscription?.plan && isPlanId(ctx.subscription.plan) ? ctx.subscription.plan : null;
  const cardOnFile = Boolean(ctx.subscription?.dlocal_go_subscription_id);

  const trialDaysLeft = ctx.subscription?.trial_ends_at ? daysUntil(ctx.subscription.trial_ends_at) : null;
  const propertyCount = activePropertyCount ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[var(--em-2)] uppercase">
            <span className="panel-pulse-dot" />
            Tu plan
          </div>
          <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-semibold text-white">{copy.panel.subscription}</h1>
        </div>
        <SubscriptionStatusBadge status={status} />
      </div>

      {status === "trialing" && (
        <Reveal>
          <div className="flex flex-col gap-2 rounded-[22px] border border-[#13c47f44] bg-[#13c47f12] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-white">
                Te quedan {trialDaysLeft} {trialDaysLeft === 1 ? "día" : "días"} de prueba gratis.
              </p>
              <p className="text-xs text-[#a9b8b1]">
                {cardOnFile
                  ? "Ya tenés una tarjeta guardada — te cobraremos automáticamente cuando termine la prueba."
                  : "Elegí un plan abajo para guardar una tarjeta y que la renovación sea automática cuando termine la prueba."}
              </p>
            </div>
          </div>
        </Reveal>
      )}

      {currentPlan && (
        <Reveal>
          <div className="grid gap-6 rounded-[26px] border border-[var(--line)] bg-[radial-gradient(120%_120%_at_100%_0%,#0a8f5c24,transparent_55%)] bg-[var(--ink-2)] p-6 sm:p-8 lg:grid-cols-3">
            <div>
              <p className="text-[12px] font-bold tracking-[0.12em] text-[var(--muted)] uppercase">Plan actual</p>
              <p className="mt-2 flex items-baseline gap-2.5 font-display text-3xl font-semibold text-white">
                {PLANS[currentPlan].name}
                <span className="font-sans text-base font-normal text-[#bdbdbd]">
                  {PLANS[currentPlan].price === 0
                    ? "Gratis"
                    : `${new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(PLANS[currentPlan].price)}/mes`}
                </span>
              </p>
              {ctx.subscription?.period_end && (
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {status === "active" ? "Próximo cobro" : status === "trialing" ? "Fin de la prueba" : "Venció el"}{" "}
                  {new Date(ctx.subscription.period_end).toLocaleDateString("es-PY")}
                </p>
              )}
              {currentPlan !== "basico" && (status === "active" || status === "trialing") && (
                <div className="mt-4 border-t border-white/[0.06] pt-4">
                  <CancelSubscriptionButton />
                </div>
              )}
            </div>

            <div className="border-t border-white/[0.06] pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
              <p className="text-[12px] font-bold tracking-[0.12em] text-[var(--muted)] uppercase">Tarjeta guardada</p>
              <p className="mt-2.5 flex items-center gap-2 text-[15px] font-semibold text-white">
                <CreditCard size={20} className="text-[var(--muted)]" />
                {cardOnFile ? "Sí" : "No"}
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-xs font-medium text-[#cfcfcf]">
                  {cardOnFile ? "dLocal Go" : "Sin tarjeta"}
                </span>
              </p>
            </div>

            <div className="border-t border-white/[0.06] pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
              <p className="text-[12px] font-bold tracking-[0.12em] text-[var(--muted)] uppercase">Uso del plan</p>
              <div className="mt-2.5 flex items-center justify-between text-[14.5px] font-semibold text-white">
                <span>Propiedades activas</span>
                <span className="text-[var(--muted)]">{currentPlan === "basico" ? `${propertyCount} de ${BASICO_PROPERTY_LIMIT}` : propertyCount}</span>
              </div>
              {currentPlan === "basico" && (
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--em)] to-[var(--em-2)] transition-[width] duration-700"
                    style={{ width: `${Math.min(100, (propertyCount / BASICO_PROPERTY_LIMIT) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </Reveal>
      )}

      {(status === "past_due" || status === "pending" || status === "canceled") && (
        <Reveal>
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {status === "pending" ? "Activá tu suscripción" : copy.panel.renewNow}
              </h2>
              <p className="text-sm text-[var(--muted)]">
                Tu portafolio y propiedades ya están guardados — no serán visibles públicamente hasta que el pago se
                confirme.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <DlocalGoCheckoutButton label="Pagar ahora" plan={currentPlan ?? ""} />
            </div>
          </div>
        </Reveal>
      )}

      <Reveal>
        <div className="flex flex-col gap-4">
          <h2 className="text-[13px] font-bold tracking-[0.12em] text-[#cfcfcf] uppercase">Planes</h2>
          <PricingPlans currentPlan={currentPlan} fundadorSeatsRemaining={fundadorSeatsRemaining} />
        </div>
      </Reveal>

      {payments && payments.length > 0 && (
        <Reveal>
          <div className="overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--ink-2)]">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
                <span>
                  Historial de pagos <span className="text-[var(--muted)]">({payments.length})</span>
                </span>
                <ChevronDown size={16} className="shrink-0 text-[var(--muted)] transition-transform group-open:rotate-180" />
              </summary>
              <div className="max-h-72 divide-y divide-white/[0.05] overflow-y-auto border-t border-white/[0.06]">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex flex-col gap-1 px-5 py-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[var(--muted)]">{new Date(payment.created_at).toLocaleDateString("es-PY")}</span>
                      <span className="text-[var(--muted)]">{payment.plan ? PLANS[payment.plan].name : "—"}</span>
                      <span className="text-[#e0e0e0]">
                        {new Intl.NumberFormat("es-PY", { style: "currency", currency: payment.currency }).format(payment.amount)}
                      </span>
                      <span
                        className={
                          payment.status === "approved"
                            ? "font-medium text-[var(--em-2)]"
                            : payment.status === "rejected" || payment.status === "error"
                              ? "font-medium text-[#ff8a8a]"
                              : "font-medium text-amber-400"
                        }
                      >
                        {payment.status === "approved" && "Aprobado"}
                        {payment.status === "rejected" && "Rechazado"}
                        {payment.status === "error" && "Error"}
                        {payment.status === "initiated" && "Pendiente"}
                      </span>
                    </div>
                    {payment.error_message && <p className="text-xs text-amber-400">{payment.error_message}</p>}
                  </div>
                ))}
              </div>
            </details>
          </div>
        </Reveal>
      )}
    </div>
  );
}
