-- Store the Google Maps link an agent pastes in, alongside the lat/lng
-- derived from it (kept for the existing embed logic in PropertyMap, and so
-- re-parsing on every read isn't needed). The raw link round-trips into the
-- edit form; lat/lng stay the source of truth for the embedded map.

alter table public.properties
  add column maps_url text;
