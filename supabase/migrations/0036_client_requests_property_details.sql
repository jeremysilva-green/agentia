-- Property details collected on the "Cliente Vendedor" form (bedrooms,
-- bathrooms, area, garage, maps link, negotiation terms), so they carry
-- through into the draft property created on approval instead of being
-- re-entered by the agent from scratch.
alter table public.client_requests add column if not exists bedrooms integer;
alter table public.client_requests add column if not exists bathrooms integer;
alter table public.client_requests add column if not exists area_m2 numeric(8, 2);
alter table public.client_requests add column if not exists garage boolean not null default false;
alter table public.client_requests add column if not exists maps_url text;
alter table public.client_requests add column if not exists negotiation_type text[] not null default '{}';
alter table public.client_requests add column if not exists negotiation_details text;
