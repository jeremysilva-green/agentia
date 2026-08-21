-- RUC (Paraguayan tax ID) for agents. Nullable at the DB level since
-- existing agents don't have one on file yet; required going forward at
-- signup time via application-level validation (see agentSignupSchema).
alter table public.agent_profiles add column if not exists ruc text;
