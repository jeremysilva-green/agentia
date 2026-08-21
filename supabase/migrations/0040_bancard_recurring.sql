-- Direct-Bancard recurring billing support, parallel to the existing
-- Pagopar-based recurring flow (left untouched — see chargeSubscription.ts
-- and the pagopar-* edge functions).
--
-- bancard_alias_token: the persistent token Bancard returns once a card is
-- tokenized via the Cards.createForm widget + confirm webhook, reused on
-- every subsequent single_buy call to charge without re-prompting for card
-- details. Distinct from Pagopar's model, which re-fetches a short-lived
-- alias_token per charge via listar-tarjeta instead of storing one.
alter table public.agent_profiles
  add column if not exists bancard_alias_token text;

-- Lets the webhook distinguish "this shop_process_id was a real purchase"
-- from "this shop_process_id was a card-tokenization request" when a
-- confirm payload comes in, since both flows post to the same webhook URL.
alter table public.payments
  add column if not exists bancard_tipo text check (bancard_tipo in ('checkout', 'recurrente', 'tarjeta'));
