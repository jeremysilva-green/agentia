-- Named buyer leads with referral attribution + protection window.
--
-- A lead is created when a buyer clicks "Chat" on a property and submits
-- their name/phone. If they came through an affiliate link, that referral
-- is protected for REFERRAL_PROTECTION_DAYS: even if the same buyer later
-- contacts the agent directly (matched by phone + property), the original
-- affiliate keeps the attribution as long as the protection window hasn't
-- expired. See src/lib/leads/referralProtection.ts for the matching logic.

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  referral_code text not null unique,
  property_id uuid not null references public.properties(id) on delete cascade,
  agent_id uuid not null references public.agent_profiles(id) on delete cascade,
  affiliate_link_id uuid references public.affiliate_links(id) on delete set null,
  buyer_name text not null,
  buyer_phone text not null,
  status text not null default 'new' check (
    status in ('new', 'contacted', 'viewing', 'offer', 'negotiation', 'reserved', 'sold')
  ),
  referral_date timestamptz not null default now(),
  protected_until timestamptz not null default (now() + interval '180 days'),
  sale_price numeric(12, 2),
  commission_pct numeric(5, 2),
  commission_amount numeric(12, 2),
  commission_confirmed_at timestamptz,
  report_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_property_id_idx on public.leads (property_id);
create index leads_agent_id_idx on public.leads (agent_id);
create index leads_affiliate_link_id_idx on public.leads (affiliate_link_id);
create index leads_property_phone_idx on public.leads (property_id, buyer_phone);

create trigger set_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

alter table public.leads enable row level security;

-- No client insert policy: leads are created by the public chat-click API route
-- using the service role (the buyer submitting the form isn't authenticated).
-- Status/closing updates likewise go through service-role server actions that
-- verify agent ownership in application code, same pattern as payments/subscriptions.

create policy "leads_select_agent_or_affiliate" on public.leads
  for select using (
    agent_id = auth.uid()
    or exists (
      select 1 from public.affiliate_links al
      where al.id = leads.affiliate_link_id and al.user_id = auth.uid()
    )
  );
