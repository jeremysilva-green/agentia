-- Public lead-capture forms on an agent's portfolio page: Cliente Vendedor
-- (offers a property to list) and Cliente Comprador (describes what they
-- want to buy). Reviewed by the agent in the panel's Solicitudes tab.
-- No client insert/update policy — writes go through the service role only,
-- same convention as subscriptions/payments.

create table public.client_requests (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agent_profiles(id) on delete cascade,
  kind text not null check (kind in ('vendedor', 'comprador')),
  full_name text not null,
  phone text not null,
  property_type text check (
    property_type in (
      'casa', 'departamento', 'terreno', 'duplex', 'triplex',
      'penthouse', 'edificio', 'lote', 'estancia'
    )
  ),
  city text not null,
  description text not null,
  price numeric(12,2),
  price_min numeric(12,2),
  price_max numeric(12,2),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  resulting_property_id uuid references public.properties(id) on delete set null,
  last_reminder_at timestamptz,
  last_report_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index client_requests_agent_id_idx on public.client_requests (agent_id, kind);

create trigger set_updated_at before update on public.client_requests
  for each row execute function public.set_updated_at();

alter table public.client_requests enable row level security;

create policy "client_requests_select_own_agent" on public.client_requests
  for select using (agent_id = auth.uid());

-- Vendor report PDFs bucket, same convention as deal-reports (0007_affiliate_deals.sql)
insert into storage.buckets (id, name, public)
values ('vendor-reports', 'vendor-reports', true)
on conflict (id) do nothing;

create policy "vendor_reports_public_read" on storage.objects
  for select using (bucket_id = 'vendor-reports');
