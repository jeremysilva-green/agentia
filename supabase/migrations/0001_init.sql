-- Agently Phase 1 schema

create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('agent','user')),
  username text not null unique,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.agent_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  slug text not null unique,
  bio text,
  city text,
  cover_image_url text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agent_profiles(id) on delete cascade,
  title text not null,
  description text not null,
  listing_type text not null check (listing_type in ('rent','sale')),
  price numeric(12,2) not null,
  currency text not null default 'PYG',
  city text not null,
  address text,
  lat numeric(9,6),
  lng numeric(9,6),
  status text not null default 'available' check (status in ('available','sold','rented','draft')),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_agent_id_idx on public.properties (agent_id);
create index properties_filter_idx on public.properties (city, listing_type, price);
create index properties_visibility_idx on public.properties (published, status);

create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index property_images_property_id_idx on public.property_images (property_id);

create table public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null unique default encode(gen_random_bytes(5), 'hex'),
  created_at timestamptz not null default now(),
  unique (property_id, user_id)
);

create table public.lead_events (
  id uuid primary key default gen_random_uuid(),
  affiliate_link_id uuid references public.affiliate_links(id) on delete set null,
  property_id uuid not null references public.properties(id) on delete cascade,
  event_type text not null check (event_type in ('view','whatsapp_click')),
  visitor_id text,
  created_at timestamptz not null default now()
);

create index lead_events_property_id_idx on public.lead_events (property_id);
create index lead_events_affiliate_link_id_idx on public.lead_events (affiliate_link_id);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agent_profiles(id) on delete cascade,
  status text not null check (status in ('pending','active','past_due','canceled')),
  period_start date,
  period_end date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_agent_id_idx on public.subscriptions (agent_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  bancard_shop_process_id text,
  bancard_transaction_id text,
  amount numeric(10,2) not null,
  currency text not null default 'PYG',
  status text not null check (status in ('initiated','approved','rejected','error')),
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_shop_process_id_idx on public.payments (bancard_shop_process_id);
create index payments_subscription_id_idx on public.payments (subscription_id);

-- updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.agent_profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.properties
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.payments
  for each row execute function public.set_updated_at();
