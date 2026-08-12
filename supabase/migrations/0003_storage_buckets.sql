-- Storage bucket for property photos
-- Path convention: {agent_id}/{property_id}/{uuid}.{ext}

insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict (id) do nothing;

create policy "property_photos_public_read" on storage.objects
  for select using (bucket_id = 'property-photos');

create policy "property_photos_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'property-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "property_photos_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'property-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
