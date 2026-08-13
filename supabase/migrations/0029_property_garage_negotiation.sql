-- "garage" is normal public listing info (shown on the property page like
-- bedrooms/bathrooms). "negotiation_type"/"negotiation_details" capture
-- what the seller is actually willing to accept (fixed price, trade/permuta
-- for land/a car/etc, negotiable price) — this is agent-only info, never
-- rendered on the public property page, but readable by the chat assistant
-- so it can answer buyer questions like "would they take a car as part of
-- the deal" without the seller's negotiating position being posted publicly.
alter table public.properties
  add column garage boolean not null default false,
  add column negotiation_type text[] not null default '{}',
  add column negotiation_details text;
