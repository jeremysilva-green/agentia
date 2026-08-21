-- client_requests.property_type never got the "Proyecto en Pozo" addition
-- that properties.property_type got in 0023 — submitting a vendedor request
-- with that type fails this check constraint at insert time.
alter table public.client_requests
  drop constraint if exists client_requests_property_type_check;

alter table public.client_requests
  add constraint client_requests_property_type_check check (
    property_type in (
      'casa', 'departamento', 'terreno', 'duplex', 'triplex',
      'penthouse', 'edificio', 'lote', 'estancia', 'proyecto_en_pozo'
    )
  );
