-- Revert Agency Plan Phase 1 (0048_agencies.sql, 0049_properties_agency_sharing.sql).
-- The Agency Plan feature was scrapped before launch — drops everything
-- those two migrations added. The properties/property_images tables and
-- every original policy from 0002_rls_policies.sql are completely
-- untouched; this only removes what 0048/0049 layered on top.

drop policy if exists "property_images_delete_agency_elevated" on public.property_images;
drop policy if exists "property_images_insert_agency_elevated" on public.property_images;
drop policy if exists "property_images_select_agency_member" on public.property_images;

drop policy if exists "properties_update_agency_elevated" on public.properties;
drop policy if exists "properties_select_agency_member" on public.properties;

drop index if exists public.properties_agency_id_idx;
alter table public.properties drop column if exists agency_id;

-- Tables first (cascades their own policies, which is what still
-- references is_agency_manager/is_agency_member below) — functions after.
drop table if exists public.agency_members;
drop table if exists public.agencies;

drop function if exists public.create_agency(text);
drop function if exists public.can_edit_agency_properties(uuid, uuid);
drop function if exists public.is_agency_manager(uuid, uuid);
drop function if exists public.is_active_agency_member(uuid, uuid);
drop function if exists public.is_agency_member(uuid, uuid);
