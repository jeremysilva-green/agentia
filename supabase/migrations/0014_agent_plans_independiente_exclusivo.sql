-- Replace the three segment-based plans (basico/pro/premium) with two
-- agent-chosen tiers picked at registration time — see lib/plans.ts.
-- basico/pro map to independiente, premium maps to exclusivo.
--
-- Constraints are dropped before the data backfill: the old check only
-- allowed basico/pro/premium, so updating rows to the new values while it
-- was still in effect would violate it.

alter table public.subscriptions drop constraint if exists subscriptions_plan_check;
alter table public.payments drop constraint if exists payments_plan_check;

update public.subscriptions set plan = 'independiente' where plan in ('basico', 'pro');
update public.subscriptions set plan = 'exclusivo' where plan = 'premium';

update public.payments set plan = 'independiente' where plan in ('basico', 'pro');
update public.payments set plan = 'exclusivo' where plan = 'premium';

alter table public.subscriptions
  add constraint subscriptions_plan_check check (plan in ('independiente', 'exclusivo'));

alter table public.payments
  add constraint payments_plan_check check (plan in ('independiente', 'exclusivo'));
