-- Adds the two Avisos event types slice 2 (listing intake) needs, alongside
-- slice 1's membership_activated/membership_deactivated (0068).
alter table public.mls_notices drop constraint if exists mls_notices_type_check;
alter table public.mls_notices
  add constraint mls_notices_type_check
  check (type in ('membership_activated', 'membership_deactivated', 'mls_listing_added', 'mls_listing_duplicate_blocked'));
