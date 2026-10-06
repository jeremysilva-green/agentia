-- dLocal Go subscriptions (dLocal bills monthly on its own schedule). We
-- record which dLocal subscription belongs to each of our subscriptions,
-- and reconcile executions into payments rows — those rows drive the
-- existing FacturaSend invoicing trigger.
alter table public.subscriptions
  add column if not exists dlocal_go_subscription_id text unique;
