// The lattice's geometry: which rulers were in office at an anchor's years, and where each bar sits. A year is a band one
// year wide on a line with no year zero, so 1 BC is followed directly by AD 1 and a bar from 4 BC to AD 6 is ten years long.
import { axisYear, D, NH, type Anchor, type Row } from "./model";

export const CHART = { width: 900, left: 8, right: 8, top: 34, lane: 22, track: 21, barHeight: 14 };
const FROM = D.timeline.from, TO = D.timeline.to;
const SCALE = (CHART.width - CHART.left - CHART.right) / (axisYear(TO) + 1 - axisYear(FROM));

/** The left edge of a year's band. */
export const yearX = (year: number): number => CHART.left + (axisYear(year) - axisYear(FROM)) * SCALE;
/** The right edge of a year's band, held inside the chart for bars that run past it. */
export const yearEndX = (year: number): number => Math.min(yearX(year) + SCALE, CHART.width - CHART.right);
export const yearMidX = (year: number): number => yearX(year) + SCALE / 2;

/** A row's years as ranges; with `alt`, a reign measured to its other reckoned end (Herod's 1 BC). */
export function rowSpans(row: Row, alt = false): number[][] {
  if (row.ranges) return row.ranges;
  if (row.points) return row.points.map((p) => [p, p]);
  return [[row.start!, alt && row.endAlt !== undefined ? row.endAlt : row.end!]];
}

export function inOffice(row: Row, year: number, alt = false): boolean {
  return rowSpans(row, alt).some(([a, b]) => a <= year && year <= b);
}

/** Every row whose years meet any of the anchor's ranges, the rows the verse itself names first. */
export function touchedBy(anchor: Anchor, only: number | null = null): Row[] {
  const spans = only === null ? anchor.years : anchor.years.filter((_, i) => i === only);
  const touched = D.timeline.rows.filter((row) => spans.some((s) => rowSpans(row, s.alt).some(([a, b]) => a <= s.to && s.from <= b)));
  return [...touched.filter((r) => anchor.named.includes(r.id)), ...touched.filter((r) => !anchor.named.includes(r.id))];
}

export type Placed = { row: Row; y: number; kind: "fixed" | "reckoned"; labelX: number; labelInside: boolean; labelEnd: boolean };
export type LaneBox = { name: string; y: number };

const LABEL_CHAR = 5.6;
/** Where a row's bars and its name sit across the drawing: inside a wide bar, else after it, else before it at the chart's right edge. */
function footprint(row: Row): { x0: number; x1: number; labelX: number; labelInside: boolean; labelEnd: boolean } {
  const spans = rowSpans(row, true);
  const start = yearX(spans[0][0]), end = yearEndX(Math.max(...spans.map((s) => s[1])));
  const text = (row.points ? 22 : 0) + row.name.length * LABEL_CHAR + 8;
  const x0 = start - (row.open ? 14 : 0), x1 = end + (row.open ? 14 : 0);
  if (!row.points && end - start > text) return { x0, x1, labelX: start + 4, labelInside: true, labelEnd: false };
  if (x1 + 4 + text <= CHART.width - CHART.right) return { x0, x1: x1 + 4 + text, labelX: x1 + 4, labelInside: false, labelEnd: false };
  return { x0: x0 - 4 - text, x1, labelX: x0 - 4, labelInside: false, labelEnd: true };
}

/** Rows packed into tracks inside their lane: a row takes the first track whose last bar and name end before its own begin. */
export function lattice(): { placed: Placed[]; lanes: LaneBox[]; height: number } {
  const placed: Placed[] = [], lanes: LaneBox[] = [];
  let y = CHART.top;
  for (const lane of D.timeline.lanes) {
    lanes.push({ name: lane, y });
    y += CHART.lane;
    const ends: number[] = [];
    for (const row of D.timeline.rows.filter((r) => r.lane === lane)) {
      const f = footprint(row);
      let track = ends.findIndex((last) => last + 6 < f.x0);
      if (track < 0) { track = ends.length; ends.push(f.x1); } else ends[track] = f.x1;
      placed.push({ row, y: y + track * CHART.track, kind: NH.kinds[row.id] ?? "reckoned", labelX: f.labelX, labelInside: f.labelInside, labelEnd: f.labelEnd });
    }
    y += Math.max(1, ends.length) * CHART.track + 6;
  }
  return { placed, lanes, height: y + 4 };
}

/** The axis's labelled years: every twenty years, with the turn of the era marked. */
export const AXIS_YEARS = [-60, -40, -20, 1, 20, 40, 60];
