-- Agency Plan Phase 1: agencies + membership.
--
-- Layered entirely on top of the existing single-agent model — no existing
-- column, constraint, or RLS policy is touched by this file. An agency is
-- an optional grouping; an agent who never joins one behaves exactly as
-- today. Membership roles here are a separate concept from profiles.role
-- (which stays 'agent'|'user' — see 0001_init.sql) and from any future
-- admin role: they only govern access to a *shared* pool of listings.
--
-- Billing is out of scope for Phase 1 (see product plan) — is_active
-- defaults to true so an agency is immediately usable the moment it's
-- created (there is no admin UI yet to flip it on), and exists purely so a
-- later billing phase has a switch to turn off on non-payment.
--
-- Ships with select policies from the start on both tables (see
-- 0026_short_links_select_policy.sql for why this matters — short_links
-- originally shipped with RLS enabled and no select policy, silently
-- blocking the owner's own reads for weeks).

create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  owner_id uuid not null references public.agent_profiles(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index agencies_owner_id_idx on public.agencies (owner_id);

create trigger set_updated_at before update on public.agencies
  for each row execute function public.set_updated_at();

-- Invite/accept flow: unlike private_agreements.share_code (built for an
-- external, unauthenticated party reached via a link) the invitee here is
-- always an existing authenticated in-app agent looked up by username, so
-- a share-code isn't needed — a row is inserted directly with
-- status='invited' and the invitee flips it to 'active'/'declined'
-- themselves from their own panel, the same "gate on an explicit in-app
-- action" shape as terms_accepted_at, just via a status column instead of
-- a timestamp since there are more than two states.
create table public.agency_members (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'manager', 'agent', 'assistant')),
  status text not null default 'invited' check (status in ('invited', 'active', 'removed', 'declined')),
  invited_by uuid references public.profiles(id) on delete set null,
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agency_id, user_id)
);

create index agency_members_agency_id_idx on public.agency_members (agency_id);
create index agency_members_user_id_idx on public.agency_members (user_id);

create trigger set_updated_at before update on public.agency_members
  for each row execute function public.set_updated_at();

alter table public.agencies enable row level security;
alter table public.agency_members enable row level security;

-- Helper functions (security definer, mirroring is_agent_active from
-- 0002_rls_policies.sql) so properties/property_images RLS never has to
-- query agency_members directly and hit its own RLS recursively.

-- Any invited-or-active roster row for this user in this agency (used for
-- "am I on this team at all" — e.g. seeing my own pending invite).
create or replace function public.is_agency_member(check_agency_id uuid, check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.agency_members
    where agency_id = check_agency_id
      and user_id = check_user_id
      and status in ('invited', 'active')
  );
$$;

-- Active membership in a currently-active agency — gates read access to
-- the agency's shared property pool.
create or replace function public.is_active_agency_member(check_agency_id uuid, check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.agency_members m
    join public.agencies a on a.id = m.agency_id
    where m.agency_id = check_agency_id
      and m.user_id = check_user_id
      and m.status = 'active'
      and a.is_active = true
  );
$$;

-- Owner/Admin only — manages the roster (invite, change role, remove).
create or replace function public.is_agency_manager(check_agency_id uuid, check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.agency_members
    where agency_id = check_agency_id
      and user_id = check_user_id
      and status = 'active'
      and role in ('owner', 'admin')
  );
$$;

-- Owner/Admin/Manager — elevated roles that may edit ANY listing in the
-- agency's shared pool, not just their own. Plain 'agent'/'assistant'
-- members only edit their own listings, already covered by the untouched
-- properties_update_own policy (agent_id = auth.uid()). Reserved for a
-- later phase — no Phase 1 action uses this yet, but the DB-level grant
-- is put in place now (see 0049).
create or replace function public.can_edit_agency_properties(check_agency_id uuid, check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.agency_members m
    join public.agencies a on a.id = m.agency_id
    where m.agency_id = check_agency_id
      and m.user_id = check_user_id
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'manager')
      and a.is_active = true
  );
$$;

-- Creates an agency and the caller's own owner membership row atomically —
-- avoids a two-round-trip race between two separate RLS-guarded inserts.
-- Hardcodes auth.uid() as the owner (never accepts a caller-supplied id)
-- so this can't be used to create an agency "as" someone else.
create or replace function public.create_agency(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_agency_id uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.agencies (name, owner_id)
  values (p_name, v_uid)
  returning id into v_agency_id;

  insert into public.agency_members (agency_id, user_id, role, status, joined_at)
  values (v_agency_id, v_uid, 'owner', 'active', now());

  return v_agency_id;
end;
$$;

grant execute on function public.create_agency(text) to authenticated;

-- agencies: any invited-or-active member (including the invitee, before
-- they accept) can see the row; owner can update name (is_active toggling
-- is left reachable at the row level too — self-pausing your own agency is
-- harmless — but no Phase 1 UI exposes it, it's reserved for a future
-- admin/billing flow).
create policy "agencies_select_member" on public.agencies
  for select using (
    owner_id = auth.uid() or public.is_agency_member(id, auth.uid())
  );

create policy "agencies_insert_own" on public.agencies
  for insert with check (owner_id = auth.uid());

create policy "agencies_update_owner" on public.agencies
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- No delete policy: agency deletion is not exposed to clients in Phase 1.

-- agency_members: any invited-or-active teammate can see the full roster
-- (including pending invites) for transparency; a user can always see
-- their own row even if removed/declined.
create policy "agency_members_select_team" on public.agency_members
  for select using (
    user_id = auth.uid() or public.is_agency_member(agency_id, auth.uid())
  );

-- Two ways a row gets created:
--   1. Bootstrap: create_agency() inserts the owner's own active row
--      (runs as security definer, bypasses this policy entirely).
--   2. Invite: an Owner/Admin inserts an 'invited' row for someone else.
--      Ownership can't be granted by invite in Phase 1 and a manager can't
--      insert an already-'active' row for someone else — only the invitee
--      can flip their own row to 'active' (see update policy below).
create policy "agency_members_insert" on public.agency_members
  for insert with check (
    public.is_agency_manager(agency_id, auth.uid())
    and status = 'invited'
    and role in ('admin', 'manager', 'agent', 'assistant')
  );

-- Invitee accepts/declines their own pending row; managers can change role
-- or mark any row 'removed'. Which specific status/role transitions are
-- valid is enforced in the server actions (same app-layer-enforces-field-
-- rules approach as private_agreements — see 0032), not carved further
-- into RLS.
create policy "agency_members_update_self_invited" on public.agency_members
  for update using (user_id = auth.uid() and status = 'invited')
  with check (user_id = auth.uid());

create policy "agency_members_update_manager" on public.agency_members
  for update using (public.is_agency_manager(agency_id, auth.uid()))
  with check (public.is_agency_manager(agency_id, auth.uid()));

-- No delete policy: removal is a status update ('removed'), never a row delete.
