// The track of 01 Cords and nails: years BC across one line (earlier on the left), Scripture's cords above it, the ground's
// bars below it, the two outside records as nails through both. Pure arithmetic on the generated data, so the tests can
// check every position; the drawing only reads what this returns.
import { D, XS, type Exodus, type Hang, type Stay } from "./model";

export const TRACK = { width: 1000, left: 18, right: 18, line: 236, top: 28, lane: 30, laneTop: 272 };
const CHAR_WIDTH = 5.3;

/** The x of a year BC: 1900 at the left edge, the drawn end (850) at the right. */
export function x(year: number): number {
  const { from, drawnTo } = XS.chart;
  return TRACK.left + ((from - year) / (from - drawnTo)) * (TRACK.width - TRACK.left - TRACK.right);
}

/** Years to drawing units, for lengths laid at the track's scale (Jephthah's loose cord). */
export const unitsFor = (years: number): number => x(XS.chart.from - years) - x(XS.chart.from);

/** The axis ticks: every century from the chart's start to its drawn end. */
export function ticks(): number[] {
  const out: number[] = [];
  for (let year = XS.chart.from; year >= XS.chart.drawnTo; year -= 100) out.push(year);
  return out;
}

export type PlacedBar = { id: string; name: string; note: string; spans: number[][]; lane: number; nail: boolean; labelX: number };

/** Ground bars in lanes, greedily, so no bar or its label overlaps another in the same lane. */
export function placeBars(): { bars: PlacedBar[]; nails: PlacedBar[]; lanes: number } {
  const ends: number[] = [];
  const bars: PlacedBar[] = [];
  for (const bar of [...D.timeline.ground].sort((a, b) => b.start - a.start)) {
    const spans = XS.bars[bar.id] ?? [[bar.start, bar.end]];
    const left = x(spans[0][0]);
    const right = Math.max(x(spans[spans.length - 1][1]), left + bar.name.length * CHAR_WIDTH) + 10;
    let lane = ends.findIndex((end) => end <= left);
    if (lane < 0) { lane = ends.length; ends.push(0); }
    ends[lane] = right;
    bars.push({ id: bar.id, name: bar.name, note: bar.note, spans, lane, nail: false, labelX: left });
  }
  const nails = D.timeline.fixed.map((n) => ({ id: n.id, name: n.name, note: n.note, spans: XS.bars[n.id] ?? [[n.start, n.end]], lane: 0, nail: true, labelX: x(n.start) }));
  return { bars, nails, lanes: ends.length };
}

export const laneY = (lane: number): number => TRACK.laneTop + lane * TRACK.lane;
export const trackHeight = (lanes: number): number => laneY(lanes) + 46;

export type Relation = "before" | "within" | "after";

/** Where a year falls against a range BC: before it began, within it, or after it ended. */
export function relation(year: number, [start, end]: number[]): Relation {
  if (year > start) return "before";
  if (year < end) return "after";
  return "within";
}

export const RELATION_WORD: Record<Relation, string> = { before: "comes before", within: "falls within", after: "comes after" };

/** The 430 years hung from one exodus date under one reading of Exodus 12:40. */
export const hangOf = (exodus: Exodus, stay: Stay): Hang => XS.cords.hangs.find((h) => h.exodus === exodus && h.reading === stay)!;

/** How a strand is drawn: chosen (solid), set aside (dashed, faint), or open (nothing chosen yet; all drawn alike). */
export type Weight = "chosen" | "aside" | "open";
export function weightOf<T>(value: T, chosen: T | null): Weight {
  if (chosen === null) return "open";
  return value === chosen ? "chosen" : "aside";
}

/** A cord as a gentle sag between two years at height y: a rope hung between two pegs, not a ruled line. */
export function cordPath(fromYear: number, toYear: number, y: number): string {
  const a = x(fromYear);
  const b = x(toYear);
  const sag = Math.min(9, Math.abs(b - a) / 40);
  return `M${a.toFixed(1)} ${y}Q${((a + b) / 2).toFixed(1)} ${(y + sag).toFixed(1)} ${b.toFixed(1)} ${y}`;
}

/** Evenly spaced knots along the measure cord: schematic, one per generation the record names. */
export function knots(fromYear: number, toYear: number, count: number): number[] {
  if (count < 1) return [];
  const out: number[] = [];
  for (let i = 1; i <= count; i++) out.push(x(fromYear + ((toYear - fromYear) * i) / count));
  return out;
}

export type LadderRow = { years: number[]; label: string; kind: "cord" | "ground" | "nail" };

/** Every cord end, bar and nail in year order (oldest first): the phone's stand-in for the track. */
export function ladder(exodus: Exodus | null, stay: Stay | null): LadderRow[] {
  const rows: LadderRow[] = [];
  for (const which of ["count", "measure"] as Exodus[]) {
    if (exodus && exodus !== which) continue;
    const view = D.debates[0].views[which === "count" ? 0 : 1];
    rows.push({ years: [XS.cords.exodus[which]], label: `Exodus: ${view.name}`, kind: "cord" });
    const begins = view.name.split(",")[0].toLowerCase();
    for (const reading of ["egypt", "canaan"] as Stay[]) {
      if (stay && stay !== reading) continue;
      const hang = hangOf(which, reading);
      rows.push({ years: [hang.egypt[0]], label: reading === "egypt" ? `430 years in Egypt: the stay begins (${begins})` : `About 215 years in Egypt: the stay begins (${begins})`, kind: "cord" });
    }
  }
  for (const bar of D.timeline.ground) for (const span of XS.bars[bar.id] ?? []) rows.push({ years: span, label: bar.name, kind: "ground" });
  for (const nail of D.timeline.fixed) for (const span of XS.bars[nail.id] ?? [[nail.start, nail.end]]) rows.push({ years: span, label: nail.name, kind: "nail" });
  return rows.sort((a, b) => b.years[0] - a.years[0]);
}
