// Draws only the rows of a long list near the screen: the visible rows plus ROW_BUFFER rows above and below
// (row-window.ts). Rows further out are released and drawn again when the reader scrolls back.
//
// The consumer renders rows start..end inside `container`, gives each drawn item `data-row={row}`, and puts
// `before` / `after` on the container as padding-top / padding-bottom so the scroll height stays that of the
// whole list. Row heights are measured as rows are drawn (cached by row key; cleared when the width changes)
// and estimated before that. When an estimate turns out wrong above the screen, the scroll position is corrected
// so what the reader is looking at does not move. The container sets `overflow-anchor: none` so the browser's own
// scroll anchoring does not correct a second time.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { EMPTY_WINDOW, ROW_BUFFER, rowOffsets, rowWindow, type RowWindow } from "./row-window";

export interface RowWindowOptions {
  rowCount: number;
  /** Cache key for a row's height (its items and the column count). */
  rowKey: (row: number) => string;
  /** Id of the first item in a row; the scroll anchor, stable when rows regroup on a width change. */
  anchorKey: (row: number) => string;
  rowOfAnchor: (key: string) => number | undefined;
  /** Height in px assumed for a row before any row has been measured. */
  estimate: number;
  /** Vertical gap between rows in px. */
  gap: number;
  scroller: HTMLElement | "window" | null;
  container: HTMLElement | null;
  /** Changes when the list's content changes (filter, sort, an opened shelf), not when it only re-flows. */
  dataVersion: unknown;
  buffer?: number;
}

interface Anchor { key: string; y: number; scroll: number; version: unknown }
interface Layout { heights: number[]; offsets: Float64Array }

const INITIAL_ROWS = 20;
/** Measure-and-redraw passes allowed without a scroll in between; more means something keeps moving. */
const MAX_SETTLE_PASSES = 12;
const sameWindow = (a: RowWindow, b: RowWindow) => a.start === b.start && a.end === b.end && Math.round(a.before) === Math.round(b.before) && Math.round(a.after) === Math.round(b.after);

/** The first drawn row on screen (its items reach below viewTop), with the top of its first item; null if none is. */
function topVisibleRow(container: HTMLElement | null, viewTop: number, viewBottom: number, rowCount: number): { row: number; top: number } | null {
  if (!container) return null;
  const items = container.querySelectorAll<HTMLElement>(":scope > [data-row]:not([data-pinned])");
  // Items are in row order: binary search for the first whose bottom is below the top of the view.
  let lo = 0, hi = items.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (items[mid].getBoundingClientRect().bottom > viewTop) hi = mid; else lo = mid + 1; }
  if (lo === items.length) return null;
  const row = Number(items[lo].dataset.row);
  if (!Number.isInteger(row) || row < 0 || row >= rowCount) return null;
  let first = lo;
  while (first > 0 && items[first - 1].dataset.row === items[lo].dataset.row) first--;
  const top = items[first].getBoundingClientRect().top;
  return top < viewBottom ? { row, top } : null;
}

export function useRowWindow(options: RowWindowOptions) {
  const opts = useRef(options);
  opts.current = options;
  const cache = useRef(new Map<string, number>());
  const cacheVersion = useRef(0);
  const layoutMemo = useRef<{ key: unknown[]; layout: Layout } | null>(null);
  const anchor = useRef<Anchor | null>(null);
  const passes = useRef(0);
  const settledVersion = useRef<unknown>(undefined);
  const width = useRef(0);
  const [state, setState] = useState<{ window: RowWindow; ready: boolean }>({ window: EMPTY_WINDOW, ready: false });

  const layout = useCallback((): Layout => {
    const { rowCount, rowKey, gap, estimate } = opts.current;
    const key = [rowCount, rowKey, gap, cacheVersion.current];
    const memo = layoutMemo.current;
    if (memo && memo.key.every((part, i) => part === key[i])) return memo.layout;
    let sum = 0, measured = 0;
    cache.current.forEach(height => { sum += height; measured++; });
    const average = measured ? sum / measured : estimate;
    const heights = Array.from({ length: rowCount }, (_, row) => cache.current.get(rowKey(row)) ?? average);
    const next = { heights, offsets: rowOffsets(heights, gap) };
    layoutMemo.current = { key, layout: next };
    return next;
  }, []);

  const geometry = useCallback(() => {
    const { scroller, container } = opts.current;
    if (!scroller || !container) return null;
    const box = container.getBoundingClientRect();
    if (!box.width) return null; // hidden, or a test without layout
    const y0 = box.top + container.clientTop;
    if (scroller === "window") return { y0, viewTop: 0, viewBottom: window.innerHeight, scroll: window.scrollY };
    const frame = scroller.getBoundingClientRect(), viewTop = frame.top + scroller.clientTop;
    return { y0, viewTop, viewBottom: viewTop + scroller.clientHeight, scroll: scroller.scrollTop };
  }, []);

  const scrollBy = useCallback((delta: number) => {
    const { scroller } = opts.current;
    if (scroller === "window") window.scrollBy(0, delta);
    else if (scroller) scroller.scrollTop += delta;
  }, []);

  /** Work out the rows to draw for the current scroll position and remember what is at the top of the view. */
  const update = useCallback(() => {
    const g = geometry();
    if (!g) return;
    const { gap, anchorKey, dataVersion, buffer = ROW_BUFFER } = opts.current;
    const { heights, offsets } = layout();
    const next = rowWindow(heights, offsets, gap, g.viewTop - g.y0, g.viewBottom - g.y0, buffer);
    // The anchor is the top drawn row the reader can see, where it really is; the estimate only when none is drawn
    // there (a jump far down). Read from the page, it stays right while rows regroup after a width change.
    const seen = topVisibleRow(opts.current.container, g.viewTop, g.viewBottom, heights.length);
    const row = seen ? seen.row : next.first, y = seen ? seen.top - g.viewTop : g.y0 + offsets[next.first] - g.viewTop;
    anchor.current = heights.length ? { key: anchorKey(row), y, scroll: g.scroll, version: dataVersion } : null;
    setState(prev => prev.ready && sameWindow(prev.window, next) ? prev : { window: next, ready: true });
  }, [geometry, layout]);

  /** Measure the drawn rows, keep the anchored row where the reader saw it, then update the window. */
  const settle = useCallback(() => {
    const { container, rowCount, rowKey, rowOfAnchor, dataVersion } = opts.current;
    const g = geometry();
    if (!container || !g) return;
    if (settledVersion.current !== dataVersion) { settledVersion.current = dataVersion; passes.current = 0; }
    const tallest = new Map<number, number>();
    container.querySelectorAll<HTMLElement>(":scope > [data-row]:not([data-pinned])").forEach(el => {
      const row = Number(el.dataset.row), height = el.getBoundingClientRect().height;
      if (Number.isInteger(row) && row >= 0 && row < rowCount && height > 0) tallest.set(row, Math.max(tallest.get(row) ?? 0, height));
    });
    let changed = false;
    tallest.forEach((height, row) => {
      const key = rowKey(row), old = cache.current.get(key);
      if (old === undefined || Math.abs(old - height) > 0.5) { cache.current.set(key, height); changed = true; }
    });
    if (changed) cacheVersion.current++;
    const a = anchor.current;
    if (a && a.version === dataVersion) {
      const row = rowOfAnchor(a.key);
      if (row !== undefined && row < rowCount) {
        const el = container.querySelector<HTMLElement>(`:scope > [data-row="${row}"]:not([data-pinned])`);
        const actual = el ? el.getBoundingClientRect().top - g.viewTop : g.y0 + layout().offsets[row] - g.viewTop;
        const expected = a.y - (g.scroll - a.scroll);
        if (Math.abs(actual - expected) >= 1) scrollBy(actual - expected);
      }
    }
    if (passes.current++ < MAX_SETTLE_PASSES) update();
  }, [geometry, layout, scrollBy, update]);

  // After every render: measure what was drawn.
  useLayoutEffect(() => { settle(); });

  useEffect(() => {
    const { scroller, container } = options;
    if (!scroller || !container) return;
    let scrollFrame = 0, measureFrame = 0;
    const onScroll = () => {
      passes.current = 0;
      if (!scrollFrame) scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; update(); });
    };
    const target: HTMLElement | Window = scroller === "window" ? window : scroller;
    target.addEventListener("scroll", onScroll, { passive: true });
    // A list in the page: at its end the browser's own scroll anchoring picks what lies below it (a loading line,
    // the footer) and follows it down as rows arrive, which reaches the end again and fetches file after file.
    // This hook keeps the reader's place itself, so the page's anchoring is off while the list is shown.
    const root = document.documentElement, rootAnchor = root.style.overflowAnchor;
    if (scroller === "window") root.style.overflowAnchor = "none";
    if (scroller === "window") window.addEventListener("resize", onScroll);
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      // Heights can change without this list re-rendering (a shelf's works arriving, fonts, wrapping): re-measure.
      observer = new ResizeObserver(() => {
        const w = container.getBoundingClientRect().width;
        if (Math.abs(w - width.current) > 0.5) { width.current = w; cache.current.clear(); cacheVersion.current++; }
        passes.current = 0;
        if (!measureFrame) measureFrame = requestAnimationFrame(() => { measureFrame = 0; settle(); });
      });
      observer.observe(container);
      if (scroller !== "window") observer.observe(scroller);
    }
    update();
    return () => {
      target.removeEventListener("scroll", onScroll);
      if (scroller === "window") root.style.overflowAnchor = rootAnchor;
      if (scroller === "window") window.removeEventListener("resize", onScroll);
      observer?.disconnect();
      cancelAnimationFrame(scrollFrame);
      cancelAnimationFrame(measureFrame);
    };
  }, [options.scroller, options.container, update, settle]); // eslint-disable-line react-hooks/exhaustive-deps

  const n = options.rowCount;
  const w = state.ready ? state.window : { ...EMPTY_WINDOW, end: Math.min(n, INITIAL_ROWS) - 1 };
  const end = Math.min(w.end, n - 1), start = Math.min(w.start, Math.max(0, end));
  const offsetOf = useCallback((row: number) => layout().offsets[row] ?? 0, [layout]);
  return { start, end, before: end < 0 ? 0 : w.before, after: end < 0 ? 0 : w.after, offsetOf };
}
