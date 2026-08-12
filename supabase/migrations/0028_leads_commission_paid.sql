-- commission_confirmed_at only marks when the agent closed the deal and the
-- commission amount was computed; it says nothing about whether the agent
-- has actually paid the affiliate (payment happens off-platform). Add a
-- separate timestamp the agent sets once they've paid, so the affiliate
-- panel can show a real Pagada/Pendiente status.
alter table public.leads
  add column commission_paid_at timestamptz;
