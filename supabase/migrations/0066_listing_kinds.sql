-- Proyecto en Pozo & Modelo de Construcción listing kinds.
--
-- Every existing row defaults to listing_kind='standard', construction_stage=
-- 'terminada' — Postgres backfills existing rows to a column's default at
-- ADD COLUMN time (same proven idiom as hidden_by_downgrade in
-- 0045_property_hidden_by_downgrade.sql), so this needs no manual UPDATE and
-- changes zero behavior for the properties already live on the site.

alter table public.properties
  add column listing_kind text not null default 'standard'
  check (listing_kind in ('standard', 'proyecto_en_pozo', 'modelo'));

-- Shared by standard AND proyecto_en_pozo — a plain Propiedad listing is
-- implicitly "terminada".
alter table public.properties
  add column construction_stage text not null default 'terminada'
  check (construction_stage in ('terminada', 'en_construccion', 'en_pozo'));

-- Proyecto en Pozo fields — nullable, only populated for that listing_kind.
alter table public.properties
  add column developer_name text,
  add column estimated_delivery_date date,
  add column construction_progress_pct numeric(5,2) check (construction_progress_pct between 0 and 100),
  add column total_units int check (total_units >= 0),
  add column payment_plan_deposit_pct numeric(5,2) check (payment_plan_deposit_pct between 0 and 100),
  add column payment_plan_installments_text text,
  add column payment_plan_balance_pct numeric(5,2) check (payment_plan_balance_pct between 0 and 100),
  add column payment_plan_financing_options text[] not null default '{}';

-- Modelo de Construcción fields — nullable, only populated for that listing_kind.
alter table public.properties
  add column model_materials_text text,
  add column model_construction_term_months int check (model_construction_term_months >= 0),
  add column model_includes_land text check (model_includes_land in ('no_terreno_cliente', 'si_incluido', 'opcional')),
  add column model_financing_type text check (model_financing_type in ('che_roga_pora', 'bancaria', 'propia')),
  add column model_installment_from numeric(12,2) check (model_installment_from >= 0),
  add column model_down_payment_text text,
  add column model_qualifying_requirements text;

-- Commission/referral override, shared by both new kinds. NULL means "use the
-- existing global AGENT_COMMISSION_PCT/AFFILIATE_COMMISSION_PCT constants",
-- exactly like leads.commission_pct already does — never populated for
-- standard listings, so closeLeadDeal()/upsertLeadFromChatClick() keep their
-- exact current behavior whenever these are null.
alter table public.properties
  add column commission_trigger_label text,
  add column commission_agent_pct numeric(5,2) check (commission_agent_pct between 0 and 100),
  add column referral_reward_type text check (referral_reward_type in ('percentage', 'fixed')),
  add column referral_reward_value numeric(12,2) check (referral_reward_value >= 0),
  add column referral_attribution_days int check (referral_attribution_days > 0);

-- Tipologías (Proyecto en Pozo) — one-to-many, mirrors property_images shape.
create table public.property_typologies (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  bedrooms int check (bedrooms >= 0),
  area_m2 numeric(8,2) check (area_m2 >= 0),
  price_from numeric(12,2) check (price_from >= 0),
  units_available int check (units_available >= 0),
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index property_typologies_property_id_idx on public.property_typologies (property_id);

-- Coverage cities (Modelo de Construcción) — one-to-many, mirrors property_images shape.
create table public.property_coverage_cities (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  city text not null,
  created_at timestamptz not null default now(),
  unique (property_id, city)
);

create index property_coverage_cities_property_id_idx on public.property_coverage_cities (property_id);

-- RLS — exact mirror of property_images's parent-ownership-via-EXISTS pattern
-- from 0002_rls_policies.sql, shipping WITH a select policy from day one.
alter table public.property_typologies enable row level security;
alter table public.property_coverage_cities enable row level security;

create policy "property_typologies_select_public_or_own" on public.property_typologies
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = property_typologies.property_id
        and (
          (p.published = true and public.is_agent_active(p.agent_id))
          or p.agent_id = auth.uid()
        )
    )
  );

create policy "property_typologies_insert_own" on public.property_typologies
  for insert with check (
    exists (
      select 1 from public.properties p
      where p.id = property_typologies.property_id and p.agent_id = auth.uid()
    )
  );

create policy "property_typologies_delete_own" on public.property_typologies
  for delete using (
    exists (
      select 1 from public.properties p
      where p.id = property_typologies.property_id and p.agent_id = auth.uid()
    )
  );

create policy "property_coverage_cities_select_public_or_own" on public.property_coverage_cities
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = property_coverage_cities.property_id
        and (
          (p.published = true and public.is_agent_active(p.agent_id))
          or p.agent_id = auth.uid()
        )
    )
  );

create policy "property_coverage_cities_insert_own" on public.property_coverage_cities
  for insert with check (
    exists (
      select 1 from public.properties p
      where p.id = property_coverage_cities.property_id and p.agent_id = auth.uid()
    )
  );

create policy "property_coverage_cities_delete_own" on public.property_coverage_cities
  for delete using (
    exists (
      select 1 from public.properties p
      where p.id = property_coverage_cities.property_id and p.agent_id = auth.uid()
    )
  );

-- Remove 'proyecto_en_pozo' from property_type — it's now a listing_kind, not
-- a property type. Confirmed zero existing rows use this value, so no data
-- migration is needed.
alter table public.properties drop constraint if exists properties_property_type_check;
alter table public.properties
  add constraint properties_property_type_check check (
    property_type in (
      'casa', 'departamento', 'terreno', 'duplex', 'triplex',
      'penthouse', 'edificio', 'lote', 'estancia'
    )
  );
