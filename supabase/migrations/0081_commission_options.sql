-- Agent commission can be a fixed amount (some developers pay a flat sum) and
-- can be flagged as including or excluding IVA.
alter table public.properties
  add column commission_agent_type text not null default 'percentage'
    check (commission_agent_type in ('percentage', 'fixed')),
  add column commission_agent_amount numeric(14,2) check (commission_agent_amount >= 0),
  add column commission_vat_included boolean not null default false;

-- Proyecto en Pozo labeled its reward "% de tu comisión" but it was computed as
-- a % of the sale price. Existing rows move to the commission-share rule the
-- label always described; the value (the agent's intent) is kept as is.
update public.properties
set referral_reward_type = 'commission_share'
where listing_kind = 'proyecto_en_pozo' and referral_reward_type = 'percentage';
