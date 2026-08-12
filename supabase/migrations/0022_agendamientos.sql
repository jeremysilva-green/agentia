-- Weekly visit availability per agent, and the visits clients book against it
-- through the AI chat widget (see src/app/api/chat/route.ts, "book_visit"
-- tool). One agent_availability row per day the agent is open to visits;
-- one agendamientos row per visit a client actually books.

create table public.agent_availability (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agent_profiles(id) on delete cascade,
  day_of_week text not null check (day_of_week in ('lunes','martes','miercoles','jueves','viernes','sabado','domingo')),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agent_id, day_of_week)
);

create index agent_availability_agent_id_idx on public.agent_availability (agent_id);

create trigger set_updated_at before update on public.agent_availability
  for each row execute function public.set_updated_at();

alter table public.agent_availability enable row level security;

create policy "agent_availability_select_agent" on public.agent_availability
  for select using (agent_id = auth.uid());

create table public.agendamientos (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agent_profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  chat_conversation_id uuid references public.chat_conversations(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  client_name text not null,
  client_phone text not null,
  day_of_week text not null check (day_of_week in ('lunes','martes','miercoles','jueves','viernes','sabado','domingo')),
  start_time time not null,
  end_time time not null,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index agendamientos_agent_id_idx on public.agendamientos (agent_id);
create index agendamientos_property_id_idx on public.agendamientos (property_id);

create trigger set_updated_at before update on public.agendamientos
  for each row execute function public.set_updated_at();

alter table public.agendamientos enable row level security;

-- No client insert/update policy: rows are created by the public /api/chat
-- route (service role, visitor isn't authenticated) and updated by the
-- agent's own server actions (also service role, ownership pre-verified),
-- same pattern as leads and chat_conversations.

create policy "agendamientos_select_agent" on public.agendamientos
  for select using (agent_id = auth.uid());
