-- Short, brandable affiliate links (agentia.com.py/s/AbC123) instead of the
-- full /agentes/.../propiedades/...?ref=... URL. The destination isn't
-- stored as a raw URL — the /s/[code] page re-derives it from property_id +
-- ref at request time (via a join to agent_profiles.slug), so a link stays
-- correct even if an agent's slug changes later. Looked up and written
-- entirely through the service role (src/lib/actions/affiliate.ts and the
-- /s/[code] page), same pattern as leads and chat_conversations — no client
-- policies needed.

create table public.short_links (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  ref text not null,
  click_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (property_id, user_id)
);

create index short_links_code_idx on public.short_links (code);

alter table public.short_links enable row level security;
