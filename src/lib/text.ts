// Agents/users type free-text fields (city, search queries) without
// necessarily matching accented canonical spelling (e.g. "Asuncion" vs
// "Asunción"). Comparing on normalized (accent- and case-stripped) strings
// avoids silently dropping matches over a missing tilde.
export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
