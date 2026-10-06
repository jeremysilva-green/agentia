// dLocal Go subscriptions — dLocal bills each plan monthly on its own
// schedule. We read subscriptions and their executions back from the API
// (see syncDlocalGoSubscriptions), rather than relying on webhooks, since
// subscription-execution notifications aren't documented.

const DLOCAL_GO_BASE =
  process.env.DLOCAL_GO_ENV === "production" ? "https://api.dlocalgo.com" : "https://api-sbx.dlocalgo.com";

// Production plan ids and subscribe tokens, from GET /v1/subscription/plan/all.
// Sandbox plans have different ids and would need their own entries here.
export const DLOCAL_GO_PLANS = {
  pro: { planId: 25309, subscribeToken: "yBfmoPAoyHP3SInj2Vz1sQbTYSOJHLr1" },
  fundador: { planId: 25311, subscribeToken: "tIteWr0dYA5URqWwTvmOWnkXNNSzG3VL" },
} as const;

export type DlocalGoPlanId = keyof typeof DLOCAL_GO_PLANS;

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

export function buildSubscribeUrl(plan: DlocalGoPlanId, externalId: string): string {
  const token = DLOCAL_GO_PLANS[plan].subscribeToken;
  const base = process.env.DLOCAL_GO_ENV === "production" ? "https://checkout.dlocalgo.com" : "https://checkout-sbx.dlocalgo.com";
  return `${base}/validate/subscription/${token}?external_id=${encodeURIComponent(externalId)}`;
}

export type DlocalGoSubscription = {
  id: string;
  status: "CREATED" | "CONFIRMED";
  scheduled_date?: string;
};

export type DlocalGoExecution = {
  order_id: string;
  status: "PENDING" | "COMPLETED" | "DECLINED";
  amount_paid: number;
  checkout_currency: string;
  created_at: string;
  updated_at: string;
};

export async function listDlocalGoSubscriptions(planId: number): Promise<DlocalGoSubscription[]> {
  const res = await fetch(`${DLOCAL_GO_BASE}/v1/subscription/plan/${planId}/subscription/all`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`dLocal Go subscription list failed: HTTP ${res.status}`);
  const data = await res.json();
  return data.data ?? data.subscriptions ?? [];
}

export async function listDlocalGoExecutions(planId: number, subscriptionId: string): Promise<DlocalGoExecution[]> {
  const res = await fetch(
    `${DLOCAL_GO_BASE}/v1/subscription/plan/${planId}/subscription/${encodeURIComponent(subscriptionId)}/execution/all`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(`dLocal Go execution list failed: HTTP ${res.status}`);
  const data = await res.json();
  return data.data ?? data.executions ?? [];
}

export async function deactivateDlocalGoSubscription(planId: number, subscriptionId: string): Promise<void> {
  const res = await fetch(
    `${DLOCAL_GO_BASE}/v1/subscription/plan/${planId}/subscription/${encodeURIComponent(subscriptionId)}/deactivate`,
    { method: "PATCH", headers: headers() }
  );
  if (!res.ok) throw new Error(`dLocal Go subscription deactivate failed: HTTP ${res.status}`);
}
