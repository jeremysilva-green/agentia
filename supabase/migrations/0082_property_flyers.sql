-- One saved flyer per property, rendered server-side (Satori) from the "Crear
-- Flyer" dialog and shown in the Redes Sociales tab. Unique on property_id:
-- like marketing_videos, "saving again replaces it" — not a render history.
create table public.property_flyers (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  agent_id uuid not null references public.agent_profiles(id) on delete cascade,
  storage_path text not null,
  -- Accent color the agent picked (#rrggbb): the golden icons and lines.
  accent_color text not null default '#E6B763',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id)
);

create index property_flyers_agent_id_idx on public.property_flyers (agent_id);

create trigger set_updated_at before update on public.property_flyers
  for each row execute function public.set_updated_at();

alter table public.property_flyers enable row level security;

create policy "property_flyers_select_own" on public.property_flyers
  for select using (agent_id = auth.uid());

create policy "property_flyers_insert_own" on public.property_flyers
  for insert with check (agent_id = auth.uid());

create policy "property_flyers_update_own" on public.property_flyers
  for update using (agent_id = auth.uid());

create policy "property_flyers_delete_own" on public.property_flyers
  for delete using (agent_id = auth.uid());

-- Public bucket, unguessable path, same convention as marketing-videos.
insert into storage.buckets (id, name, public)
values ('property-flyers', 'property-flyers', true)
on conflict (id) do nothing;

create policy "property_flyers_bucket_public_read" on storage.objects
  for select using (bucket_id = 'property-flyers');

create policy "property_flyers_bucket_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'property-flyers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "property_flyers_bucket_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'property-flyers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
