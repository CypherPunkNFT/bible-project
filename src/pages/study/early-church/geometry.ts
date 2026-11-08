// The case's chart: years 64 to 451 across, one row per drawer, and the chosen drawer opened into one line per record. A single year
// drawn as an estimate ("about 96") is a soft patch a few years wide, never a point; a century in words is its thirds, as the
// build states. Pure numbers, so the tests can measure them.
import { D, EC, FIRST, LAST, type Alternative, type EcRecord, type Part, type Span } from "./model";

export const CHART = { width: 1000, left: 46, right: 24, top: 40, row: 24, line: 19, bottom: 34 };
const SOFT = 3;

export const x = (year: number): number => CHART.left + ((year - FIRST) / (LAST - FIRST)) * (CHART.width - CHART.left - CHART.right);

export type Bar = { from: number; to: number; soft: boolean };
export type Placed = { record: EcRecord; span: Span; bars: Bar[]; alternatives: Alternative[]; y: number };
export type Row = { part: Part; y: number; height: number; open: boolean; bars: Bar[]; records: Placed[] };

/** The bars a span draws, clamped to the case. */
export function barsOf(span: Span | undefined): Bar[] {
  if (!span) return [];
  const pieces = span.pieces ?? [[span.from, span.to]];
  const soft = span.kind === "about" || span.kind === "argued" || span.kind === "unknown";
  return pieces.map(([from, to]) => {
    const pad = soft && from === to ? SOFT : 0;
    return { from: Math.max(FIRST, from - pad), to: Math.min(LAST, to + pad), soft };
  });
}

/** Every row of the chart, with the chosen drawer opened. */
export function caseRows(openId: string): { rows: Row[]; height: number } {
  let y = CHART.top;
  const rows = D.parts.map((part) => {
    const open = part.id === openId;
    const records = part.records.map((record, i) => ({
      record, span: EC.spans[record.id], bars: barsOf(EC.spans[record.id]), alternatives: EC.alternatives[record.id] ?? [], y: y + 14 + i * CHART.line,
    }));
    const height = open ? 14 + records.length * CHART.line + 8 : CHART.row;
    const row = { part, y, height, open, bars: records.flatMap((r) => r.bars), records };
    y += height;
    return row;
  });
  return { rows, height: y + CHART.bottom };
}

/** The first and last year a drawer's records reach, in words. */
export function drawerYears(part: Part): string {
  const spans = part.records.map((r) => EC.spans[r.id]).filter(Boolean);
  if (!spans.length) return "";
  const from = Math.min(...spans.map((s) => s.from));
  const to = Math.max(...spans.map((s) => s.to));
  return from === to ? String(from) : `${from}–${to}`;
}
