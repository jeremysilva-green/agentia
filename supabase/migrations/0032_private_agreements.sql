-- "Acuerdo Privado" — the private brokerage-authorization document between
-- an agent and a property owner. Either side can originate one:
--   - agent-initiated (from /panel/propiedades): agent fields filled first,
--     client_request_id is null, shared with the owner via share_code.
--   - owner-initiated (from the public "Cliente Vendedor" form): owner +
--     property fields filled first, linked to the resulting client_request.
-- Field-level edit permission (agent vs owner) is enforced in the app layer,
-- not via column-level RLS, since both sides can read the whole row.
create table public.private_agreements (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agent_profiles(id) on delete cascade,
  client_request_id uuid references public.client_requests(id) on delete set null,
  -- Avoids a pgcrypto dependency (gen_random_bytes) — gen_random_uuid() is
  -- built into Postgres core.
  share_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  status text not null default 'pending_owner' check (status in ('pending_owner', 'pending_agent', 'completed')),

  -- Agent-editable fields
  agent_name text,
  agent_ruc text,
  agent_phone text,
  agent_email text,
  agent_address text,
  commission text,
  commission_vat_included boolean,
  commission_payment_timing text check (commission_payment_timing in ('reserva', 'cierre', 'otro')),
  commission_payment_other text,
  reservation_condition text,
  validity_months integer,
  exclusivity text check (exclusivity in ('sin_exclusiva', 'exclusiva')),
  auto_renewal boolean,
  agent_signed_at timestamptz,
  agent_signed_name text,

  -- Owner-editable fields
  owner1_name text,
  owner1_ci text,
  owner2_name text,
  owner2_ci text,
  owner_phone text,
  owner_email text,
  owner_address text,
  property_type text,
  property_city text,
  property_district text,
  property_address text,
  land_area_m2 numeric(10, 2),
  built_area_m2 numeric(10, 2),
  finca_number text,
  padron_number text,
  sale_price numeric(14, 2),
  sale_price_words text,
  doc_title text,
  doc_tax text,
  doc_id text,
  doc_other text,
  allow_sign boolean,
  owner_signed_at timestamptz,
  owner_signed_name text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index private_agreements_agent_id_idx on public.private_agreements(agent_id);
create index private_agreements_client_request_id_idx on public.private_agreements(client_request_id);

create trigger set_updated_at before update on public.private_agreements
  for each row execute function public.set_updated_at();

alter table public.private_agreements enable row level security;

-- The agent manages their own agreements directly (authenticated).
create policy "private_agreements_agent_all" on public.private_agreements
  for all using (agent_id = auth.uid()) with check (agent_id = auth.uid());

-- Owners reach their agreement only via the unguessable share_code, through
-- server actions using the service role — no anon RLS policy needed since
-- all owner-side reads/writes go through server actions.
