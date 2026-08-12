-- short_links had RLS enabled with zero policies, which silently blocks ALL
-- access for non-service-role clients — including the affiliate's own read
-- in getAffiliateLinksForUser (src/lib/data/affiliateLinks.ts), which uses
-- the request-scoped (RLS-enforced) client, not the service role. That's
-- why a short code was always created successfully (writes go through the
-- service role in generateAffiliateLink) but never showed up: the read
-- query was getting zero rows back every time.

create policy "short_links_select_own" on public.short_links
  for select using (user_id = auth.uid());
