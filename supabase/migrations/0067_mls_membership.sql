-- Plan MLS — membership layer (slice 1 of the MLS feature: plan tier +
-- membership + Avisos; listing intake/buyer registration/showings/closing/
-- hygiene are later slices and this file doesn't assume any of their tables
-- exist).
--
-- An agent becomes an MLS member automatically once three things are true:
-- Plan MLS is active, a CI is on file, and the current Reglamento version is
-- accepted — no approval queue. mls_rule_versions/mls_rule_acceptances give
-- that acceptance a durable, append-only paper trail (version, timestamp,
-- IP); mls_memberships is the resulting membership row.
--
-- agent_id-style foreign keys here point at agent_profiles(id), matching
-- panel_section_views (0034) rather than profiles(id) — this feature lives
-- entirely in the agent panel, same as that table.

create table public.mls_rule_versions (
  id uuid primary key default gen_random_uuid(),
  version int not null unique,
  body text not null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Every member needs to read the current Reglamento to render the join
-- form's text/checkbox — no restriction beyond requiring a session. Nothing
-- in this slice lets a client write these rows; new versions are published
-- by hand (service role) until a later slice adds authoring UI.
alter table public.mls_rule_versions enable row level security;

create policy "mls_rule_versions_select_authenticated" on public.mls_rule_versions
  for select using (auth.role() = 'authenticated');

create table public.mls_rule_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.agent_profiles(id) on delete cascade,
  rule_version_id uuid not null references public.mls_rule_versions(id) on delete restrict,
  accepted_at timestamptz not null default now(),
  ip_address text,
  created_at timestamptz not null default now()
);

create index mls_rule_acceptances_user_id_idx on public.mls_rule_acceptances (user_id);

-- Append-only evidence trail: an agent can see their own acceptance history,
-- but nothing (not even the owning agent) can edit or delete a row directly
-- from the client. The only writer is join_mls() below, which runs as
-- security definer and so bypasses RLS entirely — no insert policy needed.
alter table public.mls_rule_acceptances enable row level security;

create policy "mls_rule_acceptances_select_own" on public.mls_rule_acceptances
  for select using (user_id = auth.uid());

create table public.mls_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.agent_profiles(id) on delete cascade,
  ci text not null,
  agency_name text,
  status text not null default 'inactive' check (status in ('active', 'inactive', 'removed')),
  accepted_rule_version_id uuid references public.mls_rule_versions(id),
  activated_at timestamptz,
  removed_at timestamptz,
  removed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.mls_memberships
  for each row execute function public.set_updated_at();

-- Deliberately NO insert/update policy for authenticated users here, even
-- though every other "owner" table in this schema (panel_section_views,
-- agencies, ...) lets the owner write their own row directly. Membership
-- activation must be atomic with logging a Reglamento acceptance (see
-- join_mls below), and "removed" must never be self-reactivatable by the
-- agent's own session — both of those guarantees only hold if every write
-- goes through a security-definer function or the service-role client.
-- Do not "fix" this by adding a self-service write policy later.
alter table public.mls_memberships enable row level security;

create policy "mls_memberships_select_own" on public.mls_memberships
  for select using (user_id = auth.uid());

-- Mirrors agent_has_active_pro_plan (0065) — used by join_mls() below, and
-- reserved for later slices (listing intake eligibility, etc.) that need
-- the same "is this agent's Plan MLS actually active and paid" check at the
-- RLS layer, not just in application code.
create or replace function public.agent_has_active_mls_plan(p_agent_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions
    where agent_id = p_agent_id
      and plan = 'mls'
      and status in ('active', 'trialing')
    order by created_at desc
    limit 1
  );
$$;

-- Atomic "Unirme al MLS": logs the Reglamento acceptance and activates (or
-- reactivates) membership in one transaction, so a failure between the two
-- writes a plain sequence of .insert() calls from a server action could
-- leave behind can't happen. Hardcodes auth.uid() (never a caller-supplied
-- id, mirroring create_agency() in 0048) and re-checks Plan MLS server-side
-- rather than trusting the caller already checked it client-side.
create or replace function public.join_mls(p_ci text, p_agency_name text, p_rule_version_id uuid, p_ip text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_membership_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if not public.agent_has_active_mls_plan(v_uid) then
    raise exception 'Plan MLS no está activo para este agente';
  end if;
  if p_ci is null or length(trim(p_ci)) = 0 then
    raise exception 'CI requerido';
  end if;

  insert into public.mls_rule_acceptances (user_id, rule_version_id, ip_address)
  values (v_uid, p_rule_version_id, p_ip);

  insert into public.mls_memberships (user_id, ci, agency_name, status, accepted_rule_version_id, activated_at)
  values (v_uid, trim(p_ci), nullif(trim(coalesce(p_agency_name, '')), ''), 'active', p_rule_version_id, now())
  on conflict (user_id) do update set
    ci = excluded.ci,
    agency_name = excluded.agency_name,
    status = 'active',
    accepted_rule_version_id = excluded.accepted_rule_version_id,
    activated_at = case when public.mls_memberships.status <> 'active' then now() else public.mls_memberships.activated_at end,
    updated_at = now()
  where public.mls_memberships.status <> 'removed'
  returning id into v_membership_id;

  if v_membership_id is null then
    raise exception 'Esta cuenta fue dada de baja del MLS y no puede volver a unirse.';
  end if;

  return v_membership_id;
end;
$$;

grant execute on function public.join_mls(text, text, uuid, text) to authenticated;
