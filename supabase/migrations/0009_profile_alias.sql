-- Free-form alias field on profiles, separate from `username` (which is the
-- identifier affiliate links resolve by via ?ref=). No uniqueness constraint —
-- purely a display field the user can set to whatever they want.

alter table public.profiles
  add column alias text;
