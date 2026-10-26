-- Lifetime free AI-enhancer tries for Básico agents (3, enforced by the
-- caller via p_limit so the number lives in one place: lib/plans.ts).
-- Deliberately a separate counter from credits_remaining: that one resets
-- monthly for paid plans, free tries must never reset. Purely additive.
alter table public.agent_ai_credits
  add column free_tries_used int not null default 0;

-- Atomic, same pattern as try_charge_ai_credit: ensures the row exists, then
-- increments only while under the limit — a double-click can't overshoot it.
create or replace function public.try_charge_free_enhance(p_agent_id uuid, p_limit int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used int;
begin
  insert into public.agent_ai_credits (agent_id)
  values (p_agent_id)
  on conflict (agent_id) do nothing;

  update public.agent_ai_credits
     set free_tries_used = free_tries_used + 1,
         updated_at = now()
   where agent_id = p_agent_id
     and free_tries_used < p_limit
  returning free_tries_used into v_used;

  return v_used is not null;
end;
$$;

create or replace function public.refund_free_enhance(p_agent_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.agent_ai_credits
     set free_tries_used = greatest(free_tries_used - 1, 0),
         updated_at = now()
   where agent_id = p_agent_id;
$$;

-- Same lock-down as the other credit RPCs: only the server (service role)
-- may call these, never a client with its own session.
revoke execute on function public.try_charge_free_enhance(uuid, int) from public, anon, authenticated;
revoke execute on function public.refund_free_enhance(uuid) from public, anon, authenticated;
