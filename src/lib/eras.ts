import { Hourglass } from "lucide-react";
import { PROPHET_ERAS, type ProphetEra } from "@/lib/prophet-eras";

/**
 * The era bands shared by the three "who served" guides (Prophets through time, Rulers through time, The apostles) and
 * the ruler pages, so the prophets river and the rulers ribbon use one set of bands (Research/People/PRESENTATION.md
 * §2.5). The names, dates, colours and icons are the prophets' eras (src/lib/prophet-eras.ts); this file adds the
 * years each band covers on a time scale, and the quiet centuries between the Testaments.
 *
 * Years are BC as positive numbers and AD as negative numbers, as in the ruler data (src/data/people-pages/types.ts).
 * A `compressed` era is drawn narrower than its length (four centuries with no ruler of God's people need little room).
 */
export interface Era extends ProphetEra {
  from: number;
  to: number;
  compressed?: boolean;
  /** A compressed era's last years drawn at full scale (Herod's reign, just before the New Testament). */
  tail?: number;
  /** Full-scale years drawn this many times wider (a crowded era: the Herods and Rome). */
  stretch?: number;
}

/** Where each era starts and ends on the scale. The bands touch, so every year falls in one. */
const YEARS: Record<string, [number, number]> = {
  "Egypt and Wilderness": [1450, 1400],
  Judges: [1400, 1050],
  "United Monarchy": [1050, 931],
  "Divided Monarchy": [931, 586],
  "Exile and Return": [586, 430],
  "New Testament": [6, -100],
};

const BETWEEN: Era = { id: "Between the Testaments", label: "Between the Testaments", dates: "430–5 BC", told: "", tone: "apocrypha", icon: Hourglass, from: 430, to: 6, compressed: true };

export const ERAS: Era[] = PROPHET_ERAS.flatMap((era) => {
  const [from, to] = YEARS[era.id] ?? [0, 0];
  const band: Era = { ...era, from, to };
  return era.id === "New Testament" ? [BETWEEN, band] : [band];
});

/** Width given to a compressed era, in years of the ordinary scale. */
const COMPRESSED_YEARS = 70;

/** "c. 911–870 BC", "AD 26–36", "37 BC – AD 4": a span of years, BC positive and AD negative. */
export function formatYears(from: number, to: number, approx = false): string {
  const prefix = approx ? "c. " : "";
  if (from > 0 && to > 0) return from === to ? `${prefix}${from} BC` : `${prefix}${from}–${to} BC`;
  if (from <= 0 && to <= 0) return from === to ? `${prefix}AD ${-from}` : `${prefix}AD ${-from}–${-to}`;
  return `${prefix}${from} BC – AD ${-to}`;
}

export interface TimeScale {
  /** Position of a year (BC positive) between 0 and `width`. */
  x: (year: number) => number;
  width: number;
  /** Each era's band on this scale. */
  bands: (Era & { x0: number; x1: number })[];
}

/**
 * A piecewise time scale over the eras: each era is as wide as its years, except compressed ones. `first` and `last`
 * trim (or stretch) the outer bands to the years shown; years beyond them sit at the edges.
 */
export function eraScale(width: number, first = ERAS[0].from, last = ERAS[ERAS.length - 1].to, eras: Era[] = ERAS): TimeScale {
  const shown = eras.filter((era) => era.to < first && era.from > last);
  const segments = shown.map((era, i) => ({ ...era, from: i === 0 ? first : era.from, to: i === shown.length - 1 ? last : shown[i + 1].from }));
  // Each segment: a squeezed part (compressed eras) then a full-scale part (`tail` years, or the whole era), times `stretch`.
  const parts = segments.map((s) => {
    const years = Math.max(1, s.from - s.to), stretch = s.stretch ?? 1;
    if (!s.compressed) return { squeezedYears: 0, squeezed: 0, full: years * stretch, years };
    const tail = Math.min(s.tail ?? 0, years);
    return { squeezedYears: years - tail, squeezed: Math.min(COMPRESSED_YEARS, years - tail), full: tail * stretch, years };
  });
  const weights = parts.map((p) => p.squeezed + p.full);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const starts = weights.map((_, i) => weights.slice(0, i).reduce((a, b) => a + b, 0));
  const x = (year: number) => {
    if (!segments.length) return 0;
    if (year >= segments[0].from) return 0;
    if (year <= segments[segments.length - 1].to) return width;
    const index = segments.findIndex((s) => year <= s.from && year >= s.to);
    const s = segments[index], p = parts[index], into = s.from - year;
    const at = into <= p.squeezedYears ? (p.squeezedYears ? (into / p.squeezedYears) * p.squeezed : 0)
      : p.squeezed + ((into - p.squeezedYears) / Math.max(1, p.years - p.squeezedYears)) * p.full;
    return ((starts[index] + at) / total) * width;
  };
  return { x, width, bands: segments.map((s) => ({ ...s, x0: x(s.from), x1: x(s.to) })) };
}
