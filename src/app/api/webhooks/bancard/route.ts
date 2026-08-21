import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { buildConfirmToken } from "@/lib/bancard";
import { chargeSubscriptionBancard } from "@/lib/bancardSubscription";
import type { Json } from "@/types/database.types";

type BancardConfirmOperation = {
  token: string;
  shop_process_id: string;
  response: "S" | "N";
  response_details?: string;
  amount: string;
  currency: string;
  authorization_number?: string;
  ticket_number?: string;
  response_code: string;
  response_description?: string;
  extended_response_description?: string;
  security_information?: unknown;
  // UNVERIFIED — card-tokenization confirm payloads are assumed to carry the
  // reusable alias somewhere in this shape; the exact field name needs
  // confirming against Bancard's docs. alias_token is the guess, token_id a
  // fallback in case Bancard names it differently.
  alias_token?: string;
  token_id?: string;
};

// Bancard also pings this URL every 5 minutes with an empty body to monitor uptime —
// always answer 200 so those pings don't get flagged as failures.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const operation: BancardConfirmOperation | undefined = body?.operation;

  if (!operation) {
    return NextResponse.json({ status: "success" });
  }

  const expectedToken = buildConfirmToken(operation.shop_process_id, operation.amount, operation.currency);
  if (expectedToken !== operation.token) {
    // Invalid signature: acknowledge so Bancard doesn't retry, but do not touch the DB.
    return NextResponse.json({ status: "success" });
  }

  const service = createServiceClient();

  const { data: payment } = await service
    .from("payments")
    .select("*, subscriptions(*)")
    .eq("bancard_shop_process_id", operation.shop_process_id)
    .single();

  if (!payment) {
    return NextResponse.json({ status: "success" });
  }

  const approved = operation.response === "S" && operation.response_code === "00";

  await service
    .from("payments")
    .update({
      status: approved ? "approved" : "rejected",
      bancard_transaction_id: operation.ticket_number ?? null,
      raw_response: operation as unknown as Json,
    })
    .eq("id", payment.id);

  const record = payment as unknown as {
    plan: "basico" | "pro" | "fundador" | null;
    bancard_tipo: "checkout" | "recurrente" | "tarjeta" | null;
    subscriptions: { id: string; agent_id: string; status: string; trial_ends_at: string | null };
  };
  const subscription = record.subscriptions;

  // Card-tokenization confirm: store the alias for future recurring
  // charges instead of treating this like a purchase.
  if (record.bancard_tipo === "tarjeta") {
    if (!approved) return NextResponse.json({ status: "success" });

    const aliasToken = operation.alias_token ?? operation.token_id ?? null;
    if (!aliasToken) {
      console.error("[webhooks/bancard] tarjeta confirm sin alias_token/token_id en el payload", operation);
      return NextResponse.json({ status: "success" });
    }

    await service
      .from("agent_profiles")
      .update({ tarjeta_guardada: true, proveedor_tarjeta: "Bancard", bancard_alias_token: aliasToken })
      .eq("id", subscription.agent_id);

    const trialExpired =
      subscription.status === "trialing" &&
      !!subscription.trial_ends_at &&
      new Date(subscription.trial_ends_at) <= new Date();

    if (subscription.status === "past_due" || trialExpired) {
      await chargeSubscriptionBancard(subscription.agent_id);
    }

    return NextResponse.json({ status: "success" });
  }

  if (approved) {
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
  }

  return NextResponse.json({ status: "success" });
}
