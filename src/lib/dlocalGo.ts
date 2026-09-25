import { createHmac } from "crypto";

// dLocal Go — confirmed against docs.dlocalgo.com (integration-api section).
// Hosted-checkout-redirect model: creating a payment with allow_recurring
// returns a redirect_url (send the browser there) and, once the customer
// pays, a merchant_checkout_token reusable for later recurring charges —
// there's no separate "tokenize a card for $0" step like Bancard's.

const DLOCAL_GO_BASE =
  process.env.DLOCAL_GO_ENV === "production" ? "https://api.dlocalgo.com" : "https://api-sbx.dlocalgo.com";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

function headers() {
  const apiKey = requireEnv("DLOCAL_GO_API_KEY");
  const secretKey = requireEnv("DLOCAL_GO_SECRET_KEY");
  return {
    authorization: `Bearer ${apiKey}:${secretKey}`,
    "Content-Type": "application/json",
  };
}

export interface CrearPagoParams {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  notificationUrl: string;
  successUrl: string;
  backUrl: string;
  allowRecurring?: boolean;
}

interface CrearPagoResponse {
  id: string;
  status: string;
  redirect_url: string;
  merchant_checkout_token?: string;
}

/** Step 1: create a hosted-checkout payment. Send the browser to redirect_url. */
export async function crearPago(params: CrearPagoParams): Promise<CrearPagoResponse> {
  const res = await fetch(`${DLOCAL_GO_BASE}/v1/payments`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      order_id: params.orderId,
      amount: params.amount,
      currency: params.currency,
      description: params.description.slice(0, 100),
      notification_url: params.notificationUrl,
      success_url: params.successUrl,
      back_url: params.backUrl,
      allow_recurring: params.allowRecurring ?? false,
    }),
  });

  if (!res.ok) {
    throw new Error(`dLocal Go POST /v1/payments failed: HTTP ${res.status}`);
  }

  return res.json();
}

export interface CobrarRecurrenteParams {
  merchantCheckoutToken: string;
  amount: number;
  description: string;
  orderId: string;
}

interface CobrarRecurrenteResponse {
  id: string;
  status: string;
  redirect_url?: string;
}

/**
 * Charges a previously-saved card via its merchant_checkout_token — no
 * customer present. Used for monthly renewal charges.
 */
export async function cobrarRecurrente(params: CobrarRecurrenteParams): Promise<CobrarRecurrenteResponse> {
  const res = await fetch(`${DLOCAL_GO_BASE}/v1/payments/recurring/${encodeURIComponent(params.merchantCheckoutToken)}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      amount: params.amount,
      description: params.description.slice(0, 100),
      orderId: params.orderId,
    }),
  });

  if (!res.ok) {
    throw new Error(`dLocal Go POST /v1/payments/recurring failed: HTTP ${res.status}`);
  }

  return res.json();
}

export type DlocalGoStatus = "PENDING" | "PAID" | "REJECTED" | "CANCELLED" | "EXPIRED";

interface ObtenerPagoResponse {
  id: string;
  status: DlocalGoStatus;
  status_detail?: string;
  amount: number;
  currency: string;
  order_id?: string;
  merchant_checkout_token?: string;
}

/**
 * dLocal Go's webhook body only ever carries a payment_id — always re-fetch
 * the real status from here rather than trusting anything else in the
 * notification payload.
 */
export async function obtenerPago(paymentId: string): Promise<ObtenerPagoResponse> {
  const res = await fetch(`${DLOCAL_GO_BASE}/v1/payments/${encodeURIComponent(paymentId)}`, {
    method: "GET",
    headers: headers(),
  });

  if (!res.ok) {
    throw new Error(`dLocal Go GET /v1/payments/:id failed: HTTP ${res.status}`);
  }

  return res.json();
}

/** Maps dLocal Go's status vocabulary onto this app's existing payments.status domain. */
export function mapDlocalGoStatus(status: DlocalGoStatus): "initiated" | "approved" | "rejected" {
  if (status === "PENDING") return "initiated";
  if (status === "PAID") return "approved";
  return "rejected"; // REJECTED | CANCELLED | EXPIRED
}

/**
 * Verifies a webhook's signature. Per docs.dlocalgo.com: the Authorization
 * header arrives as "V2-HMAC-SHA256, Signature: <hex>", and the expected hex
 * digest is HMAC-SHA256(secretKey, apiKey + rawBody) — apiKey and the *raw*
 * JSON body text concatenated with no separator. Must be computed against
 * the raw request body string (caller must use req.text(), not req.json()),
 * since key order/whitespace in a re-serialized object would change the hash.
 */
export function verifyWebhookSignature(rawBody: string, authorizationHeader: string | null): boolean {
  if (!authorizationHeader) return false;
  const match = authorizationHeader.match(/Signature:\s*([0-9a-f]+)/i);
  if (!match) return false;

  const apiKey = requireEnv("DLOCAL_GO_API_KEY");
  const secretKey = requireEnv("DLOCAL_GO_SECRET_KEY");
  const expected = createHmac("sha256", secretKey).update(`${apiKey}${rawBody}`, "utf8").digest("hex");

  return expected === match[1];
}
