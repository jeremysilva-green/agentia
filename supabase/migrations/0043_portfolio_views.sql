-- Tracks visits to an agent's public portfolio page (/agentes/[slug]).
-- Mirrors lead_events' "view" tracking, which is scoped to individual
-- property pages only — portfolio-level traffic has no equivalent until now.
create table public.portfolio_views (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agent_profiles(id) on delete cascade,
  visitor_id text,
  created_at timestamptz not null default now()
);

create index portfolio_views_agent_id_idx on public.portfolio_views (agent_id);

alter table public.portfolio_views enable row level security;

-- No insert policy: rows are written by the public portfolio-page tracker
-- via the service role (the visitor isn't authenticated), same pattern as
-- lead_events.
create policy "portfolio_views_agent_select" on public.portfolio_views
  for select using (agent_id = auth.uid());
