-- This project's first genuinely private bucket. Every other bucket
-- (property-photos, deal-reports, commission-agreements, invoices,
-- mls-notice-receipts, ...) is public=true with a bare "bucket_id = '...'"
-- select policy — public-by-unguessable-path. An owner sale authorization
-- is a real legal document that only the listing agent should ever be able
-- to read (per the original spec's own data model: "mls_authorizations |
-- file path per mls_listing | Listing agent" — unlike mls_listings/
-- mls_listing_private, this is NOT readable by every active member). App
-- code must use createSignedUrl() to read it back — there is no public URL.
insert into storage.buckets (id, name, public)
values ('mls-authorizations', 'mls-authorizations', false)
on conflict (id) do nothing;

-- Path convention: mls-authorizations/{mls_listing_id}/{filename} — the
-- first path segment is the mls_listings.id, checked against agent_id here.
create policy "mls_authorizations_select_own" on storage.objects
  for select using (
    bucket_id = 'mls-authorizations'
    and exists (
      select 1 from public.mls_listings m
      where m.id::text = (storage.foldername(name))[1]
        and m.agent_id = auth.uid()
    )
  );

-- Deliberately no insert/update/delete policy for `authenticated` — the
-- upload happens entirely through the service-role client in
-- /api/mls/listings, same "no self-service write" posture as
-- mls_memberships/mls_notices (0067/0068).
