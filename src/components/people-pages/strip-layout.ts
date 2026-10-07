import type { RulerSummary } from "@/lib/people-pages-index";

/**
 * Reigns as bars on a time line, for the ruler page's succession strip and the Rulers guide's ribbon. Positions are
 * percentages (0–100) of the drawing's width, so the bars can be plain links laid over the frame. Reigns that overlap
 * in one lane (co-regencies, rival kings) take a second track rather than covering each other.
 */
export interface StripBar {
  ruler: RulerSummary;
  lane: string;
  track: number;
  x0: number;
  x1: number;
  /** Placed in story order, not by years (Scripture gives no years BC). */
  undated?: boolean;
}

export interface StripLayout {
  bars: StripBar[];
  /** Lanes in drawing order, each with how many tracks it needs. */
  lanes: { id: string; tracks: number }[];
}

/**
 * `x` maps a year (BC positive) to 0–100. Rulers without dates are left out (the guide lists them below the chart).
 * `minWidth` keeps a seven-day reign visible.
 */
export function layoutStrip(rulers: RulerSummary[], laneOf: (r: RulerSummary) => string, laneOrder: string[], x: (year: number) => number, minWidth = 0.5): StripLayout {
  const dated = rulers.filter((r) => r.dates).sort((a, b) => b.dates!.from - a.dates!.from || a.order - b.order);
  const ends = new Map<string, number[]>();
  const bars: StripBar[] = [];
  for (const ruler of dated) {
    const lane = laneOf(ruler);
    const x0 = x(ruler.dates!.from);
    const x1 = Math.max(x(ruler.dates!.to), x0 + minWidth);
    const tracks = ends.get(lane) ?? [];
    // A reign that starts the year another ends shares its track: Thiele's years overlap by one at each accession.
    let track = tracks.findIndex((end) => end <= x0 + 0.05);
    if (track === -1) { track = tracks.length; tracks.push(x1); } else tracks[track] = x1;
    ends.set(lane, tracks);
    bars.push({ ruler, lane, track, x0, x1 });
  }
  const lanes = laneOrder.filter((id) => ends.has(id)).map((id) => ({ id, tracks: ends.get(id)!.length }));
  return { bars, lanes };
}

/**
 * Rulers with no years BC (the judges) placed in story order after the last dated bar of their lane, up to `end`:
 * each as wide as the years Scripture gives (`fallbackYears` where it gives none). Positions in the same units as x.
 */
export function placeUndated(layout: StripLayout, rulers: RulerSummary[], laneOf: (r: RulerSummary) => string, start: (lane: string) => number, end: number, fallbackYears = 12, gap = 2): StripLayout {
  const undated = rulers.filter((r) => !r.dates).sort((a, b) => a.order - b.order);
  const byLane = new Map<string, RulerSummary[]>();
  for (const r of undated) byLane.set(laneOf(r), [...(byLane.get(laneOf(r)) ?? []), r]);
  const bars = [...layout.bars];
  const lanes = [...layout.lanes];
  for (const [lane, list] of byLane) {
    const dated = bars.filter((b) => b.lane === lane);
    const from = Math.max(start(lane), ...dated.map((b) => b.x1 + gap));
    const total = list.reduce((sum, r) => sum + (r.years ?? fallbackYears), 0);
    const room = Math.max(0, end - from - gap * list.length);
    let x = from;
    for (const ruler of list) {
      const width = (room * (ruler.years ?? fallbackYears)) / total;
      bars.push({ ruler, lane, track: 0, x0: x, x1: x + width, undated: true });
      x += width + gap;
    }
    if (!lanes.some((l) => l.id === lane)) lanes.push({ id: lane, tracks: 1 });
  }
  return { bars, lanes };
}

/** A linear year scale over a window [earliest, latest] (BC positive), to 0–100. */
export const linearYears = (earliest: number, latest: number) => (year: number) => ((earliest - year) / Math.max(1, earliest - latest)) * 100;

/** Round-numbered ticks (about eight) across a window of years. */
export function yearTicks(earliest: number, latest: number): number[] {
  const span = Math.max(1, earliest - latest);
  const step = [5, 10, 20, 25, 50, 100, 200].find((s) => span / s <= 9) ?? 500;
  const ticks: number[] = [];
  for (let t = Math.floor(earliest / step) * step; t >= latest; t -= step) if (t <= earliest) ticks.push(t);
  return ticks;
}
