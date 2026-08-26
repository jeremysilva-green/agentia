// Shared by any panel list that groups rows into collapsible by-month
// sections (mirrors the grouping AcuerdosList.tsx pioneered).
export function monthKey(value: string) {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(value: string) {
  const label = new Date(value).toLocaleDateString("es-PY", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function groupByMonth<T>(rows: T[], getDate: (row: T) => string) {
  const map = new Map<string, { label: string; items: T[] }>();
  for (const row of rows) {
    const key = monthKey(getDate(row));
    if (!map.has(key)) map.set(key, { label: monthLabel(getDate(row)), items: [] });
    map.get(key)!.items.push(row);
  }
  return Array.from(map.entries())
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.key.localeCompare(a.key));
}

export type MonthGroup<T> = ReturnType<typeof groupByMonth<T>>[number];
export type YearGroup<T> = { key: string; label: string; months: MonthGroup<T>[] };

// Keeps the most recent RECENT_MONTHS_COUNT months as individual pills (the
// normal case — most panels never have more data than this), and rolls
// anything older into one pill per calendar year so the pill row doesn't
// grow forever as an agent's account ages. A year pill expands to reveal
// that year's own month pills, reusing the same rendering.
const RECENT_MONTHS_COUNT = 12;

export function groupByRecency<T>(rows: T[], getDate: (row: T) => string) {
  const allMonths = groupByMonth(rows, getDate);
  const recentMonths = allMonths.slice(0, RECENT_MONTHS_COUNT);
  const olderMonths = allMonths.slice(RECENT_MONTHS_COUNT);

  const yearMap = new Map<string, YearGroup<T>>();
  for (const month of olderMonths) {
    const year = month.key.slice(0, 4);
    if (!yearMap.has(year)) yearMap.set(year, { key: year, label: year, months: [] });
    yearMap.get(year)!.months.push(month);
  }
  const years = Array.from(yearMap.values()).sort((a, b) => b.key.localeCompare(a.key));

  return { recentMonths, years };
}
