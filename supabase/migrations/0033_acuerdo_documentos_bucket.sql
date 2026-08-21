-- Documents the owner attaches to a private_agreements row (título de
-- propiedad, comprobante de impuesto inmobiliario, C.I.). Same convention as
-- deal-reports/vendor-reports: public bucket, unguessable UUID-based path.
-- Path convention: {agreement_id}/{titulo|impuesto|ci}.{ext}
insert into storage.buckets (id, name, public)
values ('acuerdo-documentos', 'acuerdo-documentos', true)
on conflict (id) do nothing;

create policy "acuerdo_documentos_public_read" on storage.objects
  for select using (bucket_id = 'acuerdo-documentos');
