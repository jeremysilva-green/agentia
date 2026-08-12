-- Tracks acceptance of the platform Terms & Conditions. Agents and
-- affiliates are shown a blocking modal on their panel until they check the
-- box; null means not yet accepted (including existing accounts predating
-- this rollout, who will be prompted on next login).

alter table public.profiles
  add column terms_accepted_at timestamptz;
