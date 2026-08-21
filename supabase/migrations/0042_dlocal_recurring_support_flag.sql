-- Per docs.dlocal.com/docs/paraguay's card capabilities table, Visa Credit
-- is the one card type in Paraguay that dLocal does NOT support for
-- recurring (MIT) charges — Visa Debit, Mastercard (credit/debit), and Amex
-- all do. Recorded per-agent at first-payment time (from the card brand/type
-- dLocal returns) so the recurring cron can skip a doomed charge attempt
-- instead of wasting an API call and confusing the agent with a rejection.
-- Null until a first dLocal payment has actually gone through.
alter table public.agent_profiles
  add column if not exists dlocal_recurring_supported boolean;
