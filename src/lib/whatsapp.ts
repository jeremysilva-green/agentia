export function buildWhatsAppUrl(phone: string, message: string) {
  const digitsOnly = phone.replace(/[^\d]/g, "");
  const params = new URLSearchParams({ text: message });
  return `https://wa.me/${digitsOnly}?${params.toString()}`;
}
