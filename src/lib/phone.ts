// A truthy string isn't enough — confirmed via testing that a forced tool
// call with no real contact info in context makes the model fill in a
// literal "<UNKNOWN>" placeholder rather than refuse. Require an actual
// phone-shaped value (at least 6 digits) so that never becomes a real lead.
export function isPlausiblePhone(value: string | undefined): value is string {
  return typeof value === "string" && value.replace(/\D/g, "").length >= 6;
}
