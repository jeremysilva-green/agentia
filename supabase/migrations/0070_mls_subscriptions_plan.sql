-- Adds "mls" as a fourth subscribable plan, alongside basico/pro/fundador
-- (0030). Existing rows are untouched — this only widens the constraint.
alter table public.subscriptions drop constraint if exists subscriptions_plan_check;
alter table public.payments drop constraint if exists payments_plan_check;

alter table public.subscriptions
  add constraint subscriptions_plan_check check (plan in ('basico', 'pro', 'fundador', 'mls'));
alter table public.payments
  add constraint payments_plan_check check (plan in ('basico', 'pro', 'fundador', 'mls'));
