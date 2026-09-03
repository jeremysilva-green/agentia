import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { crearDocumento } from "@/lib/billing/facturasend";
import { buildInvoicePayload } from "@/lib/billing/invoiceBuilder";

/**
 * Called by the payments_notify_approved Postgres trigger (see migration
 * 0052_billing_invoices.sql) the moment a payments row flips to
 * status: 'approved' — currently only the Pagopar webhook/charge paths
 * do that, but this route doesn't need to know or care which payment
 * rail triggered it.
 */
function isAuthorizedInternalRequest(req: Request): boolean {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.INTERNAL_BILLING_SECRET}`;
}

export async function POST(req: Request) {
  if (!isAuthorizedInternalRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { payment_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const paymentId = body.payment_id;
  if (!paymentId) {
    return NextResponse.json({ error: "payment_id is required" }, { status: 400 });
  }

  const service = createServiceClient();

  // Idempotent — the trigger could in principle fire more than once for
  // the same payment (e.g. a manual retry), and payment_id is unique on
  // billing_invoices.
  const { data: existing } = await service
    .from("billing_invoices")
    .select("id")
    .eq("payment_id", paymentId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, alreadyExists: true });
  }

  const result = await buildInvoicePayload(paymentId);

  if (!result.ok) {
    console.error(`[invoices/create] blocked for payment ${paymentId}: ${result.reason}`);
    if (result.subscriptionId && result.agentId) {
      await service.from("billing_invoices").insert({
        payment_id: paymentId,
        subscription_id: result.subscriptionId,
        agent_id: result.agentId,
        invoice_status: "blocked_missing_data",
        error_message: result.reason,
      });
    }
    return NextResponse.json({ ok: false, reason: result.reason });
  }

  try {
    const fsResponse = await crearDocumento(result.payload);

    if (fsResponse.success && fsResponse.result?.deList?.[0]) {
      const de = fsResponse.result.deList[0];
      await service.from("billing_invoices").insert({
        payment_id: paymentId,
        subscription_id: result.subscriptionId,
        agent_id: result.agentId,
        invoice_number: result.invoiceNumber,
        cdc: de.cdc,
        lote_id: String(fsResponse.result.loteId),
        invoice_status: "pending", // resolved later by the invoice-status cron
      });
      return NextResponse.json({ ok: true, cdc: de.cdc });
    }

    console.error("[invoices/create] FacturaSend invoice creation failed:", fsResponse.error, fsResponse.errores);
    await service.from("billing_invoices").insert({
      payment_id: paymentId,
      subscription_id: result.subscriptionId,
      agent_id: result.agentId,
      invoice_number: result.invoiceNumber,
      invoice_status: "error",
      error_message: fsResponse.error ?? "FacturaSend returned no document",
    });
    return NextResponse.json({ ok: false, reason: "FacturaSend invoice creation failed" });
  } catch (err) {
    console.error("[invoices/create] FacturaSend call threw:", err);
    await service.from("billing_invoices").insert({
      payment_id: paymentId,
      subscription_id: result.subscriptionId,
      agent_id: result.agentId,
      invoice_number: result.invoiceNumber,
      invoice_status: "error",
      error_message: err instanceof Error ? err.message : "Unknown error",
    });
    return NextResponse.json({ ok: false, reason: "FacturaSend call threw" }, { status: 502 });
  }
}
