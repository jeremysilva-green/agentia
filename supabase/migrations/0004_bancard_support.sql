-- Bancard vPOS shop_process_id must be an integer (not a UUID), so we back it
-- with a dedicated sequence instead of reusing payments.id.

create sequence if not exists public.bancard_shop_process_id_seq start 100000;

create or replace function public.next_shop_process_id()
returns bigint
language sql
security definer
set search_path = public
as $$
  select nextval('public.bancard_shop_process_id_seq');
$$;

alter table public.payments add column if not exists bancard_process_id text;
