-- One generated 10s MP4 "listing video" per property, rendered entirely
-- client-side (WebCodecs/mediabunny, falling back to MediaRecorder) and
-- uploaded straight from the browser to the marketing-videos bucket. The
-- app code never touches the file. Unique on property_id: the UI model is
-- "one video per listing, regenerating replaces it" — not a render history.
create table public.marketing_videos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  agent_id uuid not null references public.agent_profiles(id) on delete cascade,
  storage_path text not null,
  caption text not null default '',
  size_bytes integer,
  -- Snapshot of properties.updated_at at render time, so the edit page and
  -- Redes Sociales tab can both detect "listing changed since this video
  -- was made" by comparing against the live properties.updated_at.
  listing_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id)
);

create index marketing_videos_agent_id_idx on public.marketing_videos (agent_id);

create trigger set_updated_at before update on public.marketing_videos
  for each row execute function public.set_updated_at();

alter table public.marketing_videos enable row level security;

-- Full read+write policy set from day one (the short_links lesson —
-- 0026_short_links_select_policy.sql — must not repeat): the browser
-- writes this row directly with the agent's own session, same as
-- PropertyPhotoManager already does for property_images.
create policy "marketing_videos_select_own" on public.marketing_videos
  for select using (agent_id = auth.uid());

create policy "marketing_videos_insert_own" on public.marketing_videos
  for insert with check (agent_id = auth.uid());

create policy "marketing_videos_update_own" on public.marketing_videos
  for update using (agent_id = auth.uid());

create policy "marketing_videos_delete_own" on public.marketing_videos
  for delete using (agent_id = auth.uid());

-- Public bucket + unguessable path, identical convention to property-photos
-- (0003_storage_buckets.sql) — no signed URLs, the video is meant to be
-- shared publicly anyway.
insert into storage.buckets (id, name, public)
values ('marketing-videos', 'marketing-videos', true)
on conflict (id) do nothing;

create policy "marketing_videos_bucket_public_read" on storage.objects
  for select using (bucket_id = 'marketing-videos');

create policy "marketing_videos_bucket_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'marketing-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "marketing_videos_bucket_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'marketing-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
