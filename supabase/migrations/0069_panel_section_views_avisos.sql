-- Adds the agent-side Avisos tab to the existing nav unread-dot mechanism
-- (panel_section_views, 0034) — mirrors how affiliate_section_views already
-- has an 'avisos' section (0058) for the affiliate-side tab.
alter table public.panel_section_views drop constraint if exists panel_section_views_section_check;
alter table public.panel_section_views
  add constraint panel_section_views_section_check
  check (section in ('leads', 'solicitudes', 'chats', 'agendamientos', 'acuerdos', 'avisos'));
