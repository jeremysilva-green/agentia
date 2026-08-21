-- Tracks when an agent last looked at a given panel section, so the nav can
-- show a notification dot for sections with activity newer than that.
create table public.panel_section_views (
  agent_id uuid not null references public.agent_profiles(id) on delete cascade,
  section text not null check (section in ('leads', 'solicitudes', 'chats', 'agendamientos', 'acuerdos')),
  seen_at timestamptz not null default now(),
  primary key (agent_id, section)
);

alter table public.panel_section_views enable row level security;

create policy "panel_section_views_agent_all" on public.panel_section_views
  for all using (agent_id = auth.uid()) with check (agent_id = auth.uid());
