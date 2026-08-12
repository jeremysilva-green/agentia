-- Optional listing details — left null for property types where they don't
-- apply (e.g. terreno/lote), filled in when relevant.

alter table public.properties
  add column bedrooms integer,
  add column bathrooms integer,
  add column area_m2 numeric(8,2);
