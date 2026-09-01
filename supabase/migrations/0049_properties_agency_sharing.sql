-- Agency Plan Phase 1: lets a property be attached to an agency's shared
-- pool. Purely additive:
--   - New column is nullable, no default change, no backfill — every
--     existing row gets agency_id = null and is completely unaffected by
--     anything below.
--   - ON DELETE SET NULL (not CASCADE): deleting an agency must never
--     delete real listings, it should just fall back to being a normal
--     single-agent property owned by whichever agent_id already owns it.
--   - Every new RLS policy below is a NEW policy alongside the untouched
--     originals from 0002_rls_policies.sql. Postgres OR's multiple
--     policies for the same command together, so these only ever ADD
--     access, never remove or narrow it.
--   - No new INSERT policy is needed: creating a property still inserts
--     with agent_id = auth.uid() regardless of agency_id, which the
--     existing properties_insert_own policy already covers.
--   - No new DELETE policy: only the original agent_id owner may delete a
--     listing in Phase 1, even if it's agency-shared (elevated roles get
--     real management in a later phase).
--   - Public marketplace visibility is intentionally left alone: the
--     existing properties_select_public_or_own policy already governs
--     published/public visibility off is_agent_active(agent_id), which is
--     still the creating agent's own row — agency membership only adds
--     *internal* panel visibility for teammates, it does not change what
--     the public sees.

alter table public.properties
  add column agency_id uuid references public.agencies(id) on delete set null;

create index properties_agency_id_idx on public.properties (agency_id);

-- SELECT: any active member of the property's agency (any role) can read
-- it — this is the "shared inventory" the whole feature is for.
create policy "properties_select_agency_member" on public.properties
  for select using (
    agency_id is not null
    and public.is_active_agency_member(agency_id, auth.uid())
  );

-- UPDATE: only elevated roles (Owner/Admin/Manager) get blanket update
-- rights over teammates' listings. A plain 'agent'/'assistant' member
-- editing their OWN listing is already covered by properties_update_own
-- (agent_id = auth.uid()), unchanged. Groundwork for a later phase — no
-- Phase 1 action uses this grant yet (the edit form/action still requires
-- agent_id = auth.uid()), but the DB-level permission is in place.
create policy "properties_update_agency_elevated" on public.properties
  for update using (
    agency_id is not null
    and public.can_edit_agency_properties(agency_id, auth.uid())
  );

-- property_images: mirror the parent property's new agency access exactly
-- the way the existing 3 policies already mirror agent_id ownership.
create policy "property_images_select_agency_member" on public.property_images
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id
        and p.agency_id is not null
        and public.is_active_agency_member(p.agency_id, auth.uid())
    )
  );

create policy "property_images_insert_agency_elevated" on public.property_images
  for insert with check (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id
        and p.agency_id is not null
        and public.can_edit_agency_properties(p.agency_id, auth.uid())
    )
  );

create policy "property_images_delete_agency_elevated" on public.property_images
  for delete using (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id
        and p.agency_id is not null
        and public.can_edit_agency_properties(p.agency_id, auth.uid())
    )
  );
