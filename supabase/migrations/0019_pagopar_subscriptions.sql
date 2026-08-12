-- Pagopar replaces Bancard as the payment rail for agent subscriptions, and
-- adds a 15-day free trial. This is additive: the bancard_* columns on
-- payments are left untouched (harmless history), and the existing
-- subscriptions/payments/agent_profiles tables are extended rather than
-- duplicated into a parallel schema, so the existing is_active gate,
-- subscriptions_select_own/payments_select_own RLS, and panel/marketplace
-- visibility logic all keep working unchanged.
--
-- Note: the Pagopar `alias_token` (temporary card handle) is intentionally
-- never persisted anywhere in this schema — it expires after 15 minutes, so
-- Edge Functions always fetch it fresh from `listar-tarjeta` immediately
-- before `pagar` / `eliminar-tarjeta`.

alter table public.subscriptions
  drop constraint if exists subscriptions_status_check;

alter table public.subscriptions
  add constraint subscriptions_status_check
  check (status in ('pending', 'trialing', 'active', 'past_due', 'canceled'));

alter table public.subscriptions
  add column trial_ends_at timestamptz,
  add column pagopar_hash_pedido_actual text,
  add column pagopar_numero_pedido_actual text;

create sequence if not exists public.pagopar_identificador_seq start 1000;

alter table public.agent_profiles
  add column pagopar_identificador integer unique
    default nextval('public.pagopar_identificador_seq'),
  add column pagopar_cliente_creado boolean not null default false,
  add column tarjeta_guardada boolean not null default false,
  add column proveedor_tarjeta text check (proveedor_tarjeta in ('Bancard', 'uPay'));

alter table public.payments
  add column pagopar_hash_pedido text,
  add column pagopar_numero_pedido_comercio text,
  add column pagopar_comprobante_interno text,
  add column pagopar_tipo text check (pagopar_tipo in ('checkout', 'recurrente'));
