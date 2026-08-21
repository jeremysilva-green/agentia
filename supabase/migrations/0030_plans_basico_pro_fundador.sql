-- Rename plans again: independiente/exclusivo -> basico/pro/fundador.
-- Existing paying agents (both old tiers) migrate to "pro" — their next
-- renewal charges the new Pro price automatically, since chargeSubscription
-- reads the price from subscription.plan at charge time. New agents sign up
-- free on "basico" going forward (see signUpAgent).
alter table public.subscriptions drop constraint if exists subscriptions_plan_check;
alter table public.payments drop constraint if exists payments_plan_check;

update public.subscriptions set plan = 'pro' where plan in ('independiente', 'exclusivo');
update public.payments set plan = 'pro' where plan in ('independiente', 'exclusivo');

alter table public.subscriptions
  add constraint subscriptions_plan_check check (plan in ('basico', 'pro', 'fundador'));
alter table public.payments
  add constraint payments_plan_check check (plan in ('basico', 'pro', 'fundador'));
