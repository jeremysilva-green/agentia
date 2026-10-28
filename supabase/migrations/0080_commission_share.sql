-- Per-listing commission for standard listings. The agent sets their own
-- commission % (commission_agent_pct, already used by Proyecto en Pozo) and the
-- affiliate's reward as a share of THAT commission, not of the sale price:
-- 10% of a 5.5% commission = 0.55% of the price.
alter table public.properties drop constraint if exists properties_referral_reward_type_check;
alter table public.properties
  add constraint properties_referral_reward_type_check
  check (referral_reward_type in ('percentage', 'fixed', 'commission_share'));

-- Existing standard listings move to the new defaults (5.5% commission, 10% of it
-- for the affiliate). Closed deals are untouched: leads keep the commission_pct
-- and commission_amount stored when they were closed.
update public.properties
set commission_agent_pct = 5.5,
    referral_reward_type = 'commission_share',
    referral_reward_value = 10
where listing_kind = 'standard';
