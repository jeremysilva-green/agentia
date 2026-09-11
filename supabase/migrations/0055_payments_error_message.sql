-- Human-readable failure reason for a payment attempt, surfaced distinctly
-- from raw_response (which is provider-shaped JSON, not agent-facing text).
-- First use: telling an agent their auto-renewal failed because their
-- stored card needs PIN confirmation (likely a debit card) rather than a
-- generic "Pago rechazado" with no actionable next step.
alter table public.payments add column if not exists error_message text;
