import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { obtenerPago, verifyWebhookSignature, mapDlocalGoStatus } from "@/lib/dlocalGo";
import { restoreHiddenPropertiesOnUpgrade } from "@/lib/actions/properties";

// dLocal Go's notification body only ever carries { payment_id }. Always
// re-fetch the real status via obtenerPago() rather than trusting anything
// else in the payload. Retries every 10 minutes for up to 30 days if this
// doesn't return HTTP 200.
export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!verifyWebhookSignature(rawBody, request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const payload = JSON.parse(rawBody) as { payment_id?: string };
  if (!payload.payment_id) {
    return NextResponse.json({ ok: true });
  }

  const service = createServiceClient();

  const { data: payment } = await service
    .from("payments")
    .select("*, subscriptions(*)")
    .eq("dlocal_go_payment_id", payload.payment_id)
    .single();

  if (!payment) {
    return NextResponse.json({ ok: true });
  }

  const dlocalPayment = await obtenerPago(payload.payment_id);
  const status = mapDlocalGoStatus(dlocalPayment.status);

  await service
    .from("payments")
    .update({ status, raw_response: dlocalPayment as never })
    .eq("id", payment.id);

  const record = payment as unknown as {
    plan: "basico" | "pro" | "fundador" | null;
    dlocal_go_tipo: "checkout" | "recurrente" | null;
    subscription_id: string;
    subscriptions: { id: string; agent_id: string };
  };
  const subscription = record.subscriptions;

  if (status !== "approved") {
    if (record.dlocal_go_tipo === "recurrente") {
      await service.from("subscriptions").update({ status: "past_due" }).eq("id", subscription.id);
      await service.from("agent_profiles").update({ is_active: false }).eq("id", subscription.agent_id);
    }
    return NextResponse.json({ ok: true });
  }

  // Approved — checkout (first payment, also saves the card) and recurrente
  // (renewal) both land here and activate the subscription the same way.
  if (record.dlocal_go_tipo === "checkout" && dlocalPayment.merchant_checkout_token) {
    await service
      .from("agent_profiles")
      .update({
        tarjeta_guardada: true,
        proveedor_tarjeta: "dLocalGo",
        dlocal_go_checkout_token: dlocalPayment.merchant_checkout_token,
      })
      .eq("id", subscription.agent_id);
  }

  const periodStart = new Date();
  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 30);

  await service
    .from("subscriptions")
    .update({
      status: "active",
      plan: record.plan,
      period_start: periodStart.toISOString().slice(0, 10),
      period_end: periodEnd.toISOString().slice(0, 10),
    })
    .eq("id", subscription.id);

  await service.from("agent_profiles").update({ is_active: true }).eq("id", subscription.agent_id);

  if (record.plan === "pro" || record.plan === "fundador") {
    await restoreHiddenPropertiesOnUpgrade(subscription.agent_id);
  }

  return NextResponse.json({ ok: true });
}
