-- Pricing tiers are segment-based (independent agent / agency-affiliated agent /
-- developer), not usage-based — see lib/plans.ts for the canonical price list.

alter table public.subscriptions
  add column if not exists plan text check (plan in ('basico', 'pro', 'premium'));

alter table public.payments
  add column if not exists plan text check (plan in ('basico', 'pro', 'premium'));
