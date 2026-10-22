-- Backs the marketplace property card's heart/favorite toggle. Anonymous
-- visitors are attributed by a localStorage visitor_id, same pattern as
-- agent_ratings/chat_conversations. Writes always go through the
-- service-role client (src/lib/actions/propertyLikes.ts), bypassing RLS —
-- the select policy below is only for read paths (e.g. Vista Global's
-- monthly funnel count) that use the normal session-scoped client.

create table public.property_likes (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  visitor_id text not null,
  created_at timestamptz not null default now(),
  unique (property_id, visitor_id)
);

create index property_likes_property_id_idx on public.property_likes (property_id);

alter table public.property_likes enable row level security;

create policy "property_likes_select_all" on public.property_likes
  for select using (true);
