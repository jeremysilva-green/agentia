-- One shareable "digital storefront" link per (affiliate, agent) pair,
-- listing every one of that agent's published properties at once instead
-- of the affiliate sending one short_links code per property. Mirrors
-- agent_social_shares' shape and its own lesson learned the hard way
-- (see 0026_short_links_select_policy.sql) by including the select-own
-- policy from the start.
--
-- agent_id references profiles(id), not agent_profiles(id) — matches
-- agent_social_shares.agent_id's precedent. agent_profiles.id and
-- profiles.id are the same uuid (agent_profiles extends profiles 1:1),
-- so either FK target is valid; this just follows the existing convention.

create table public.affiliate_catalogs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  agent_id uuid not null references public.profiles(id) on delete cascade,
  click_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, agent_id)
);

create index affiliate_catalogs_code_idx on public.affiliate_catalogs (code);

alter table public.affiliate_catalogs enable row level security;

create policy "affiliate_catalogs_select_own" on public.affiliate_catalogs
  for select using (user_id = auth.uid());
