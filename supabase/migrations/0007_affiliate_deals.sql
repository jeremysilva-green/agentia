-- Deal report PDFs bucket
-- Path convention: {lead_id}.pdf
-- Written only by server code using the service role (mirrors subscriptions/payments:
-- no client insert/update policy means no client writes).

insert into storage.buckets (id, name, public)
values ('deal-reports', 'deal-reports', true)
on conflict (id) do nothing;

create policy "deal_reports_public_read" on storage.objects
  for select using (bucket_id = 'deal-reports');
