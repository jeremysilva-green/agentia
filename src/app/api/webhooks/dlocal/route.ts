import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getPaymentStatus, supportsRecurring } from "@/lib/dlocal";
import type { Json } from "@/types/database.types";

// Never trust the notification body's status directly for a money-moving
// decision — re-fetch the authoritative status from dLocal via the payment
// id it references. (dLocal also supports verifying the notification via a
// signature per https://docs.dlocal.com/docs/receive-notifications, which
// would be a cheaper additional check — not implemented here since the
// reference doc for this integration didn't include that algorithm.)
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const paymentId: string | undefined = body?.id;
  if (!paymentId) return NextResponse.json({ status: "ok" });

  const authoritative = await getPaymentStatus(paymentId);
  if (!authoritative?.order_id) return NextResponse.json({ status: "ok" });

  const service = createServiceClient();

  const { data: payment } = await service
    .from("payments")
    .select("*, subscriptions(*)")
    .eq("dlocal_order_id", authoritative.order_id)
    .single();
  if (!payment) return NextResponse.json({ status: "ok" });

  const approved = authoritative.status === "PAID";

  await service
    .from("payments")
    .update({
      status: approved ? "approved" : "rejected",
      dlocal_payment_id: authoritative.id,
      raw_response: authoritative as unknown as Json,
    })
    .eq("id", payment.id);

  const record = payment as unknown as {
    dlocal_tipo: "primer_pago" | "recurrente" | null;
    plan: "basico" | "pro" | "fundador" | null;
    subscriptions: { id: string; agent_id: string; status: string };
  };
  const subscription = record.subscriptions;

  // Recurring (MIT) charges are resolved synchronously in
  // chargeSubscriptionDlocal — nothing left to do here beyond recording the
  // authoritative status above.
  if (record.dlocal_tipo === "recurrente") {
    return NextResponse.json({ status: "ok" });
  }

  if (!approved) return NextResponse.json({ status: "ok" });

  await service
    .from("agent_profiles")
    .update({
      tarjeta_guardada: true,
      proveedor_tarjeta: "dLocal",
      dlocal_network_payment_reference: authoritative.card?.network_tx_reference ?? null,
      dlocal_transaction_link_id: authoritative.card?.transaction_link_id ?? null,
      dlocal_card_last4: authoritative.card?.last4 ?? null,
      dlocal_recurring_supported: supportsRecurring(authoritative.card),
    })
    .eq("id", subscription.agent_id);

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

  return NextResponse.json({ status: "ok" });
}
