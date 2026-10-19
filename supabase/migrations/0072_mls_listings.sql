-- Plan MLS — Slice 2: listing intake. MLS status is orthogonal to
-- listing_kind (a standard or proyecto_en_pozo listing can also be in the
-- MLS; a listing_kind column extension would be wrong here since a property
-- isn't "MLS" XOR something else) — so this is a new table keyed
-- unique(property_id), the same shape as marketing_videos (0063), not more
-- nullable columns on properties.
--
-- mls_listing_private is kept as its own table (not more columns on
-- mls_listings) even though today it shares the exact same read-access rule
-- as mls_listings — mirrors the original feature spec's own data model,
-- which keeps the "visible on the public page" vs "member-only private
-- detail" surfaces structurally separate.

create table public.mls_listings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null unique references public.properties(id) on delete cascade,
  -- Denormalized from properties.agent_id — ownership of a property never
  -- transfers in this app, and this keeps every RLS policy below a
  -- single-table check instead of a join back to properties.
  agent_id uuid not null references public.agent_profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'removed')),
  authorization_type text not null check (authorization_type in ('exclusiva', 'no_exclusiva')),
  authorization_signed_at date not null,
  -- Nullable: the Reglamento requires the authorization be "vigente," not a
  -- specific expiry date. Slice 6's hygiene cron is what acts on this column
  -- once it exists — this slice only stores it.
  authorization_expires_at date,
  authorization_storage_path text not null,
  cobroke_percent numeric(5,2) not null check (cobroke_percent >= 50 and cobroke_percent <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index mls_listings_agent_id_idx on public.mls_listings (agent_id);
create index mls_listings_active_idx on public.mls_listings (status) where status = 'active';

create trigger set_updated_at before update on public.mls_listings
  for each row execute function public.set_updated_at();

create table public.mls_listing_private (
  id uuid primary key default gen_random_uuid(),
  mls_listing_id uuid not null unique references public.mls_listings(id) on delete cascade,
  owner_min_price numeric(14,2),
  exact_address text,
  showing_instructions text,
  documentation_status text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.mls_listing_private
  for each row execute function public.set_updated_at();

-- "Is this agent currently an active MLS member" — simpler than and
-- independent of agent_has_active_mls_plan (0067), which checks the
-- subscription row directly. Membership status is the correct gate for
-- "can read the MLS pool": it's already kept in sync with plan lapses by
-- deactivateSubscription (src/lib/subscriptions/deactivate.ts), so reading
-- it here avoids this policy needing its own subscriptions-table query.
create or replace function public.is_active_mls_member(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.mls_memberships
    where user_id = p_user_id and status = 'active'
  );
$$;

alter table public.mls_listings enable row level security;
alter table public.mls_listing_private enable row level security;

-- Owner can always see their own row (even if their membership later
-- lapses, so they aren't locked out of their own data); any other active
-- member can see it too, per the spec's "member layer" visibility rule.
create policy "mls_listings_select_member" on public.mls_listings
  for select using (agent_id = auth.uid() or public.is_active_mls_member(auth.uid()));

create policy "mls_listings_insert_own" on public.mls_listings
  for insert with check (agent_id = auth.uid() and public.is_active_mls_member(auth.uid()));

create policy "mls_listings_update_own" on public.mls_listings
  for update using (agent_id = auth.uid()) with check (agent_id = auth.uid());

-- No delete policy — withdrawing from the MLS is a status='removed' update,
-- never a row delete, matching mls_notices/mls_rule_acceptances (0067/0068).

-- mls_listing_private has no owner-vs-member distinction to make: the row
-- only exists if an active member created it, so a flat "active member"
-- check covers the owner too.
create policy "mls_listing_private_select_member" on public.mls_listing_private
  for select using (public.is_active_mls_member(auth.uid()));

create policy "mls_listing_private_insert_own" on public.mls_listing_private
  for insert with check (
    exists (select 1 from public.mls_listings m where m.id = mls_listing_id and m.agent_id = auth.uid())
  );

create policy "mls_listing_private_update_own" on public.mls_listing_private
  for update using (
    exists (select 1 from public.mls_listings m where m.id = mls_listing_id and m.agent_id = auth.uid())
  ) with check (
    exists (select 1 from public.mls_listings m where m.id = mls_listing_id and m.agent_id = auth.uid())
  );
