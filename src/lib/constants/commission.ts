// Suggested defaults for standard listings. Both are editable per listing:
// the agent sets their own commission %, and the affiliate earns a share of
// that commission (not of the sale price).
export const AGENT_COMMISSION_PCT = 5.5;
export const AGENT_COMMISSION_MAX_PCT = 15;
export const AFFILIATE_SHARE_DEFAULT_PCT = 10;
export const AFFILIATE_SHARE_MAX_PCT = 20;
// Legacy rate (% of the sale price) for rows that predate commission_share.
export const AFFILIATE_COMMISSION_PCT = 1;

export type ListingCommissionInput = {
  commission_agent_pct: number | null;
  commission_agent_type?: "percentage" | "fixed" | null;
  commission_agent_amount?: number | null;
  referral_reward_type: "percentage" | "fixed" | "commission_share" | null;
  referral_reward_value: number | null;
};

/**
 * Agent commission and affiliate reward for a listing at a given sale price.
 * The agent commission is a % of the price or a fixed amount; the affiliate's
 * reward is a share of that commission (commission_share), a % of the price
 * (Modelo / legacy rows), or a fixed amount. Rows with no per-listing values
 * fall back to the legacy 5.5% / 1%-of-price, so older data keeps its meaning.
 * `*PctOfPrice` is the effective rate, so downstream code that stores or shows
 * a "% of the sale" keeps working whichever way the agent configured it.
 */
export function resolveListingCommission(listing: ListingCommissionInput, price: number) {
  const agentFixed = listing.commission_agent_type === "fixed" && listing.commission_agent_amount != null;
  const agentAmount = agentFixed
    ? (listing.commission_agent_amount as number)
    : price * ((listing.commission_agent_pct ?? AGENT_COMMISSION_PCT) / 100);
  const sharePct =
    listing.referral_reward_type === "commission_share"
      ? (listing.referral_reward_value ?? AFFILIATE_SHARE_DEFAULT_PCT)
      : null;
  const affiliateAmount =
    sharePct != null
      ? agentAmount * (sharePct / 100)
      : listing.referral_reward_type === "fixed"
        ? (listing.referral_reward_value ?? 0)
        : price *
          ((listing.referral_reward_type === "percentage"
            ? (listing.referral_reward_value ?? AFFILIATE_COMMISSION_PCT)
            : AFFILIATE_COMMISSION_PCT) /
            100);
  const toPct = (amount: number) => (price > 0 ? Math.round((amount / price) * 10000) / 100 : 0);
  return {
    agentFixed,
    agentAmount,
    agentPctOfPrice: agentFixed ? toPct(agentAmount) : (listing.commission_agent_pct ?? AGENT_COMMISSION_PCT),
    sharePct,
    affiliateAmount,
    affiliatePctOfPrice: toPct(affiliateAmount),
  };
}

// Modelo de Construcción has no public price, so the referral reward can't
// be a configurable "% of price" like standard listings — it's fixed at
// 0.25% of the real sale price (the construction contract), paid out of the
// agent's own commission. Not agent-configurable; see listingKindFields in
// src/lib/actions/properties.ts, which enforces this server-side too.
export const MODELO_REFERRAL_REWARD_PCT = 0.25;
