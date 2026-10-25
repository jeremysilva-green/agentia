-- Tracks whether the "add your profile photo" reminder email has been sent
-- (or doesn't need to be), so the cron is idempotent and only ever fires
-- once per agent. Backfilled to now() for every existing row so the
-- reminder only ever reaches agents who sign up from this point forward,
-- not a one-time mass email to everyone who already lacks a photo.

alter table public.profiles
  add column profile_photo_reminder_sent_at timestamptz;

update public.profiles
  set profile_photo_reminder_sent_at = now()
  where profile_photo_reminder_sent_at is null;
