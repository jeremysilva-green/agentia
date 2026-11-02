-- Lifetime free tries of "Textos Dinámicos" for agents without a paid plan
-- (2, enforced by the caller via p_limit so the number lives in one place:
-- lib/plans.ts). Same atomic pattern as try_charge_free_enhance; purely
-- additive, separate counter so it never mixes with the AI-enhancer tries.
alter table public.agent_ai_credits
  add column free_motion_tries_used int not null default 0;

create or replace function public.try_charge_free_motion(p_agent_id uuid, p_limit int)
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
     set free_motion_tries_used = free_motion_tries_used + 1,
         updated_at = now()
   where agent_id = p_agent_id
     and free_motion_tries_used < p_limit
  returning free_motion_tries_used into v_used;

  return v_used is not null;
end;
$$;

create or replace function public.refund_free_motion(p_agent_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.agent_ai_credits
     set free_motion_tries_used = greatest(free_motion_tries_used - 1, 0),
         updated_at = now()
   where agent_id = p_agent_id;
$$;

revoke execute on function public.try_charge_free_motion(uuid, int) from public, anon, authenticated;
revoke execute on function public.refund_free_motion(uuid) from public, anon, authenticated;
