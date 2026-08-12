-- AI chat conversations between a site visitor and the property's agent
-- persona. One row per (property, visitor); the transcript accumulates as
-- the conversation continues. Once the buyer shares their name and phone,
-- the chat is linked to the same `leads` row the rest of the referral
-- system uses (see src/lib/leads/referralProtection.ts).

create table public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  agent_id uuid not null references public.agent_profiles(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  visitor_id text not null,
  messages jsonb not null default '[]'::jsonb,
  summary text,
  buyer_name text,
  buyer_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, visitor_id)
);

create index chat_conversations_agent_id_idx on public.chat_conversations (agent_id);
create index chat_conversations_property_id_idx on public.chat_conversations (property_id);

create trigger set_updated_at before update on public.chat_conversations
  for each row execute function public.set_updated_at();

alter table public.chat_conversations enable row level security;

-- No client insert/update policy: the public /api/chat route uses the
-- service role (the visitor isn't authenticated), same pattern as leads.

create policy "chat_conversations_select_agent" on public.chat_conversations
  for select using (agent_id = auth.uid());
