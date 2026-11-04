-- Adds the property types that only Proyecto en Pozo listings offer:
-- Barrio Cerrado, Condominios y Complejos, Local Comercial. Additive only —
-- the existing values are kept as-is (proyecto_en_pozo stays out, it is a
-- listing_kind, see 0066).
alter table public.properties drop constraint if exists properties_property_type_check;
alter table public.properties
  add constraint properties_property_type_check check (
    property_type in (
      'casa', 'departamento', 'terreno', 'duplex', 'triplex',
      'penthouse', 'edificio', 'lote', 'estancia',
      'barrio_cerrado', 'condominio', 'local_comercial'
    )
  );
