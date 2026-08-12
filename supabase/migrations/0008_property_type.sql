-- Property type/category (Casa, Departamento, Terreno, ...), separate from
-- listing_type (venta/alquiler). Nullable: existing rows predate this field
-- and shouldn't be silently mislabeled with a guessed default.

alter table public.properties
  add column property_type text check (
    property_type in (
      'casa', 'departamento', 'terreno', 'local_comercial',
      'oficina', 'duplex', 'triplex', 'penthouse', 'bnb'
    )
  );

create index properties_property_type_idx on public.properties (property_type);
