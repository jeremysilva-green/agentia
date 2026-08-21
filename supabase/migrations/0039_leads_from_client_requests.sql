-- Cliente Vendedor / Cliente Comprador submissions now also register as a
-- lead in the agent's pipeline. Unlike chat-driven leads, these aren't about
-- an existing property listing (a vendedor's draft doesn't exist until
-- approved; a comprador never gets one), so property_id has to be optional
-- here. client_request_id traces the lead back to its originating
-- submission for display purposes.
alter table public.leads alter column property_id drop not null;
alter table public.leads add column if not exists client_request_id uuid references public.client_requests(id) on delete set null;
