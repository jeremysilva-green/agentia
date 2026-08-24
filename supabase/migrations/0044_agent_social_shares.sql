-- Short, brandable links an AGENT generates to share their own listing on
-- social media (agentia.com.py/sa/AbC123), with a downloadable promo image
-- reusing the existing /api/property-card/[propertyId] route. Deliberately
-- a separate table from short_links/affiliate_links rather than reusing
-- them: those two are keyed to an affiliate (role "user") referring a
-- listing for commission, and lead/commission attribution logic elsewhere
-- keys off affiliate_link_id specifically. Conflating "agent shares own
-- listing" rows into that table risks an agent's own share accidentally
-- being treated as an affiliate referral. Resolved by its own /sa/[code]
-- route, not /s/[code] — a separate table can't share one global code
-- uniqueness guarantee with short_links.
--
-- Includes its own select policy from the start (short_links initially
-- shipped without one — see 0026_short_links_select_policy.sql — which
-- silently blocked the affiliate's own read of their links for weeks).

create table public.agent_social_shares (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  property_id uuid not null references public.properties(id) on delete cascade,
  agent_id uuid not null references public.profiles(id) on delete cascade,
  click_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (property_id, agent_id)
);

create index agent_social_shares_code_idx on public.agent_social_shares (code);

alter table public.agent_social_shares enable row level security;

create policy "agent_social_shares_select_own" on public.agent_social_shares
  for select using (agent_id = auth.uid());
