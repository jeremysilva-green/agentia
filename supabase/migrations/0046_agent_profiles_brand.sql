-- Lets an agent set a brand/agency name and logo, shown as a small corner
-- badge on their public profile card in the /agentes portal grid.
alter table public.agent_profiles
  add column brand_name text,
  add column logo_url text;
