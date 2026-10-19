// The arithmetic of "Through time" (approved mock-up: js/lanes.js): the lanes and their dots, how an opened lane stacks
// its dots into columns as tall as the chart, and that lane's own fitted time axis.
import type { MsRecord } from "@/lib/manuscripts";
import { formatNumber, isDated, kindOf, mid, type Kind } from "./model";

export const LANES: [string, string][] = [["hebrew", "Hebrew Bible"], ["dss", "Dead Sea Scrolls"], ["samaritan", "Samaritan"], ["lxx", "Greek Old Testament"], ["papyrus", "NT papyri"],
  ["majuscule", "NT majuscules"], ["minuscule", "NT minuscules"], ["lectionary", "NT lectionaries"], ["latin", "Latin"],
  ["syriac", "Syriac"], ["coptic", "Coptic"], ["gothic", "Gothic"], ["armenian", "Armenian"], ["georgian", "Georgian"], ["geez", "Ge'ez"],
  ["arabic", "Arabic"], ["slavonic", "Church Slavonic"]];
export const Y0 = -250, Y1 = 1500, LABEL = 206, RIGHT = 54, TOP = 30, LANE = 36, FULL = LANES.length * LANE;
const COL_WIDTHS = [6.5, 8, 10, 12, 14, 16, 18, 20, 22], STEP_TARGET = 10, MAX_STEP = 14;
const BIN = 25, THIN = 3, THIN_W = 14, GAP_W = 18, TICK_SPACE = 46;

type Dated = MsRecord & { e: number; l: number };
export interface Dot {
  r: Dated; v: number; lane: number; x: number; yc: number; x0: number; x1: number;
  xo: number; xo0: number; xo1: number; xs: number; ye: number; cx?: number; el?: SVGCircleElement;
}
export interface Axis { map: (year: number) => number; ticks: { y: number; x: number }[]; breaks: { x0: number; x1: number; a: number; b: number }[] }
export interface Lane {
  key: string; label: string; i: number; all: MsRecord[]; dated: Dated[]; later: number; kind: Kind; h: number;
  dots: Dot[]; axis: Axis | null; rOpen: number; g?: SVGGElement;
}

/** A stable pseudo-random number in [0, 1) from a string (FNV-1a), so the dots never jump between visits. */
export const hash = (text: string) => { let h = 2166136261; for (const ch of text) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; };
export const ease = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function lanesData(records: MsRecord[]): Lane[] {
  return LANES.map(([key, label], i) => {
    const all = records.filter((r) => r.L.includes(key));
    const dated = all.filter(isDated);
    return { key, label, i, all, dated, later: dated.filter((r) => mid(r) > Y1).length, kind: kindOf(key), h: LANE, dots: [], axis: null, rOpen: 2.6 };
  });
}

/** What the small number under a lane's name says, in words rather than a bare fraction. */
export function countText(lane: Lane): string {
  if (!lane.all.length) return "no open records yet";
  if (lane.dated.length === lane.all.length) return lane.all.length === 1 ? "1 copy, dated" : `${formatNumber(lane.all.length)} copies, all dated`;
  return `${formatNumber(lane.dated.length)} dated of ${formatNumber(lane.all.length)}`;
}

/** The open lane's layout: dots binned into narrow columns and stacked outward from the middle line, as tall as the chart.
 *  Column width is the narrowest whose stacks, at a comfortable spacing, fill three quarters of the height. */
export function stack(lane: Lane): void {
  const room = FULL - 56;
  const layout = (width: number) => {
    const byCol = new Map<number, number>();
    let deepest = 0;
    const placed = lane.dots.map((d) => {
      const col = Math.round(d.xo / width), k = byCol.get(col) ?? 0;
      byCol.set(col, k + 1);
      const offset = k ? (k % 2 ? 1 : -1) * Math.ceil(k / 2) : 0;
      deepest = Math.max(deepest, Math.abs(offset));
      return { d, offset, xs: col * width };
    });
    return { placed, deepest, width };
  };
  let best = layout(COL_WIDTHS[0]);
  for (const width of COL_WIDTHS) {
    best = layout(width);
    if (2 * best.deepest * STEP_TARGET >= room * 0.75) break;
  }
  const step = Math.min(MAX_STEP, room / Math.max(1, 2 * best.deepest));
  lane.rOpen = Math.max(2.6, Math.min(4.4, step * 0.42, best.width * 0.42));
  // Centre each column on the mean position of its own copies, so a column never drifts into a cut-out stretch.
  const centres = new Map<number, { sum: number; n: number }>();
  for (const { d, xs } of best.placed) { const c = centres.get(xs) ?? { sum: 0, n: 0 }; c.sum += d.xo; c.n++; centres.set(xs, c); }
  for (const { d, offset, xs } of best.placed) { const c = centres.get(xs)!; d.ye = offset * step; d.xs = c.sum / c.n; }
}

interface Segment { a: number; b: number; n: number; gap: boolean; x0: number; x1: number }

/** The open lane's own time axis: only the years its copies cover. Empty 25-year stretches fold into a narrow break;
 *  stretches with one to three copies get a narrow strip; the rest of the width goes to the busy stretches. */
export function fitAxis(lane: Lane, plot: number): Axis | null {
  if (!lane.dots.length) return null;
  const years = lane.dots.map((d) => d.v);
  const a0 = Math.floor(Math.min(...years) / BIN) * BIN, a1 = Math.floor(Math.max(...years) / BIN) * BIN + BIN;
  const bins: { a: number; b: number; n: number }[] = [];
  for (let y = a0; y < a1; y += BIN) bins.push({ a: y, b: y + BIN, n: 0 });
  for (const v of years) bins[Math.min(bins.length - 1, Math.floor((v - a0) / BIN))].n++;
  const segs: Segment[] = [];
  for (const bin of bins) {
    const last = segs.at(-1);
    if (bin.n) segs.push({ ...bin, gap: false, x0: 0, x1: 0 });
    else if (last?.gap) last.b = bin.b;
    else segs.push({ ...bin, gap: true, x0: 0, x1: 0 });
  }
  const dense = segs.filter((s) => !s.gap && s.n > THIN), thin = segs.filter((s) => !s.gap && s.n <= THIN), gaps = segs.filter((s) => s.gap);
  let thinW = THIN_W, gapW = GAP_W;
  if (!dense.length) thinW = (plot - gaps.length * gapW) / thin.length;
  else {
    const fixed = thin.length * thinW + gaps.length * gapW;
    if (fixed > plot * 0.45) { const k = (plot * 0.45) / fixed; thinW *= k; gapW *= k; }
  }
  const weight = (s: Segment) => s.n ** 0.75, total = dense.reduce((sum, s) => sum + weight(s), 0);
  const free = plot - thin.length * thinW - gaps.length * gapW;
  let x = LABEL;
  for (const s of segs) { s.x0 = x; x += s.gap ? gapW : s.n > THIN ? (free * weight(s)) / total : thinW; s.x1 = x; }
  const map = (year: number) => {
    if (year <= segs[0].a) return segs[0].x0;
    const s = segs.find((seg) => year < seg.b) ?? segs[segs.length - 1];
    return s.x0 + ((Math.min(year, s.b) - s.a) / (s.b - s.a)) * (s.x1 - s.x0);
  };
  const every = a1 - a0 > 600 ? 100 : 50, candidates: number[] = [];
  segs.forEach((s, n) => {
    if (s.gap) return;
    if (n === 0 || segs[n - 1].gap) candidates.push(s.a);
    for (let y = Math.ceil(s.a / every) * every; y < s.b; y += every) candidates.push(y);
  });
  candidates.push(segs[segs.length - 1].b);
  const ticks: { y: number; x: number }[] = [];
  let last = -Infinity;
  for (const y of [...new Set(candidates)].sort((a, b) => a - b)) {
    const tx = map(y);
    if (tx - last >= TICK_SPACE) { ticks.push({ y, x: tx }); last = tx; }
  }
  return { map, ticks, breaks: gaps.map((s) => ({ x0: s.x0, x1: s.x1, a: s.a, b: s.b })) };
}
