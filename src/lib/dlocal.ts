import { createHmac } from "crypto";

// dLocal "secure_payments" API — recurring card charges (CIT first payment +
// MIT subsequent charges). Field/header shapes below follow the reference
// doc supplied for this integration (docs.dlocal.com, consulted Aug 2026).
//
// UNVERIFIED — the doc didn't specify a sandbox host, only the production
// one (https://api.dlocal.com). DLOCAL_ENV=sandbox below assumes the common
// dLocal convention (sandbox.dlocal.com) — confirm against
// https://docs.dlocal.com/docs/make-a-test-payment before using it.
const API_BASE = process.env.DLOCAL_ENV === "production" ? "https://api.dlocal.com" : "https://sandbox.dlocal.com";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

/** Authorization: V2-HMAC-SHA256, Signature: {signature} — see doc §3. */
function buildSignature(date: string, body: string): string {
  const login = requireEnv("DLOCAL_X_LOGIN");
  const transKey = requireEnv("DLOCAL_X_TRANS_KEY");
  const message = `${login}${date}${body}`;
  return createHmac("sha256", transKey).update(message).digest("hex");
}

async function dlocalRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const login = requireEnv("DLOCAL_X_LOGIN");
  const date = new Date().toISOString();
  const bodyString = JSON.stringify(body);
  const signature = buildSignature(date, bodyString);

  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Date": date,
      "X-Login": login,
      "X-Trans-Key": requireEnv("DLOCAL_X_TRANS_KEY"),
      "X-Version": "2.1",
      "User-Agent": "Agently/1.0",
      Authorization: `V2-HMAC-SHA256, Signature: ${signature}`,
    },
    body: bodyString,
  });

  const data = (await response.json().catch(() => ({}))) as T;
  return data;
}

/**
 * UNVERIFIED — GET /payments/{id} is the conventional dLocal path for
 * re-fetching a payment's authoritative status, used here so the webhook
 * handler never trusts a notification payload's status field directly
 * (confirm against https://docs.dlocal.com/reference before relying on it).
 * Signature message for GET requests uses an empty body string.
 */
export async function getPaymentStatus(paymentId: string): Promise<DlocalPaymentResponse> {
  const login = requireEnv("DLOCAL_X_LOGIN");
  const date = new Date().toISOString();
  const signature = buildSignature(date, "");

  const response = await fetch(`${API_BASE}/payments/${encodeURIComponent(paymentId)}`, {
    method: "GET",
    headers: {
      "X-Date": date,
      "X-Login": login,
      "X-Trans-Key": requireEnv("DLOCAL_X_TRANS_KEY"),
      "X-Version": "2.1",
      "User-Agent": "Agently/1.0",
      Authorization: `V2-HMAC-SHA256, Signature: ${signature}`,
    },
  });

  return (await response.json().catch(() => ({}))) as DlocalPaymentResponse;
}

export type DlocalPayer = {
  name: string;
  email: string;
  document: string;
  phone: string;
};

export type DlocalPaymentResponse = {
  id: string;
  status: "PAID" | "REJECTED" | "PENDING" | "CANCELLED" | string;
  status_detail?: string;
  order_id: string;
  card?: {
    last4?: string;
    network_tx_reference?: string;
    transaction_link_id?: string;
    // UNVERIFIED — brand/type field names weren't in the reference doc's
    // example payload (which only showed last4 + the two network refs).
    // "brand" and "card_type" are a best guess at where dLocal would surface
    // this; confirm against a real sandbox response before relying on it.
    brand?: string;
    card_type?: "CREDIT" | "DEBIT";
  };
};

/**
 * First card payment for a subscription (CIT — customer present). Raw card
 * data (`number`/`cvv`) must come from a PCI-safe capture method (dLocal
 * hosted/tokenized fields or their REDIRECT flow) — see the flag in the
 * checkout route. This function just forwards whatever card payload it's
 * given to dLocal; it doesn't collect or store raw card data itself.
 */
export async function createFirstPayment(params: {
  amount: number;
  currency: string;
  orderId: string;
  payer: DlocalPayer;
  card: {
    holderName: string;
    number: string;
    cvv: string;
    expirationMonth: number;
    expirationYear: number;
  };
  notificationUrl: string;
}): Promise<DlocalPaymentResponse> {
  return dlocalRequest<DlocalPaymentResponse>("/secure_payments", {
    amount: params.amount,
    currency: params.currency,
    country: "PY",
    payment_method_id: "CARD",
    payment_method_flow: "DIRECT",
    payer: {
      name: params.payer.name,
      email: params.payer.email,
      document: params.payer.document,
      phone: params.payer.phone,
    },
    card: {
      holder_name: params.card.holderName,
      number: params.card.number,
      cvv: params.card.cvv,
      expiration_month: params.card.expirationMonth,
      expiration_year: params.card.expirationYear,
      stored_credential_type: "SUBSCRIPTION",
      stored_credential_usage: "FIRST",
    },
    order_id: params.orderId,
    notification_url: params.notificationUrl,
  });
}

/**
 * Recurring charge (MIT — merchant initiated, no card data, no customer
 * present). Uses the network reference saved from the first payment.
 * `transactionLinkId` should be sent when present for Mastercard — becomes
 * mandatory 2026-10-23 per the doc; harmless to send earlier too.
 */
export async function chargeRecurring(params: {
  amount: number;
  currency: string;
  orderId: string;
  payer: DlocalPayer;
  holderName: string;
  networkPaymentReference: string;
  transactionLinkId?: string | null;
  notificationUrl: string;
  isRetry?: boolean;
}): Promise<DlocalPaymentResponse> {
  return dlocalRequest<DlocalPaymentResponse>("/secure_payments", {
    amount: params.amount,
    currency: params.currency,
    country: "PY",
    payment_method_id: "CARD",
    payment_method_flow: "DIRECT",
    payer: {
      name: params.payer.name,
      email: params.payer.email,
      document: params.payer.document,
      phone: params.payer.phone,
    },
    card: {
      holder_name: params.holderName,
      // RESUBMISSION per doc §7 — used for retrying a rejected MIT without
      // re-prompting the customer. SUBSCRIPTION + USED otherwise.
      stored_credential_type: params.isRetry ? "RESUBMISSION" : "SUBSCRIPTION",
      stored_credential_usage: "USED",
      network_payment_reference: params.networkPaymentReference,
      ...(params.transactionLinkId ? { transaction_link_id: params.transactionLinkId } : {}),
    },
    order_id: params.orderId,
    notification_url: params.notificationUrl,
  });
}

/**
 * Per docs.dlocal.com/docs/paraguay's card capabilities table: every card
 * type dLocal supports for Paraguay allows recurring charges EXCEPT Visa
 * Credit. Brand/type detection itself is unverified (see the field comment
 * on DlocalPaymentResponse.card) — when either is missing, this defaults to
 * "supported" rather than silently blocking a card we can't classify.
 */
export function supportsRecurring(card: DlocalPaymentResponse["card"]): boolean {
  if (!card?.brand) return true;
  const isVisa = card.brand.toUpperCase().startsWith("VI");
  const isCredit = card.card_type === "CREDIT";
  return !(isVisa && isCredit);
}
