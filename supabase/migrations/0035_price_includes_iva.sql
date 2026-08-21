-- Tracks whether the price a vendedor/agent entered already has 10% IVA
-- baked in, so the "IVA (10%)" checkbox can be restored correctly instead
-- of always defaulting to unchecked (the number itself doesn't tell you
-- whether tax was already applied).
alter table public.client_requests add column if not exists price_includes_iva boolean not null default false;
alter table public.properties add column if not exists price_includes_iva boolean not null default false;
