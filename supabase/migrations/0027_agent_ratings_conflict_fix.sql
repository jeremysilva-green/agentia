-- The two partial unique indexes from 0024 (each scoped to "where user_id/
-- visitor_id is not null") can't be targeted by Supabase-js's upsert()
-- onConflict option, since Postgres requires a matching WHERE predicate on
-- the ON CONFLICT clause to infer a partial index, and the JS client has no
-- way to supply one — every rating upsert has been failing outright. Fixed
-- by collapsing rater identity into a single always-non-null generated
-- column, backed by one ordinary (non-partial) unique index.

drop index if exists agent_ratings_agent_user_unique;
drop index if exists agent_ratings_agent_visitor_unique;

alter table public.agent_ratings
  add column rater_key text generated always as (coalesce(user_id::text, visitor_id)) stored;

create unique index agent_ratings_agent_rater_unique on public.agent_ratings (agent_id, rater_key);
