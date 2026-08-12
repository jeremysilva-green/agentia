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
