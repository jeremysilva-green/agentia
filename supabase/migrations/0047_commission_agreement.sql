-- Affiliate's CI (cédula de identidad), needed for the commission-agreement
-- contract generated when an agent closes a deal referred by this affiliate.
alter table public.profiles add column ci text;

-- Tracks the agent's mandatory acceptance of the commission-recognition
-- contract ("ACUERDO DE RECONOCIMIENTO Y PAGO DE COMISIÓN POR REFERENCIA")
-- before "Pagar al Afiliado" becomes available, plus the finalized PDF path.
alter table public.leads
  add column commission_agreement_accepted_at timestamptz,
  add column commission_agreement_path text;

-- Bucket for the finalized commission-agreement contract PDFs — separate
-- from deal-reports since this is a distinct legal document, not the
-- existing "cierre de trato" summary report.
insert into storage.buckets (id, name, public)
values ('commission-agreements', 'commission-agreements', true)
on conflict (id) do nothing;

create policy "commission_agreements_public_read" on storage.objects
  for select using (bucket_id = 'commission-agreements');
