// Standard-checkout webhook ("URL de respuesta" in the Pagopar panel).
// verify_jwt=false is set for this function in supabase/config.toml since
// Pagopar calls this directly — there is no user session/JWT here.
//
// Real shape confirmed via Pagopar's own "Simular pago del último pedido"
// tool (shows both the exact payload they send and the exact response they
// expect back): the body is `{ respuesta: true, resultado: [ {...} ] }` —
// `resultado` is an ARRAY (matching iniciar-transaccion's response shape),
// not a flat object. The token-verify formula (sha1(privado + hash_pedido))
// was already correct — the bug was purely that the old code read
// `body.resultado?.token` on an array, which is always undefined, so every
// real webhook call silently bailed out before even reaching verification.
// The expected response is the bare `resultado` array, no wrapper.
//
// Also unconfirmed (flagged in the plan): whether `pagar` (recurring debit)
// also fires this same webhook. chargeSubscription() in _shared already
// updates the DB directly from `pagar`'s synchronous response, so this
// webhook is treated as the source of truth for the standard-checkout path
// and a secondary/best-effort path for anything else.
import { createAdminClient, jsonResponse } from "../_shared/supabaseAdmin.ts";
import { buildWebhookVerifyToken } from "../_shared/pagopar.ts";

type WebhookItem = {
  token?: string;
  hash_pedido?: string;
  pagado?: boolean;
  [key: string]: unknown;
};

type WebhookBody = {
  respuesta?: boolean;
  resultado?: WebhookItem[];
};

Deno.serve(async (request: Request) => {
  const body = (await request.json().catch(() => null)) as WebhookBody | null;
  const item = body?.resultado?.[0];

  if (!item?.token || !item?.hash_pedido) {
    console.error("[pagopar-webhook] missing token/hash_pedido in payload", body);
    return jsonResponse(body?.resultado ?? { status: "ignored" });
  }

  const { token, hash_pedido: hashPedido, pagado } = item;

  const expectedToken = await buildWebhookVerifyToken(hashPedido);
  if (expectedToken !== token) {
    console.warn("[pagopar-webhook] token mismatch — possible spoofed call", { hashPedido });
    return jsonResponse(body.resultado); // ack with 200 so Pagopar doesn't retry, but no DB write
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
    return jsonResponse(body.resultado);
  }

  await service
    .from("payments")
    .update({
      status: pagado ? "approved" : "rejected",
      raw_response: item as unknown as never,
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

  return jsonResponse(body.resultado);
});
