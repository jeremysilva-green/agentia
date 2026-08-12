-- Row Level Security policies

alter table public.profiles enable row level security;
alter table public.agent_profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.affiliate_links enable row level security;
alter table public.lead_events enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;

-- Helper: is this agent currently public-visible?
create or replace function public.is_agent_active(check_agent_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_active from public.agent_profiles where id = check_agent_id), false);
$$;

-- profiles: owner can read/update own row; anyone can read minimal public fields
-- (kept simple: full row is readable by anyone since it only holds username/name/avatar,
-- no sensitive data lives here)
create policy "profiles_select_all" on public.profiles
  for select using (true);

create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- agent_profiles: public can see active agents; owner sees/edits own regardless
create policy "agent_profiles_select_active_or_own" on public.agent_profiles
  for select using (is_active = true or id = auth.uid());

create policy "agent_profiles_insert_own" on public.agent_profiles
  for insert with check (id = auth.uid());

create policy "agent_profiles_update_own" on public.agent_profiles
  for update using (id = auth.uid());

-- properties: public can see published properties of active agents; owner sees/edits own always
create policy "properties_select_public_or_own" on public.properties
  for select using (
    (published = true and public.is_agent_active(agent_id))
    or agent_id = auth.uid()
  );

create policy "properties_insert_own" on public.properties
  for insert with check (agent_id = auth.uid());

create policy "properties_update_own" on public.properties
  for update using (agent_id = auth.uid());

create policy "properties_delete_own" on public.properties
  for delete using (agent_id = auth.uid());

-- property_images: follow parent property visibility/ownership
create policy "property_images_select_public_or_own" on public.property_images
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id
        and (
          (p.published = true and public.is_agent_active(p.agent_id))
          or p.agent_id = auth.uid()
        )
    )
  );

create policy "property_images_insert_own" on public.property_images
  for insert with check (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id and p.agent_id = auth.uid()
    )
  );

create policy "property_images_delete_own" on public.property_images
  for delete using (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id and p.agent_id = auth.uid()
    )
  );

-- affiliate_links: owning user manages own; agent who owns the property can read
create policy "affiliate_links_select_owner_or_agent" on public.affiliate_links
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.properties p
      where p.id = affiliate_links.property_id and p.agent_id = auth.uid()
    )
  );

create policy "affiliate_links_insert_own" on public.affiliate_links
  for insert with check (user_id = auth.uid());

-- lead_events: no direct client access; all reads/writes go through service-role Route Handlers.
-- Agents may read events for their own properties via the leads panel (server-side, using their session).
create policy "lead_events_select_own_agent" on public.lead_events
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = lead_events.property_id and p.agent_id = auth.uid()
    )
  );

-- subscriptions/payments: agent can read own; all writes are service-role only (no policy = no client writes)
create policy "subscriptions_select_own" on public.subscriptions
  for select using (agent_id = auth.uid());

create policy "payments_select_own" on public.payments
  for select using (
    exists (
      select 1 from public.subscriptions s
      where s.id = payments.subscription_id and s.agent_id = auth.uid()
    )
  );
