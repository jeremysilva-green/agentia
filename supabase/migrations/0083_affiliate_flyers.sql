-- One saved flyer per (property, affiliate): the affiliate version of
-- property_flyers, created from "Generar link" on a property card. Shares the
-- property-flyers storage bucket (its policies key on the uploader's id as the
-- first folder, which works for any signed-in user). Saving again replaces it.
create table public.affiliate_flyers (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  accent_color text not null default '#E6B763',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, user_id)
);

create index affiliate_flyers_user_id_idx on public.affiliate_flyers (user_id);

create trigger set_updated_at before update on public.affiliate_flyers
  for each row execute function public.set_updated_at();

alter table public.affiliate_flyers enable row level security;

create policy "affiliate_flyers_select_own" on public.affiliate_flyers
  for select using (user_id = auth.uid());

create policy "affiliate_flyers_insert_own" on public.affiliate_flyers
  for insert with check (user_id = auth.uid());

create policy "affiliate_flyers_update_own" on public.affiliate_flyers
  for update using (user_id = auth.uid());

create policy "affiliate_flyers_delete_own" on public.affiliate_flyers
  for delete using (user_id = auth.uid());
