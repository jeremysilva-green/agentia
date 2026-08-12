-- Schedules the daily Pagopar recurring-charge run.
--
-- Two manual one-time steps are required OUTSIDE this migration (never put
-- an actual secret value inside a versioned migration file):
--   1. Enable the pg_cron / pg_net extensions via the Supabase dashboard
--      (Database > Extensions) if the `create extension` calls below fail
--      for permission reasons on your plan.
--   2. Create the shared cron secret once, from the SQL editor (NOT from a
--      migration): select vault.create_secret('<same value as the
--      CRON_SHARED_SECRET function secret>', 'cron_shared_secret');
--
-- Replace <PROJECT_REF> below with your actual Supabase project ref before
-- running this migration.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'pagopar-cobro-mensual',
  '0 10 * * *', -- daily 10:00 UTC — same cadence as the existing subscriptions-check cron
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/pagopar-cobro-mensual',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'cron_shared_secret'
      )
    ),
    body := '{}'::jsonb
  );
  $$
);
