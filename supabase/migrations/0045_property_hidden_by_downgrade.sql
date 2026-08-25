-- Tracks whether a property's published=false state came from
-- enforceBasicoPropertyLimit() automatically hiding it during a Pro/Fundador
-- -> Básico downgrade (as opposed to the agent deliberately unpublishing it
-- themselves). Lets an upgrade back to Pro/Fundador auto-republish exactly
-- the properties the downgrade hid, without touching ones the agent chose
-- to unpublish on their own for unrelated reasons.
alter table public.properties
  add column hidden_by_downgrade boolean not null default false;
