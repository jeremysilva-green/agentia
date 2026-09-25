-- dLocal Go as the live subscription payment processor, replacing Bancard
-- (never activated — see LAUNCH_CHECKLIST.md §34/§this entry). dLocal Go's
-- model is a reusable merchant_checkout_token issued after the first hosted
-- checkout payment, distinct from the old dlocal_* MIT/network-token columns
-- added in 0041/0042 for a different dLocal product — those are left in
-- place untouched as harmless history, same treatment they got when dLocal
-- was dropped the first time.

alter table public.agent_profiles
  add column if not exists dlocal_go_checkout_token text;

alter table public.agent_profiles
  drop constraint if exists agent_profiles_proveedor_tarjeta_check;

alter table public.agent_profiles
  add constraint agent_profiles_proveedor_tarjeta_check
  check (proveedor_tarjeta in ('Bancard', 'uPay', 'dLocal', 'dLocalGo'));

alter table public.payments
  add column if not exists dlocal_go_payment_id text,
  add column if not exists dlocal_go_tipo text check (dlocal_go_tipo in ('checkout', 'recurrente'));
