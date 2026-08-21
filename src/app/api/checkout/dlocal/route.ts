import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createFirstPayment, supportsRecurring } from "@/lib/dlocal";
import { PLANS, isPlanId } from "@/lib/plans";

// First (CIT) card payment for a subscription — also registers the card for
// future MIT renewals (dLocal's "SUBSCRIPTION"/"FIRST" stored-credential
// pair, see lib/dlocal.ts).
//
// SECURITY NOTE — this endpoint accepts raw card number/CVV in the request
// body because that's what dLocal's documented DIRECT flow requires. Do NOT
// wire a plain HTML <input> form on the frontend straight to this route:
// that puts raw cardholder data through our own server and expands PCI-DSS
// scope significantly. Use dLocal's hosted/tokenized card fields (or their
// REDIRECT flow) to collect the card details before this endpoint is ever
// called — this route should only ever receive a token/reference from that
// layer, never a literal PAN, once that piece is built.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const planId = body?.plan;
  const card = body?.card;

  if (!isPlanId(planId) || planId === "basico") {
    return NextResponse.json({ error: "Elegí un plan válido" }, { status: 400 });
  }
  if (!card?.number || !card?.cvv || !card?.holderName || !card?.expirationMonth || !card?.expirationYear) {
    return NextResponse.json({ error: "Datos de tarjeta incompletos" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role, full_name, username, phone").eq("id", user.id).single();
  if (profile?.role !== "agent") {
    return NextResponse.json({ error: "Solo los agentes pueden pagar la suscripción" }, { status: 403 });
  }

  const service = createServiceClient();

  const [{ data: subscription }, { data: agentProfile }] = await Promise.all([
    service
      .from("subscriptions")
      .select("*")
      .eq("agent_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    service.from("agent_profiles").select("ruc").eq("id", user.id).single(),
  ]);

  if (!subscription) {
    return NextResponse.json({ error: "No se encontró la suscripción del agente" }, { status: 404 });
  }

  const plan = PLANS[planId];
  const orderId = `chk-${user.id.slice(0, 8)}-${Date.now()}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data: payment, error: paymentError } = await service
    .from("payments")
    .insert({
      subscription_id: subscription.id,
      dlocal_order_id: orderId,
      dlocal_tipo: "primer_pago",
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

  try {
    const result = await createFirstPayment({
      amount: plan.price,
      currency: "PYG",
      orderId,
      payer: {
        name: profile?.full_name || profile?.username || "Agente",
        email: user.email ?? "",
        document: agentProfile?.ruc ?? "",
        phone: profile?.phone ?? "",
      },
      card: {
        holderName: card.holderName,
        number: card.number,
        cvv: card.cvv,
        expirationMonth: card.expirationMonth,
        expirationYear: card.expirationYear,
      },
      notificationUrl: `${siteUrl}/api/webhooks/dlocal`,
    });

    const approved = result.status === "PAID";

    await service
      .from("payments")
      .update({
        status: approved ? "approved" : "rejected",
        dlocal_payment_id: result.id ?? null,
        raw_response: result as unknown as never,
      })
      .eq("id", payment.id);

    if (!approved) {
      return NextResponse.json({ error: result.status_detail ?? "El pago no fue aprobado." }, { status: 402 });
    }

    const recurringSupported = supportsRecurring(result.card);

    await service
      .from("agent_profiles")
      .update({
        tarjeta_guardada: true,
        proveedor_tarjeta: "dLocal",
        dlocal_network_payment_reference: result.card?.network_tx_reference ?? null,
        dlocal_transaction_link_id: result.card?.transaction_link_id ?? null,
        dlocal_card_last4: result.card?.last4 ?? null,
        dlocal_recurring_supported: recurringSupported,
      })
      .eq("id", user.id);

    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    await service
      .from("subscriptions")
      .update({
        status: "active",
        plan: plan.id,
        period_start: new Date().toISOString().slice(0, 10),
        period_end: periodEnd.toISOString().slice(0, 10),
      })
      .eq("id", subscription.id);

    await service.from("agent_profiles").update({ is_active: true }).eq("id", user.id);

    return NextResponse.json({ ok: true, recurringSupported });
  } catch {
    await service.from("payments").update({ status: "error" }).eq("id", payment.id);
    return NextResponse.json({ error: "No se pudo conectar con dLocal. Intentá de nuevo." }, { status: 502 });
  }
}
