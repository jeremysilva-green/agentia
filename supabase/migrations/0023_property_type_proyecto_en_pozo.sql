-- Add "Proyecto en Pozo" (off-plan/pre-construction project) to the
-- property_type option set.

alter table public.properties
  drop constraint if exists properties_property_type_check;

alter table public.properties
  add constraint properties_property_type_check check (
    property_type in (
      'casa', 'departamento', 'terreno', 'duplex', 'triplex',
      'penthouse', 'edificio', 'lote', 'estancia', 'proyecto_en_pozo'
    )
  );
