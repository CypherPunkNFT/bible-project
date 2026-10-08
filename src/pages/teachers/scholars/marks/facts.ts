// Small read-outs about a scholar that several Scholars sections print the same way.
import type { Era, ScholarsData, Scholar } from "@/data/teachers/pages-types";

export const NOW = 2026;
/** "c. 37–c. 100" or "1822–1890". */
export const years = (s: Scholar) => (s.circa ? `c. ${s.born}–c. ${s.died}` : `${s.born}–${s.died}`);
/** "about 63 years" or "68 years". */
export const lived = (s: Scholar) => `${s.circa ? "about " : ""}${s.died - s.born} years`;
export const isUsed = (s: Scholar) => s.site?.status === "in-use";
export const surname = (s: Scholar) => s.short.split(" ").slice(-1)[0];
/** How often the site names them, all areas together (a relative weight). */
export const weight = (s: Scholar) => Object.values(s.mentions).reduce((a, n) => a + n, 0);
export const byBirth = (list: Scholar[]) => [...list].sort((a, b) => a.born - b.born);

/** "The Middle Ages (500–1500)" → ["Middle Ages", "500–1500"]. */
export function eraParts(data: ScholarsData, era: Era): [string, string] {
  const label = data.eras[era];
  const m = label.match(/^(?:The )?(.+?) \((.+)\)$/);
  return m ? [m[1][0].toUpperCase() + m[1].slice(1), m[2]] : [label, ""];
}

/** A year as a percentage along the line from year 0 to today. */
export const yearPct = (year: number) => `${(Math.max(0, Math.min(NOW, year)) / NOW * 100).toFixed(3)}%`;
