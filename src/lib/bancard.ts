import { createHash } from "crypto";

// Bancard vPOS "Compra Simple" v0.3.1 — official integration spec.
// Environments and endpoints per Bancard's developer portal (comercios.bancard.com.py).

const ENVIRONMENT_URL =
  process.env.BANCARD_ENV === "production"
    ? "https://vpos.infonet.com.py"
    : "https://vpos.infonet.com.py:8888";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

/** Bancard requires amounts as strings with exactly 2 decimals, "." separator. */
export function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

function md5(input: string): string {
  return createHash("md5").update(input).digest("hex");
}

export function buildSingleBuyToken(shopProcessId: number, amount: string, currency: string) {
  const privateKey = requireEnv("BANCARD_PRIVATE_KEY");
  return md5(`${privateKey}${shopProcessId}${amount}${currency}`);
}

export function buildConfirmToken(shopProcessId: string, amount: string, currency: string) {
  const privateKey = requireEnv("BANCARD_PRIVATE_KEY");
  return md5(`${privateKey}${shopProcessId}confirm${amount}${currency}`);
}

export function buildRollbackToken(shopProcessId: number) {
  const privateKey = requireEnv("BANCARD_PRIVATE_KEY");
  return md5(`${privateKey}${shopProcessId}rollback0.00`);
}

type SingleBuyParams = {
  shopProcessId: number;
  amount: number;
  currency?: string;
  description: string;
  returnUrl: string;
  cancelUrl?: string;
};

type SingleBuyResponse = { status: "success"; process_id: string } | { status: "error"; messages?: unknown };

export async function createSingleBuy(params: SingleBuyParams): Promise<{ processId: string }> {
  const publicKey = requireEnv("BANCARD_PUBLIC_KEY");
  const currency = params.currency ?? "PYG";
  const amount = formatAmount(params.amount);
  const token = buildSingleBuyToken(params.shopProcessId, amount, currency);

  const response = await fetch(`${ENVIRONMENT_URL}/vpos/api/0.3/single_buy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      public_key: publicKey,
      operation: {
        token,
        shop_process_id: params.shopProcessId,
        amount,
        currency,
        description: params.description.slice(0, 100),
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl ?? params.returnUrl,
      },
    }),
  });

  const data = (await response.json()) as SingleBuyResponse;
  if (data.status !== "success" || !data.process_id) {
    throw new Error("Bancard rechazó la solicitud de pago");
  }

  return { processId: data.process_id };
}

/** Where the browser must be redirected after a successful single_buy call. */
export function buildBancardPaymentUrl(processId: string) {
  return `${ENVIRONMENT_URL}/payment/single_buy?process_id=${encodeURIComponent(processId)}`;
}

// ---------------------------------------------------------------------------
// Card tokenization / recurring charges ("Zimple"-style token purchases).
//
// UNVERIFIED — Bancard's public docs cover "Compra Simple" (single_buy) in
// full, but the token-registration endpoint/field names below are Bancard's
// direct-tokenization product as best understood without access to their
// merchant developer portal (comercios.bancard.com.py) or real credentials.
// Confirm every endpoint path and field name here against Bancard's actual
// docs before taking a real card. The Bancard.Cards.createForm widget itself
// (loaded client-side from bancard-checkout-2.1.0.js) is Bancard's own and
// already proven working in this codebase via the Pagopar-mediated flow —
// only the request that generates the process_id fed into it, and the
// charge-with-token call, are new/unverified here.
// ---------------------------------------------------------------------------

export function buildCardTokenRequestToken(shopProcessId: number) {
  const privateKey = requireEnv("BANCARD_PRIVATE_KEY");
  return md5(`${privateKey}${shopProcessId}new-card`);
}

type CardTokenResponse = { status: "success"; process_id: string } | { status: "error"; messages?: unknown };

/** Requests a process_id to feed into the Bancard.Cards.createForm widget. */
export async function createCardTokenRequest(params: {
  shopProcessId: number;
  returnUrl: string;
}): Promise<{ processId: string }> {
  const publicKey = requireEnv("BANCARD_PUBLIC_KEY");
  const token = buildCardTokenRequestToken(params.shopProcessId);

  const response = await fetch(`${ENVIRONMENT_URL}/vpos/api/0.3/cards/new`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      public_key: publicKey,
      operation: {
        token,
        shop_process_id: params.shopProcessId,
        return_url: params.returnUrl,
      },
    }),
  });

  const data = (await response.json()) as CardTokenResponse;
  if (data.status !== "success" || !data.process_id) {
    throw new Error("Bancard rechazó la solicitud de catastro de tarjeta");
  }

  return { processId: data.process_id };
}

export function buildAliasChargeToken(shopProcessId: number, amount: string, currency: string) {
  const privateKey = requireEnv("BANCARD_PRIVATE_KEY");
  return md5(`${privateKey}${shopProcessId}${amount}${currency}`);
}

type AliasChargeResponse =
  | { status: "success"; confirmation: { response: "S" | "N"; response_code: string; authorization_number?: string; ticket_number?: string } }
  | { status: "error"; messages?: unknown };

/**
 * Charges a previously tokenized card directly (no redirect/hosted form) —
 * used for recurring subscription renewals. UNVERIFIED: assumes single_buy
 * accepts an alias_token in place of driving the user through the hosted
 * payment page, and returns the charge result synchronously rather than via
 * the async confirm webhook used for the first, card-entry purchase.
 */
export async function chargeWithAliasToken(params: {
  shopProcessId: number;
  amount: number;
  currency?: string;
  aliasToken: string;
  description: string;
}): Promise<{ approved: boolean; raw: unknown }> {
  const publicKey = requireEnv("BANCARD_PUBLIC_KEY");
  const currency = params.currency ?? "PYG";
  const amount = formatAmount(params.amount);
  const token = buildAliasChargeToken(params.shopProcessId, amount, currency);

  const response = await fetch(`${ENVIRONMENT_URL}/vpos/api/0.3/single_buy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      public_key: publicKey,
      operation: {
        token,
        shop_process_id: params.shopProcessId,
        amount,
        currency,
        description: params.description.slice(0, 100),
        alias_token: params.aliasToken,
      },
    }),
  });

  const data = (await response.json()) as AliasChargeResponse;
  if (data.status !== "success") {
    return { approved: false, raw: data };
  }

  const approved = data.confirmation.response === "S" && data.confirmation.response_code === "00";
  return { approved, raw: data };
}
