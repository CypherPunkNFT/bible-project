// The landing's arc of teachers: each teacher a mark on one gentle arc of time (left = the first century with a birth,
// right = today), placed by the year they were born. Where births crowd together the marks stack above and below the
// arc without touching (ported from the mock-up's landing.js).
import type { Person } from "@/data/teachers/pages-types";
import { THIS_YEAR } from "../../shared/people";

export interface MarkPosition { id: string; x: number; y: number }
export interface ArcLayout {
  width: number;
  height: number;
  r: number;
  positions: MarkPosition[];
  arcPath: string;
  centuries: { year: number; x: number }[];
  gridTop: number;
  gridBottom: number;
  today: { x: number; y: number };
  showToday: boolean;
}

export const arcStart = (people: Person[]) => Math.floor(Math.min(...people.map((p) => p.born)) / 100) * 100;

function sizesFor(width: number) {
  const narrow = width < 560;
  const r = narrow ? 11 : width < 960 ? 15 : 18, gap = narrow ? 2 : 4;
  return { narrow, r, d: 2 * r + gap, pad: r + (narrow ? 12 : 26), amp: narrow ? 10 : 22, top: narrow ? 52 : 58, bottom: narrow ? 40 : 44 };
}

/** Offsets from the arc: each mark takes the free slot nearest the arc, above first on a tie. */
function stack(people: Person[], sx: (year: number) => number, d: number) {
  const placed: { id: string; x: number; off: number }[] = [];
  for (const p of people) {
    const x = sx(p.born), near = placed.filter((q) => Math.abs(q.x - x) < d), candidates = [0];
    for (const q of near) { const h = Math.sqrt(d * d - (q.x - x) ** 2); candidates.push(q.off + h, q.off - h); }
    candidates.sort((a, b) => Math.abs(a) - Math.abs(b) || b - a);
    const off = candidates.find((c) => near.every((q) => Math.hypot(q.x - x, q.off - c) >= d - 0.01)) ?? 0;
    placed.push({ id: p.id, x, off });
  }
  return placed;
}

export function layoutArc(people: Person[], width: number): ArcLayout {
  const s = sizesFor(width), start = arcStart(people), end = THIS_YEAR;
  const sx = (year: number) => s.pad + ((year - start) / (end - start)) * (width - 2 * s.pad);
  const lift = (x: number) => -s.amp * Math.sin(Math.PI * (x / width));
  const placed = stack(people, sx, s.d);
  const minOff = Math.min(...placed.map((q) => q.off + lift(q.x))) - s.r, maxOff = Math.max(...placed.map((q) => q.off + lift(q.x))) + s.r;
  const base = s.top - minOff, height = Math.ceil(base + maxOff + s.bottom);
  let arcPath = "";
  for (let i = 0; i <= 48; i++) { const x = (width * i) / 48; arcPath += `${i ? "L" : "M"}${x.toFixed(1)} ${(base + lift(x)).toFixed(1)}`; }
  const centuries = [];
  for (let year = start; year <= end; year += 100) centuries.push({ year, x: sx(year) });
  return {
    width, height, r: s.r, arcPath, centuries,
    positions: placed.map((q) => ({ id: q.id, x: q.x, y: base + lift(q.x) + q.off })),
    gridTop: s.top - 22, gridBottom: height - 26,
    today: { x: sx(end), y: base + lift(sx(end)) },
    showToday: !s.narrow,
  };
}
