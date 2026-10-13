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

// Paraguayan full names commonly carry 3-4 given/family names (e.g. "Matías
// Daniel Meza Oacompo"), which overflows compact card layouts sized for a
// first+last name pair. Keeps only the first two words — the full name is
// still shown wherever there's room for it (profile pages, image alt text).
export function formatShortName(fullName: string): string {
  const words = fullName.trim().split(/\s+/);
  return words.slice(0, 2).join(" ");
}
