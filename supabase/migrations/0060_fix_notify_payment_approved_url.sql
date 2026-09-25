-- 0052_billing_invoices.sql shipped with the literal placeholder text
-- <SITE_URL> never substituted for the real domain, so the invoicing
-- trigger's HTTP call has been failing outright (not just failing auth)
-- since it was first created — documented in LAUNCH_CHECKLIST.md as a
-- known, still-open gap. Fixes it in place with the real production URL.
create or replace function public.notify_payment_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://agentia.com.py/api/internal/invoices/create',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'internal_billing_secret'
      )
    ),
    body := jsonb_build_object('payment_id', new.id)
  );
  return new;
end;
$$;
