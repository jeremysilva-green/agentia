-- SIFEN electronic invoicing (FacturaSend), wired onto the existing
-- Pagopar billing flow. Purely additive — no existing payments/
-- subscriptions/agent_profiles column, constraint, or RLS policy is
-- touched by this file.

-- Fiscal fields needed on a FacturaSend invoice that Agentia doesn't
-- collect today. Cédula is NOT duplicated here — reuse the existing
-- profiles.ci (added in 0047_commission_agreement.sql for the same kind
-- of identity-document purpose).
alter table public.agent_profiles add column if not exists address text;
alter table public.agent_profiles add column if not exists sifen_ciudad_id int;
alter table public.agent_profiles add column if not exists sifen_ciudad_desc text;
alter table public.agent_profiles add column if not exists sifen_distrito_id int;
alter table public.agent_profiles add column if not exists sifen_distrito_desc text;
alter table public.agent_profiles add column if not exists sifen_departamento_id int;
alter table public.agent_profiles add column if not exists sifen_departamento_desc text;

-- One row per Paraguayan city, carrying its full SIFEN department/
-- district/city code lineage, so the profile form only needs a single
-- searchable "Ciudad (facturación)" picker instead of a 3-level cascade.
-- Ships empty — seed from FacturaSend's own
-- consultar-todos-los-departamentos/-distritos/-ciudades endpoints once
-- real API credentials exist (see scripts/seed-sifen-cities.ts).
create table public.sifen_cities (
  id uuid primary key default gen_random_uuid(),
  ciudad_id int not null,
  ciudad_desc text not null,
  distrito_id int not null,
  distrito_desc text not null,
  departamento_id int not null,
  departamento_desc text not null,
  created_at timestamptz not null default now(),
  unique (ciudad_id)
);

alter table public.sifen_cities enable row level security;

-- Public reference data — every authenticated agent needs to read the
-- full list to populate the city picker.
create policy "sifen_cities_select_all" on public.sifen_cities
  for select using (true);

-- Atomic, race-condition-safe invoice number counter, so two invoice
-- creations landing close together never issue the same number.
create table public.invoice_counters (
  id text primary key default 'default',
  next_number integer not null default 1
);

insert into public.invoice_counters (id, next_number)
values ('default', 1)
on conflict (id) do nothing;

create or replace function public.increment_invoice_number()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  result integer;
begin
  update public.invoice_counters
  set next_number = next_number + 1
  where id = 'default'
  returning next_number - 1 into result;

  return result;
end;
$$;

-- One row per invoice attempt, tied 1:1 to the payments row that
-- triggered it (mirrors payments' own existing role as the transaction
-- ledger — this is deliberately not a duplicate "billing_records" ledger).
create table public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null unique references public.payments(id) on delete cascade,
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  agent_id uuid not null references public.agent_profiles(id) on delete cascade,
  invoice_number integer,
  cdc text,
  lote_id text,
  invoice_status text not null default 'pending'
    check (invoice_status in ('pending', 'approved', 'rejected', 'blocked_missing_data', 'error')),
  kude_storage_path text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index billing_invoices_agent_id_idx on public.billing_invoices (agent_id);
create index billing_invoices_status_idx on public.billing_invoices (invoice_status);

create trigger set_updated_at before update on public.billing_invoices
  for each row execute function public.set_updated_at();

alter table public.billing_invoices enable row level security;

-- Ships with a working select policy from day one (the short_links
-- incident — RLS enabled with zero policies silently blocking the
-- owner's own reads — must not repeat). All writes are service-role
-- only, same as payments/subscriptions.
create policy "billing_invoices_select_own" on public.billing_invoices
  for select using (agent_id = auth.uid());

-- KUDE (PDF representation) storage. Public bucket with an unguessable
-- UUID-based path — same convention already used for other sensitive
-- per-agent documents (título/CI/impuesto) in
-- 0033_acuerdo_documentos_bucket.sql, not a new private/signed-URL
-- pattern.
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', true)
on conflict (id) do nothing;

create policy "invoices_bucket_public_read" on storage.objects
  for select using (bucket_id = 'invoices');

-- Notifies the invoicing endpoint whenever a payment flips to approved —
-- catches both existing Pagopar approval paths (pagopar-webhook and
-- _shared/chargeSubscription.ts) from one place, with zero changes to
-- either file, and keeps working automatically if any other payment rail
-- is ever turned back on.
--
-- Two manual one-time steps are required OUTSIDE this migration (never
-- put an actual secret value inside a versioned migration file), mirroring
-- 0020_pagopar_cron.sql:
--   1. Create the shared secret once, from the SQL editor (NOT from a
--      migration): select vault.create_secret('<same value as the
--      INTERNAL_BILLING_SECRET env var>', 'internal_billing_secret');
--   2. Replace <SITE_URL> below with your actual deployed site URL before
--      running this migration.
create extension if not exists pg_net;

create or replace function public.notify_payment_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := '<SITE_URL>/api/internal/invoices/create',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'internal_billing_secret'
      )
    ),
    body := jsonb_build_object('payment_id', new.id)
  );
  return new;
end;
$$;

create trigger payments_notify_approved
  after update of status on public.payments
  for each row
  when (new.status = 'approved' and old.status is distinct from 'approved')
  execute function public.notify_payment_approved();
