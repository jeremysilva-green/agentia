-- /api/chat has no auth — a visitor is only identified by a client-supplied
-- visitorId, which anyone can regenerate per request. This limits actual
-- abuse (scripted/rapid requests) by IP, independent of visitorId, using
-- the same atomic-counter pattern already proven here for invoice numbers
-- (increment_invoice_number). Fixed window: resets the counter once
-- window_start is older than the caller-supplied window.
create table public.chat_rate_limits (
  ip text primary key,
  window_start timestamptz not null default now(),
  request_count integer not null default 0
);

alter table public.chat_rate_limits enable row level security;
-- No policies — this table is only ever touched by the service role from
-- within the /api/chat route itself, never read/written client-side.

create or replace function public.check_chat_rate_limit(
  p_ip text,
  p_max_requests integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed boolean;
begin
  insert into public.chat_rate_limits (ip, window_start, request_count)
  values (p_ip, now(), 1)
  on conflict (ip) do update
  set
    request_count = case
      when public.chat_rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
        then 1
      else public.chat_rate_limits.request_count + 1
    end,
    window_start = case
      when public.chat_rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
        then now()
      else public.chat_rate_limits.window_start
    end
  returning (request_count <= p_max_requests) into allowed;

  return allowed;
end;
$$;
