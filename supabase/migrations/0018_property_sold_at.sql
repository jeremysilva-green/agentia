-- Precise "when did this sell" timestamp, distinct from updated_at (which
-- changes on any edit). Needed for accurate monthly sales reporting — set
-- whenever a property's status transitions to 'sold', either from the panel
-- form (updateProperty) or when an affiliate deal is closed (closeLeadDeal).

alter table public.properties
  add column sold_at timestamptz;
