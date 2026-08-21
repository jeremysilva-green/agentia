-- dLocal recurring-payment support, parallel to the existing Pagopar and
-- direct-Bancard flows (both left untouched, neither pushed live).
--
-- dLocal's model (per docs.dlocal.com, MIT flow): the first payment returns
-- a network reference tied to the card, which is resent on every later
-- charge instead of storing dLocal's own token. transaction_link_id is a
-- Mastercard-only field that becomes mandatory to resend starting
-- 2026-10-23 — stored from day one even though not yet required outbound.
alter table public.agent_profiles
  add column if not exists dlocal_network_payment_reference text,
  add column if not exists dlocal_transaction_link_id text,
  add column if not exists dlocal_card_last4 text;

alter table public.agent_profiles
  drop constraint if exists agent_profiles_proveedor_tarjeta_check;

alter table public.agent_profiles
  add constraint agent_profiles_proveedor_tarjeta_check check (proveedor_tarjeta in ('Bancard', 'uPay', 'dLocal'));

alter table public.payments
  add column if not exists dlocal_payment_id text,
  add column if not exists dlocal_order_id text,
  add column if not exists dlocal_tipo text check (dlocal_tipo in ('primer_pago', 'recurrente'));
