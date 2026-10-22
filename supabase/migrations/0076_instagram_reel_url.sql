-- Optional Instagram Reel link per property, embedded on the property info
-- page next to the YouTube video (same optional-URL pattern as youtube_url).

alter table public.properties
  add column instagram_reel_url text;
