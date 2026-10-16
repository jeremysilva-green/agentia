export const AGENT_COMMISSION_PCT = 5.5;
export const AFFILIATE_COMMISSION_PCT = 1;
// Modelo de Construcción has no public price, so the referral reward can't
// be a configurable "% of price" like standard listings — it's fixed at
// 0.25% of the real sale price (the construction contract), paid out of the
// agent's own commission. Not agent-configurable; see listingKindFields in
// src/lib/actions/properties.ts, which enforces this server-side too.
export const MODELO_REFERRAL_REWARD_PCT = 0.25;
