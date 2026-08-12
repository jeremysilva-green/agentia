import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { buildConfirmToken } from "@/lib/bancard";
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

  if (approved) {
    const record = payment as unknown as {
      plan: "independiente" | "exclusivo" | null;
      subscriptions: { id: string; agent_id: string };
    };
    const subscription = record.subscriptions;

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
