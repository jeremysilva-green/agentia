-- Mirrors panel_section_views (0034) but for affiliates, whose id lives in
-- profiles rather than agent_profiles — tracks when an affiliate last looked
-- at a given panel section, so the nav can show a notification dot for
-- sections with activity newer than that.
create table public.affiliate_section_views (
  affiliate_id uuid not null references public.profiles(id) on delete cascade,
  section text not null check (section in ('resumen', 'avisos')),
  seen_at timestamptz not null default now(),
  primary key (affiliate_id, section)
);

alter table public.affiliate_section_views enable row level security;

create policy "affiliate_section_views_owner_all" on public.affiliate_section_views
  for all using (affiliate_id = auth.uid()) with check (affiliate_id = auth.uid());
