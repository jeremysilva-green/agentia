-- Agent ratings (with milestones computed client-side off avg/count)

create table public.agent_ratings (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agent_profiles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agent_id, user_id)
);

create index agent_ratings_agent_id_idx on public.agent_ratings (agent_id);

create trigger set_updated_at before update on public.agent_ratings
  for each row execute function public.set_updated_at();

alter table public.agent_ratings enable row level security;

create policy "agent_ratings_select_all" on public.agent_ratings
  for select using (true);

create policy "agent_ratings_insert_own" on public.agent_ratings
  for insert with check (user_id = auth.uid());

create policy "agent_ratings_update_own" on public.agent_ratings
  for update using (user_id = auth.uid());

-- Avatar photos bucket
-- Path convention: {user_id}/{uuid}.{ext}

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
