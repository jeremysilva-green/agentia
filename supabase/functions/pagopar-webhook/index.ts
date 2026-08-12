// Standard-checkout webhook ("URL de respuesta" in the Pagopar panel).
// Deploy with `supabase functions deploy pagopar-webhook --no-verify-jwt`
// since Pagopar calls this directly — there is no user session/JWT here.
//
// NOT FULLY CONFIRMED: neither PDF you gave me includes the exact JSON body
// Pagopar posts to the standard-checkout webhook — only that it "notifica el
// resultado del pago" and that the token must be validated as
// sha1(token_privado + hash_pedido). The body-parsing below accepts a few
// plausible shapes (top-level or nested under `resultado`); confirm the real
// shape against an actual Pagopar test webhook call (or their support) and
// adjust the field paths before relying on this in production.
//
// Also unconfirmed (flagged in the plan): whether `pagar` (recurring debit)
// also fires this same webhook. chargeSubscription() in _shared already
// updates the DB directly from `pagar`'s synchronous response, so this
// webhook is treated as the source of truth for the standard-checkout path
// and a secondary/best-effort path for anything else.
import { createAdminClient, jsonResponse } from "../_shared/supabaseAdmin.ts";
import { buildWebhookVerifyToken } from "../_shared/pagopar.ts";

type WebhookBody = {
  token?: string;
  hash_pedido?: string;
  pagado?: boolean;
  resultado?: {
    token?: string;
    hash_pedido?: string;
    pagado?: boolean;
  };
};

Deno.serve(async (request: Request) => {
  const body = (await request.json().catch(() => null)) as WebhookBody | null;
  if (!body) return jsonResponse({ status: "ignored" });

  const token = body.token ?? body.resultado?.token;
  const hashPedido = body.hash_pedido ?? body.resultado?.hash_pedido;
  const pagado = body.pagado ?? body.resultado?.pagado ?? false;

  if (!token || !hashPedido) {
    console.error("[pagopar-webhook] missing token/hash_pedido in payload", body);
    return jsonResponse(body ?? { status: "ignored" });
  }

  const expectedToken = await buildWebhookVerifyToken(hashPedido);
  if (expectedToken !== token) {
    console.warn("[pagopar-webhook] token mismatch — possible spoofed call", { hashPedido });
    return jsonResponse(body); // ack with 200 so Pagopar doesn't retry, but no DB write
  }

  const service = createAdminClient();

  const { data: payment } = await service
    .from("payments")
    .select("*, subscriptions(*)")
    .eq("pagopar_hash_pedido", hashPedido)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!payment) {
    console.warn("[pagopar-webhook] no matching payment for hash_pedido", hashPedido);
    return jsonResponse(body);
  }

  await service
    .from("payments")
    .update({
      status: pagado ? "approved" : "rejected",
      raw_response: body as unknown as never,
    })
    .eq("id", payment.id);

  if (pagado) {
    const subscription = (payment as unknown as { subscriptions: { id: string; agent_id: string } }).subscriptions;
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    await service
      .from("subscriptions")
      .update({
        status: "active",
        period_start: new Date().toISOString().slice(0, 10),
        period_end: periodEnd.toISOString().slice(0, 10),
      })
      .eq("id", subscription.id);

    await service.from("agent_profiles").update({ is_active: true }).eq("id", subscription.agent_id);
  }

  return jsonResponse(body);
});
