-- Real finding: the marketing-video feature's "Pro/Fundador only" gate only
-- ever existed at the UI layer (the button was hidden). uploadMarketingVideo
-- runs entirely client-side (direct Supabase calls with the agent's own
-- session, same pattern as PropertyPhotoManager's photo uploads), and the
-- existing RLS policies only checked agent_id = auth.uid() — nothing about
-- plan or payment status. Any authenticated agent could bypass the hidden
-- button (devtools, a raw REST call) and generate/upload a video regardless
-- of plan, or while their subscription is still "pending" (payment not yet
-- confirmed — see selectPlan() in actions/subscription.ts). This closes that
-- gap at the database layer, which can't be bypassed from the client, same
-- principle the AI-enhance API route already follows ("never trust the
-- page-level gate alone").
create or replace function public.agent_has_active_pro_plan(p_agent_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions
    where agent_id = p_agent_id
      and plan in ('pro', 'fundador')
      and status in ('active', 'trialing')
    order by created_at desc
    limit 1
  );
$$;

drop policy "marketing_videos_insert_own" on public.marketing_videos;
create policy "marketing_videos_insert_own" on public.marketing_videos
  for insert with check (agent_id = auth.uid() and public.agent_has_active_pro_plan(agent_id));

drop policy "marketing_videos_bucket_owner_insert" on storage.objects;
create policy "marketing_videos_bucket_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'marketing-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.agent_has_active_pro_plan(auth.uid())
  );
