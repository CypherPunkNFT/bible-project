// A long list drawn a window of rows at a time with the site's useRowWindow (src/lib/useRowWindow.ts): the rows on
// screen plus ROW_BUFFER (50) above and below, the rest drawn as the reader scrolls. The owner's scroll rule
// (2026-11-17): no "Show more", "Load more" or page buttons on long lists, and the window is counted in rows, not
// items, so a grid of chips or cards is grouped into rows of as many columns as its stylesheet lays out at this width.
// The container lays its items out as a grid or a single column (not flex-wrap or CSS columns), spaced by `gap`, not
// by margins; each item renderItem returns is one element carrying its `key` and `data-row={row}`. A sticky item (a
// heading that sticks while its section scrolls) also carries `data-sticky`. The container turns off the browser's
// scroll anchoring (overflow-anchor), since useRowWindow keeps the reader's place itself.
import { createElement, useCallback, useEffect, useLayoutEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { gridRows, trackCount } from "@/lib/row-window";
import { useRowWindow } from "@/lib/useRowWindow";

export interface WindowedRowsProps<T> {
  items: readonly T[];
  itemKey: (item: T) => string;
  /** One element for the item, with its `key` and `data-row={row}`. */
  renderItem: (item: T, row: number, index: number) => ReactNode;
  /** Height in px assumed for a row before any row has been measured. */
  estimate: number;
  as?: "div" | "ul" | "ol";
  className?: string;
  style?: CSSProperties;
  /** An item that takes a row of its own (a section heading); the stylesheet gives it grid-column: 1 / -1. */
  fullRow?: (item: T) => boolean;
  /** Changes when the list's content changes (a search, a filter), not when it only re-flows. Defaults to `items`. */
  dataVersion?: unknown;
  /** The element that scrolls; by default the nearest scrolling ancestor, or the page. */
  scroller?: HTMLElement | "window";
  /** Called when the last row is drawn, i.e. the reader is within ROW_BUFFER rows of the end. */
  onEnd?: () => void;
  role?: string;
  "aria-label"?: string;
}

/** The nearest ancestor that scrolls its content, or the page. */
function scrollParent(el: HTMLElement): HTMLElement | "window" {
  for (let node = el.parentElement; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY;
    if (overflow === "auto" || overflow === "scroll" || overflow === "overlay") return node;
  }
  return "window";
}

const NO_FULL_ROW = () => false;

export function WindowedRows<T>({ items, itemKey, renderItem, estimate, as = "div", className, style, fullRow = NO_FULL_ROW, dataVersion, scroller, onEnd, role, "aria-label": label }: WindowedRowsProps<T>) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [found, setFound] = useState<HTMLElement | "window" | null>(null);
  const [tracks, setTracks] = useState({ columns: 1, gap: 0 });
  // Columns and row gap as the stylesheet lays them out at this width; the scrolling ancestor, once the list is placed.
  useLayoutEffect(() => {
    if (!container) return;
    setFound(scrollParent(container));
    const read = () => {
      const css = getComputedStyle(container);
      const next = { columns: trackCount(css.gridTemplateColumns || ""), gap: parseFloat(css.rowGap) || 0 };
      setTracks((prev) => prev.columns === next.columns && prev.gap === next.gap ? prev : next);
    };
    read();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(read);
    observer.observe(container);
    return () => observer.disconnect();
  }, [container]);

  const rows = useMemo(() => gridRows(items, tracks.columns, fullRow), [items, tracks.columns, fullRow]);
  const rowOf = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((row, r) => row.forEach((item) => map.set(itemKey(item), r)));
    return map;
  }, [rows, itemKey]);
  const firstIndex = useMemo(() => {
    const starts: number[] = [];
    let n = 0;
    for (const row of rows) { starts.push(n); n += row.length; }
    return starts;
  }, [rows]);
  const rowKey = useCallback((r: number) => `${itemKey(rows[r][0])}|${itemKey(rows[r][rows[r].length - 1])}|${tracks.columns}`, [rows, itemKey, tracks.columns]);
  const anchorKey = useCallback((r: number) => itemKey(rows[r][0]), [rows, itemKey]);
  const rowOfAnchor = useCallback((key: string) => rowOf.get(key), [rowOf]);
  const { start, end, before, after } = useRowWindow({ rowCount: rows.length, rowKey, anchorKey, rowOfAnchor, estimate, gap: tracks.gap,
    scroller: scroller ?? found, container, dataVersion: dataVersion ?? items });

  const reachedEnd = rows.length > 0 && end >= rows.length - 1;
  useEffect(() => { if (reachedEnd) onEnd?.(); }, [reachedEnd, rows.length, onEnd]);

  const drawn: ReactNode[] = [];
  for (let r = start; r <= end && r < rows.length; r++) rows[r].forEach((item, k) => drawn.push(renderItem(item, r, firstIndex[r] + k)));
  return createElement(as, { ref: setContainer, className, role, "aria-label": label, style: { ...style, paddingTop: before, paddingBottom: after, overflowAnchor: "none" } }, drawn);
}
