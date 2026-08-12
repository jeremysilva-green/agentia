export type Milestone = {
  label: string;
  labelEn: string;
} | null;

// Simple milestone thresholds — surfaced as a small badge next to the star
// rating once an agent has enough reviews to make the average meaningful.
export function getMilestone(avg: number, count: number): Milestone {
  if (count >= 10 && avg >= 4.5) return { label: "Agente Top", labelEn: "Top Agent" };
  if (count >= 3 && avg >= 4) return { label: "Recomendado", labelEn: "Recommended" };
  return null;
}
