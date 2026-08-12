-- Affiliates can already read the `leads` rows tied to their own affiliate
-- links (see leads_select_agent_or_affiliate in 0010_leads_pipeline.sql).
-- Extend the same access to `lead_events` so they can see view counts
-- ("Vistas") for their own links in the Mis Enlaces panel — previously only
-- the owning agent could read this table.

create policy "lead_events_select_own_affiliate" on public.lead_events
  for select using (
    exists (
      select 1 from public.affiliate_links al
      where al.id = lead_events.affiliate_link_id and al.user_id = auth.uid()
    )
  );
