import { inLineOrder, type RulerSummary } from "@/lib/people-pages-index";

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
  /** Not placed by the ruler's own years (Scripture gives none): drawn dotted. */
  undated?: boolean;
}

export interface StripLayout {
  bars: StripBar[];
  /** Lanes in drawing order, each with how many tracks it needs. */
  lanes: { id: string; tracks: number }[];
}

/**
 * A ruler's years on a time line (BC positive): their own dates, or, for an undated ruler, a short span around the time
 * of the dated rulers Scripture names beside them (`near`), marked undated. Undefined for the judges, who have neither.
 */
export function timeSpan(ruler: RulerSummary, fallbackYears = 12): { from: number; to: number; undated?: boolean } | undefined {
  if (ruler.dates) return { from: ruler.dates.from, to: ruler.dates.to };
  if (ruler.near === undefined) return undefined;
  const half = (ruler.years ?? fallbackYears) / 2;
  return { from: ruler.near + half, to: ruler.near - half, undated: true };
}

/**
 * Undated rulers placed near the same rulers follow one another in their line's order instead of covering each other
 * (the Pharaohs of the oppression and of the Exodus both stand beside Moses).
 */
function spansInOrder(rulers: RulerSummary[], laneOf: (r: RulerSummary) => string) {
  const spans = new Map<string, { from: number; to: number; undated?: boolean }>();
  const previous = new Map<string, { from: number; to: number; undated?: boolean }>();
  for (const ruler of inLineOrder(rulers)) {
    let span = timeSpan(ruler);
    if (!span) continue;
    const lane = laneOf(ruler), before = previous.get(lane);
    if (span.undated && before?.undated && span.from > before.to) span = { from: before.to, to: before.to - (span.from - span.to), undated: true };
    spans.set(ruler.id, span);
    previous.set(lane, span);
  }
  return spans;
}

/** The first track of a lane where [x0, x1] covers no other bar. */
function freeTrack(bars: StripBar[], lane: string, x0: number, x1: number, slack = 0.05): number {
  for (let track = 0; ; track++) if (!bars.some((b) => b.lane === lane && b.track === track && b.x0 < x1 - slack && b.x1 > x0 + slack)) return track;
}

function laneList(bars: StripBar[], laneOrder: string[]) {
  const tracks = new Map<string, number>();
  for (const bar of bars) tracks.set(bar.lane, Math.max(tracks.get(bar.lane) ?? 0, bar.track + 1));
  const order = [...laneOrder, ...[...tracks.keys()].filter((id) => !laneOrder.includes(id))];
  return order.filter((id) => tracks.has(id)).map((id) => ({ id, tracks: tracks.get(id)! }));
}

/**
 * `x` maps a year (BC positive) to 0–100. Rulers with neither dates nor a `near` are left out (placeUndated adds them).
 * `minWidth` keeps a seven-day reign visible.
 */
export function layoutStrip(rulers: RulerSummary[], laneOf: (r: RulerSummary) => string, laneOrder: string[], x: (year: number) => number, minWidth = 0.5): StripLayout {
  const spans = spansInOrder(rulers, laneOf);
  const placed = rulers.filter((r) => spans.has(r.id)).sort((a, b) => spans.get(b.id)!.from - spans.get(a.id)!.from || a.order - b.order);
  const bars: StripBar[] = [];
  for (const ruler of placed) {
    const span = spans.get(ruler.id)!, lane = laneOf(ruler);
    const x0 = x(span.from);
    const x1 = Math.max(x(span.to), x0 + minWidth);
    // A reign that starts the year another ends shares its track: Thiele's years overlap by one at each accession.
    bars.push({ ruler, lane, track: freeTrack(bars, lane, x0, x1), x0, x1, ...(span.undated ? { undated: true } : {}) });
  }
  return { bars, lanes: laneList(bars, laneOrder) };
}

export interface UndatedOptions {
  /** Where each lane's line may begin. */
  start: (lane: string) => number;
  /** Where a run at the end of a lane may stretch to (the judges, to the end of their era); otherwise each run keeps its own width. */
  end?: (lane: string) => number | undefined;
  /** Drawing units per year, for a ruler's own length. */
  yearWidth: number;
  fallbackYears?: number;
  gap?: number;
  minWidth?: number;
}

/**
 * Rulers with no place in time at all (the judges; the Pharaoh of Joseph's day) in their line's story order, between
 * the rulers placed before and after them: a run with neighbours on both sides (or a lane `end`) shares out the room
 * between them by the years Scripture gives each (`fallbackYears` where it gives none); a run at the end of a lane
 * keeps its own lengths. Positions in the same units as the layout's.
 */
export function placeUndated(layout: StripLayout, rulers: RulerSummary[], laneOf: (r: RulerSummary) => string, options: UndatedOptions): StripLayout {
  const { start, end = () => undefined, yearWidth, fallbackYears = 12, gap = 2, minWidth = gap * 3 } = options;
  const bars = [...layout.bars];
  const laneOrder = layout.lanes.map((l) => l.id);
  const lines = new Map<string, RulerSummary[]>();
  for (const r of inLineOrder(rulers)) lines.set(laneOf(r), [...(lines.get(laneOf(r)) ?? []), r]);
  for (const [lane, line] of lines) {
    const at = (r: RulerSummary) => bars.find((b) => b.ruler.id === r.id);
    for (let i = 0; i < line.length; i++) {
      if (at(line[i])) continue;
      let j = i;
      while (j < line.length && !at(line[j])) j++;
      const run = line.slice(i, j), before = i > 0 ? at(line[i - 1]) : undefined, after = j < line.length ? at(line[j]) : undefined;
      const from = Math.max(start(lane), before ? before.x1 + gap : -Infinity);
      const until = after ? after.x0 - gap : end(lane);
      const years = run.map((r) => r.years ?? fallbackYears);
      const total = years.reduce((a, b) => a + b, 0);
      // A run that ends at a ruler placed after it (Joseph's Pharaoh before the Pharaoh of the oppression) keeps near
      // its own length and sits just before that ruler; a run to a lane's end (the judges) shares out all the room.
      const natural = total * yearWidth;
      const room = until === undefined ? natural : after ? Math.min(until - from - gap * (run.length - 1), natural * 2) : until - from - gap * (run.length - 1);
      let x = after && until !== undefined ? Math.max(from, until - room - gap * (run.length - 1)) : from;
      run.forEach((ruler, k) => {
        const width = Math.max(minWidth, (room * years[k]) / total);
        bars.push({ ruler, lane, track: freeTrack(bars, lane, x, x + width), x0: x, x1: x + width, undated: true });
        x += width + gap;
      });
      i = j - 1;
    }
  }
  return { bars, lanes: laneList(bars, laneOrder) };
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
