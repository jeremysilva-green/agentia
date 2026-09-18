-- QR de Cobro: affiliate's payment QR code image, shown alongside their
-- bank alias so agents can pay commissions by scanning it directly.

alter table public.profiles
  add column qr_url text;
