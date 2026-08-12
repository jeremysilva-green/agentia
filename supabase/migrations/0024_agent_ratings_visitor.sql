-- Anyone can rate an agent now, not just logged-in users — ratings from
-- anonymous visitors are attributed by a localStorage visitor_id, the same
-- pattern already used for chat_conversations. Existing authenticated
-- ratings (user_id) keep working side by side; writes for both go through
-- the service role in src/lib/actions/ratings.ts, same as other
-- visitor-attributed tables.

alter table public.agent_ratings
  alter column user_id drop not null;

alter table public.agent_ratings
  add column visitor_id text;

alter table public.agent_ratings
  drop constraint if exists agent_ratings_agent_id_user_id_key;

create unique index agent_ratings_agent_user_unique
  on public.agent_ratings (agent_id, user_id)
  where user_id is not null;

create unique index agent_ratings_agent_visitor_unique
  on public.agent_ratings (agent_id, visitor_id)
  where visitor_id is not null;
