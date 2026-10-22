-- Lets an agent clear notices out of their own "Avisos" inbox. The
-- append-only trigger added in 0068 only guards UPDATE (so a notice's
-- content can't be quietly rewritten after the fact) — it never touched
-- DELETE, and no delete policy existed at all until now.
create policy "mls_notices_delete_own" on public.mls_notices
  for delete using (recipient_user_id = auth.uid());
