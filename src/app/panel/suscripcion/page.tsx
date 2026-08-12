import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAgentContext } from "@/lib/data/panel";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SubscriptionStatusBadge } from "@/components/panel/SubscriptionStatusBadge";
import { PagoparCheckoutButton } from "@/components/panel/PagoparCheckoutButton";
import { PLANS, isPlanId } from "@/lib/plans";
import { copy } from "@/lib/copy";

function daysUntil(isoDate: string) {
  return Math.max(0, Math.ceil((new Date(isoDate).getTime() - Date.now()) / 86_400_000));
}

export default async function SuscripcionPage() {
  const ctx = await getAgentContext();
  if (!ctx) redirect("/ingresar");

  const supabase = await createClient();
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("subscription_id", ctx.subscription?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(10);

  const status = ctx.subscription?.status;
  const currentPlan = ctx.subscription?.plan && isPlanId(ctx.subscription.plan) ? ctx.subscription.plan : null;
  const cardOnFile = ctx.agentProfile?.tarjeta_guardada ?? false;

  const trialDaysLeft = ctx.subscription?.trial_ends_at ? daysUntil(ctx.subscription.trial_ends_at) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-slate-900">{copy.panel.subscription}</h1>
        <SubscriptionStatusBadge status={status} />
      </div>

      {status === "trialing" && (
        <Card className="flex flex-col gap-3 border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-800">
              Te quedan {trialDaysLeft} {trialDaysLeft === 1 ? "día" : "días"} de prueba gratis.
            </p>
            <p className="text-xs text-emerald-700">
              {cardOnFile
                ? "Ya tenés una tarjeta guardada — te cobraremos automáticamente cuando termine la prueba."
                : "Guardá una tarjeta para que la renovación sea automática cuando termine la prueba."}
            </p>
          </div>
          {!cardOnFile && (
            <Link href="/panel/suscripcion/tarjeta">
              <Button size="sm" variant="secondary">
                <CreditCard size={15} />
                Guardar tarjeta
              </Button>
            </Link>
          )}
        </Card>
      )}

      {currentPlan && (
        <Card className="flex flex-col gap-2 border-emerald-100! bg-emerald-50! p-6 sm:p-8">
          <p className="text-sm text-slate-500">Plan actual</p>
          <p className="text-2xl font-semibold text-slate-900">
            {PLANS[currentPlan].name}
            <span className="ml-2 text-base font-normal text-slate-500">
              {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
                PLANS[currentPlan].price
              )}
              /mes
            </span>
          </p>
          {ctx.subscription?.period_end && (
            <p className="text-sm text-slate-500">
              {status === "active" ? "Próximo cobro" : status === "trialing" ? "Fin de la prueba" : "Venció el"}{" "}
              {new Date(ctx.subscription.period_end).toLocaleDateString("es-PY")}
            </p>
          )}
          <p className="text-sm text-slate-500">
            Tarjeta guardada: <span className="font-medium text-slate-700">{cardOnFile ? "Sí" : "No"}</span>
            {cardOnFile && ctx.agentProfile?.proveedor_tarjeta && ` (${ctx.agentProfile.proveedor_tarjeta})`}
          </p>
        </Card>
      )}

      {(status === "past_due" || status === "pending" || status === "canceled") && (
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {status === "pending" ? "Activá tu suscripción" : copy.panel.renewNow}
            </h2>
            <p className="text-sm text-slate-500">
              Tu portafolio y propiedades ya están guardados — no serán visibles públicamente hasta que el pago se
              confirme.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PagoparCheckoutButton label="Pagar ahora" />
            <Link href="/panel/suscripcion/tarjeta">
              <Button type="button" size="lg" variant="secondary">
                <CreditCard size={16} />
                Guardar tarjeta
              </Button>
            </Link>
          </div>
        </div>
      )}

      {status === "active" && !cardOnFile && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-sky-100! bg-sky-50! p-4">
          <p className="text-sm text-slate-600">Guardá una tarjeta para que tus próximas renovaciones sean automáticas.</p>
          <Link href="/panel/suscripcion/tarjeta">
            <Button size="sm" variant="secondary" className="border-sky-600! bg-sky-600! text-white! hover:bg-sky-700!">
              <CreditCard size={15} />
              Guardar tarjeta
            </Button>
          </Link>
        </Card>
      )}

      {payments && payments.length > 0 && (
        <Card className="overflow-hidden border-emerald-100! bg-emerald-50!">
          <div className="border-b border-emerald-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Historial de pagos</h2>
          </div>
          <div className="divide-y divide-emerald-100">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-slate-500">
                  {new Date(payment.created_at).toLocaleDateString("es-PY")}
                </span>
                <span className="text-slate-500">{payment.plan ? PLANS[payment.plan].name : "—"}</span>
                <span className="text-slate-700">
                  {new Intl.NumberFormat("es-PY", { style: "currency", currency: payment.currency }).format(
                    payment.amount
                  )}
                </span>
                <span
                  className={
                    payment.status === "approved"
                      ? "font-medium text-emerald-600"
                      : payment.status === "rejected" || payment.status === "error"
                        ? "font-medium text-red-600"
                        : "font-medium text-amber-600"
                  }
                >
                  {payment.status === "approved" && "Aprobado"}
                  {payment.status === "rejected" && "Rechazado"}
                  {payment.status === "error" && "Error"}
                  {payment.status === "initiated" && "Pendiente"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
