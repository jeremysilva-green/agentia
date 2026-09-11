-- Tracks whether the "your invoice is ready" Resend email actually sent,
-- so a silently-failed send is visible instead of invisible (mirrors the
-- rest of this migration's error-visibility philosophy for invoicing).
alter table public.billing_invoices add column if not exists invoice_email_sent_at timestamptz;
alter table public.billing_invoices add column if not exists invoice_email_error text;
