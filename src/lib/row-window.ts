// Row windowing for long lists: which rows to draw, counted in ROWS, not items, so a grid keeps the same buffer
// whatever the number of cards per row (owner, 2026-10-29: 50 rows above and 50 below the visible area).

export const ROW_BUFFER = 50;

/** offset[i] = top of row i (row 0 at 0), each row followed by one gap; offset[n] - gap is the list's height. */
export function rowOffsets(heights: readonly number[], gap: number): Float64Array {
  const offsets = new Float64Array(heights.length + 1);
  for (let i = 0; i < heights.length; i++) offsets[i + 1] = offsets[i] + heights[i] + gap;
  return offsets;
}

export interface RowWindow { first: number; last: number; start: number; end: number; before: number; after: number }
export const EMPTY_WINDOW: RowWindow = { first: 0, last: -1, start: 0, end: -1, before: 0, after: 0 };

/** The rows to draw for a view from viewTop to viewBottom (list coordinates), `buffer` rows either side. */
export function rowWindow(heights: readonly number[], offsets: Float64Array, gap: number, viewTop: number, viewBottom: number, buffer = ROW_BUFFER): RowWindow {
  const n = heights.length;
  if (!n) return EMPTY_WINDOW;
  // First row whose bottom is below viewTop; last row whose top is above viewBottom.
  let lo = 0, hi = n - 1;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (offsets[mid] + heights[mid] > viewTop) hi = mid; else lo = mid + 1; }
  const first = lo;
  lo = first; hi = n - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (offsets[mid] < viewBottom) lo = mid; else hi = mid - 1; }
  const last = Math.max(first, lo);
  const start = Math.max(0, first - buffer), end = Math.min(n - 1, last + buffer);
  const total = offsets[n] - gap;
  return { first, last, start, end, before: offsets[start], after: Math.max(0, total - (offsets[end] + heights[end])) };
}

/** Items laid out in rows of `columns`, the way CSS grid auto-placement does: a full-row item (grid-column 1 / -1)
 *  ends the current row and takes a row of its own; nothing is packed back into the gap it leaves. */
export function gridRows<T>(items: readonly T[], columns: number, fullRow: (item: T) => boolean): T[][] {
  const per = Math.max(1, Math.floor(columns));
  const rows: T[][] = [];
  let row: T[] = [];
  for (const item of items) {
    if (fullRow(item)) {
      if (row.length) rows.push(row);
      rows.push([item]);
      row = [];
      continue;
    }
    row.push(item);
    if (row.length === per) { rows.push(row); row = []; }
  }
  if (row.length) rows.push(row);
  return rows;
}

/** Number of columns in a resolved grid-template-columns value ("240px 240px 240px"); 1 when it is not resolved. */
export function trackCount(template: string): number {
  const tracks = template.trim().split(/\s+/).filter(token => /^[\d.]+px$/.test(token));
  return Math.max(1, tracks.length);
}
