// Confirmed directly (Node + target browsers use the same ICU data for
// es-PY): Intl.NumberFormat already produces exactly "Gs. 1.250.000.000"
// and "USD 185.000" with maximumFractionDigits added — no custom formatter
// needed, same convention used project-wide for prices (just missing this
// one option everywhere else, since whole-currency amounts never carry
// cents in this app).
export function formatListingPrice(price: number, currency: string): string {
  return new Intl.NumberFormat("es-PY", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);
}

export function formatListingTypeLabel(listingType: "rent" | "sale"): string {
  return listingType === "sale" ? "VENTA" : "ALQUILER";
}
