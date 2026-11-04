// Shared by the Connections heading drawing and its mock-ups: a repeatable random source and the rows of background books,
// coloured left to right like the chart.
import type { Section } from "./geometry";

/** How many of the Bible's 66 books fall in each section, in order, so a wall reads left to right like the chart. */
const SECTION_RUN: [Section, number][] = [["history", 17], ["poetry", 5], ["prophets", 17], ["gospels", 5], ["epistles", 21], ["revelation", 1]];

/** A small repeatable random source, so a scene draws the same every time. */
export function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sectionAt = (fraction: number): Section => {
  let seen = 0;
  for (const [section, count] of SECTION_RUN) { seen += count; if (fraction * 66 < seen) return section; }
  return "revelation";
};

export interface Spine { x: number; y: number; w: number; h: number; section: Section }

/** A row of upright books from x0 to x1 standing on `base`, coloured left to right like the chart. */
export function wallRow(seed: number, x0: number, x1: number, base: number, heights: [number, number], widths: [number, number]): Spine[] {
  const next = seeded(seed);
  const row: Spine[] = [];
  for (let x = x0; x < x1; ) {
    const w = widths[0] + next() * (widths[1] - widths[0]);
    const h = heights[0] + next() * (heights[1] - heights[0]);
    if (x + w > x1) break;
    row.push({ x, y: base - h, w, h, section: sectionAt((x - x0) / (x1 - x0)) });
    x += w + 2;
  }
  return row;
}

