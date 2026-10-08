// "Where the site names them": the site areas, each scholar's relative weight in each, and the two sort orders.
import type { Scholar } from "@/data/teachers/pages-types";

/** Site areas in `mentions`, each with the tone used wherever that area is drawn. */
export const AREAS: [string, string][] = [["Letters study", "--epistles"], ["Apologetics", "--revelation"], ["Topics", "--poetry"], ["People pages", "--history"], ["Rulers", "--prophets"]];
export type SortKey = "era" | "wide";

export interface Heat {
  named: Scholar[];
  unnamed: Scholar[];
  /** The scholar's count in an area against the most-named scholar there (0–1). */
  weight: (s: Scholar, area: string) => number;
  sorted: (key: SortKey) => Scholar[];
}

export function buildHeat(scholars: Scholar[]): Heat {
  const areaMax = new Map(AREAS.map(([a]) => [a, Math.max(...scholars.map((s) => s.mentions[a] ?? 0))]));
  const weight = (s: Scholar, area: string) => (s.mentions[area] ? s.mentions[area] / (areaMax.get(area) ?? 1) : 0);
  const namedIn = (s: Scholar) => AREAS.filter(([a]) => s.mentions[a]).length;
  const total = (s: Scholar) => AREAS.reduce((t, [a]) => t + weight(s, a), 0);
  const named = scholars.filter((s) => namedIn(s));
  const byEra = [...named].sort((a, b) => a.born - b.born);
  const byWidth = [...named].sort((a, b) => namedIn(b) - namedIn(a) || total(b) - total(a) || a.born - b.born);
  return { named, unnamed: scholars.filter((s) => !namedIn(s)), weight, sorted: (key) => (key === "era" ? byEra : byWidth) };
}

/** "the Topics pages", "the Letters study": how the tooltip names an area. */
export function areaPhrase(area: string) {
  if (area === "Topics" || area === "Rulers") return `the ${area} pages`;
  return `the ${area}`;
}
