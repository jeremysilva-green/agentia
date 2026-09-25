import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { crearPago } from "@/lib/dlocalGo";
import { PLANS, isPlanId } from "@/lib/plans";
import { getSiteUrl } from "@/lib/siteUrl";

// dLocal Go's first payment doubles as the card-save step (allow_recurring:
// true), unlike Bancard's separate tokenization flow — there's no equivalent
// of /api/checkout/bancard/tarjeta here.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const planId = body?.plan;

  if (!isPlanId(planId)) {
    return NextResponse.json({ error: "Elegí un plan válido" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "agent") {
    return NextResponse.json({ error: "Solo los agentes pueden pagar la suscripción" }, { status: 403 });
  }

  const service = createServiceClient();

  const { data: subscription } = await service
    .from("subscriptions")
    .select("*")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription) {
    return NextResponse.json({ error: "No se encontró la suscripción del agente" }, { status: 404 });
  }

  // Amount always comes from the server-side plan table — never trust a
  // client-supplied price for a payment.
  const plan = PLANS[planId];

  const { data: payment, error: paymentError } = await service
    .from("payments")
    .insert({
      subscription_id: subscription.id,
      dlocal_go_tipo: "checkout",
      amount: plan.price,
      currency: "PYG",
      plan: plan.id,
      status: "initiated",
    })
    .select("id")
    .single();

  if (paymentError || !payment) {
    return NextResponse.json({ error: "No se pudo iniciar el pago" }, { status: 500 });
  }

  const siteUrl = getSiteUrl();

  try {
    const dlocalPayment = await crearPago({
      orderId: payment.id,
      amount: plan.price,
      currency: "PYG",
      description: `Suscripción Agentia — Plan ${plan.name}`,
      notificationUrl: `${siteUrl}/api/webhooks/dlocal-go`,
      successUrl: `${siteUrl}/panel/suscripcion?resultado=retorno`,
      backUrl: `${siteUrl}/panel/suscripcion`,
      allowRecurring: true,
    });

    await service.from("payments").update({ dlocal_go_payment_id: dlocalPayment.id }).eq("id", payment.id);

    return NextResponse.json({ redirectUrl: dlocalPayment.redirect_url });
  } catch {
    await service.from("payments").update({ status: "error" }).eq("id", payment.id);
    return NextResponse.json({ error: "No se pudo conectar con dLocal Go. Intentá de nuevo." }, { status: 502 });
  }
}
