-- Plan MLS — Avisos (notifications). Generic infrastructure: this slice
-- only ever creates 'membership_activated' notices, but the table and its
-- nullable listing/registration/showing/closing references are shaped for
-- every event type later MLS slices will add (no FK yet on
-- registration/showing/closing since those tables don't exist yet).
--
-- Append-only by design, matching the spec: a notice is evidence an agent
-- can download and use outside the platform, so nothing (not even the
-- recipient) may edit its content after creation. The one exception is
-- read/delivery-tracking state (read_at, email_sent_at, email_error,
-- receipt_storage_path) — enforced below by a trigger, not just convention,
-- the same way 0065 moved a client-bypassable gate into the DB layer.

create table public.mls_notices (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.agent_profiles(id) on delete cascade,
  type text not null check (type in ('membership_activated', 'membership_deactivated')),
  title text not null,
  body text not null,
  listing_id uuid references public.properties(id) on delete set null,
  registration_id uuid,
  showing_id uuid,
  closing_id uuid,
  event_at timestamptz not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  email_sent_at timestamptz,
  email_error text,
  receipt_storage_path text
);

create index mls_notices_recipient_user_id_idx on public.mls_notices (recipient_user_id);
create index mls_notices_recipient_unread_idx on public.mls_notices (recipient_user_id) where read_at is null;

alter table public.mls_notices enable row level security;

create policy "mls_notices_select_own" on public.mls_notices
  for select using (recipient_user_id = auth.uid());

-- The recipient may mark their own notice read; every other write (the
-- initial insert, and email/receipt bookkeeping) goes through the
-- service-role client from createMlsNotice()/the comprobante route, never
-- through a client-facing RLS insert policy.
create policy "mls_notices_update_own_read_state" on public.mls_notices
  for update using (recipient_user_id = auth.uid()) with check (recipient_user_id = auth.uid());

-- Belt-and-suspenders on top of the update policy above: even a request
-- that passes the "it's your own notice" check can only ever change
-- read_at/email_sent_at/email_error/receipt_storage_path. Applies to every
-- writer, including the service-role client, so email/receipt bookkeeping
-- can't accidentally touch the notice's actual content either.
create or replace function public.mls_notices_enforce_append_only()
returns trigger
language plpgsql
as $$
begin
  if old.recipient_user_id is distinct from new.recipient_user_id
    or old.type is distinct from new.type
    or old.title is distinct from new.title
    or old.body is distinct from new.body
    or old.listing_id is distinct from new.listing_id
    or old.registration_id is distinct from new.registration_id
    or old.showing_id is distinct from new.showing_id
    or old.closing_id is distinct from new.closing_id
    or old.event_at is distinct from new.event_at
    or old.created_at is distinct from new.created_at
  then
    raise exception 'mls_notices rows are append-only — only read_at/email_sent_at/email_error/receipt_storage_path may change';
  end if;
  return new;
end;
$$;

create trigger mls_notices_append_only before update on public.mls_notices
  for each row execute function public.mls_notices_enforce_append_only();

-- Bucket for the "Descargar comprobante" PDF, generated lazily on first
-- download — public-by-unguessable-path, same convention as
-- commission-agreements (0047) and deal-reports.
insert into storage.buckets (id, name, public)
values ('mls-notice-receipts', 'mls-notice-receipts', true)
on conflict (id) do nothing;

create policy "mls_notice_receipts_public_read" on storage.objects
  for select using (bucket_id = 'mls-notice-receipts');
