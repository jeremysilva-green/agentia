-- Optional YouTube video link for a property listing, shown alongside the
-- photo gallery on the public property page. Nullable, no backfill —
-- every existing row gets youtube_url = null and is unaffected.

alter table public.properties
  add column youtube_url text;
