-- Security fix: invoice_counters (added in 0052_billing_invoices.sql) was
-- created without RLS enabled, leaving it publicly readable/writable via
-- the REST API (flagged by Supabase's automated security advisor). No
-- policies are added — the only legitimate access is through
-- increment_invoice_number(), a `security definer` function which bypasses
-- RLS entirely, so enabling RLS here just closes direct client access
-- without affecting that function.
alter table public.invoice_counters enable row level security;
