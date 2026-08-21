-- Currency for the vendedor's asking price, so it can carry through to the
-- draft property on approval instead of always assuming PYG.
alter table public.client_requests add column if not exists currency text not null default 'PYG';
