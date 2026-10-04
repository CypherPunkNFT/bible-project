import { useEffect, useMemo, useRef, useState } from "react";
import { useCatalog } from "@/lib/catalog";
import { resolvedSectionColors } from "@/lib/sections";
import { useThemeVersion } from "@/lib/theme";
import { formatNumber } from "@/lib/utils";

/** Paint the heatmap once; pointer movement updates only its selection and detail panel. */
export function BookMatrix({ pairs }: { pairs: [string, string, number][] }) {
  const catalog = useCatalog();
  const books = useMemo(() => catalog.books.filter((b) => b.num <= 66), [catalog.books]);
  const model = useMemo(() => {
    const index = new Map(books.map((b, i) => [b.code, i]));
    const cells = pairs.map(([a, b, n]) => [index.get(a) ?? -1, index.get(b) ?? -1, n] as const).filter(([a, b]) => a >= 0 && b >= 0);
    return { cells, values: new Map(cells.map(([a, b, n]) => [a * 66 + b, n])), max: Math.max(1, ...cells.map((c) => c[2])), top: [...cells].filter(([a, b]) => a !== b).sort((a, b) => b[2] - a[2]).slice(0, 100) };
  }, [books, pairs]);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [pinned, setPinned] = useState<[number, number] | null>(null);
  const active = pinned ?? hover;
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const themeVersion = useThemeVersion();

  useEffect(() => {
    if (!wrap.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(1, Math.floor(entry.contentRect.width))));
    observer.observe(wrap.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context || !width) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    element.width = element.height = Math.round(width * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const colors = resolvedSectionColors();
    const cell = width / 68;
    for (const [i, book] of books.entries()) {
      context.fillStyle = colors[book.section];
      context.fillRect(0, (i + 2) * cell, cell * 1.3, cell);
      context.fillRect((i + 2) * cell, 0, cell, cell * 1.3);
    }
    for (const [a, b, n] of model.cells) {
      context.fillStyle = colors[books[a].section];
      context.globalAlpha = .12 + .88 * Math.sqrt(n / model.max);
      context.fillRect((b + 2) * cell, (a + 2) * cell, cell, cell);
    }
  }, [books, model, width, themeVersion]);

  const pick = (x: number, y: number): [number, number] | null => {
    const rect = canvas.current?.getBoundingClientRect();
    if (!rect?.width) return null;
    const a = Math.floor((y - rect.top) / rect.height * 68) - 2;
    const b = Math.floor((x - rect.left) / rect.width * 68) - 2;
    return a >= 0 && b >= 0 && a < 66 && b < 66 ? [a, b] : null;
  };
  const same = (a: readonly number[] | null, b: readonly number[] | null) => a?.[0] === b?.[0] && a?.[1] === b?.[1];
  const pin = (pair: [number, number]) => { setPinned((current) => same(current, pair) ? null : pair); setHover(null); };

  return (
    <div>
      <div className="chart-controls">
        <label>From book<select aria-label="From book" value={active?.[0] ?? ""} onChange={(event) => setPinned([Number(event.target.value), active?.[1] ?? 0])}><option value="" disabled>Choose a book</option>{books.map((b, i) => <option key={b.code} value={i}>{b.name}</option>)}</select></label>
        <label>To book<select aria-label="To book" value={active?.[1] ?? ""} onChange={(event) => setPinned([active?.[0] ?? 0, Number(event.target.value)])}><option value="" disabled>Choose a book</option>{books.map((b, i) => <option key={b.code} value={i}>{b.name}</option>)}</select></label>
        {pinned && <button type="button" className="chart-control-reset" onClick={() => { setPinned(null); setHover(null); }}>Clear selection</button>}
      </div>
      <div className="matrix-layout">
        <div>
          <div ref={wrap} className="relative">
            <canvas ref={canvas} className="matrix-surface" role="img" aria-label="Heatmap of cross-references between every pair of books. Use the From book and To book selectors to inspect a pair."
              onPointerMove={(event) => { if (event.pointerType !== "touch" && !pinned) { const pair = pick(event.clientX, event.clientY); setHover((current) => same(current, pair) ? current : pair); } }}
              onPointerLeave={() => setHover(null)} onClick={(event) => { const pair = pick(event.clientX, event.clientY); if (pair) pin(pair); }} />
            {active && <div className="pointer-events-none absolute border-2 border-ink" style={{ left: (active[1] + 2) / 68 * 100 + "%", top: (active[0] + 2) / 68 * 100 + "%", width: 100 / 68 + "%", height: 100 / 68 + "%" }} />}
          </div>
          <p className="chart-hint mt-3">Rows: from · Columns: to · Stronger colour: more references.<br />Genesis begins at the top left; Revelation ends at the bottom right.</p>
        </div>
        <div className="matrix-sidebar"><div className="matrix-sidebar-inner">
          <div className="matrix-detail" aria-live="polite">
            <h3>{active ? books[active[0]].name + " → " + books[active[1]].name : "Discover a connection"}</h3>
            {active ? <p><strong>{formatNumber(model.values.get(active[0] * 66 + active[1]) ?? 0)}</strong> cross-references{pinned && <span className="block mt-1">Selected · choose another pair to compare</span>}</p> : <p>Hover over the grid, tap a square, or select a pair below. The book selectors also work with a keyboard.</p>}
          </div>
          <div className="matrix-pairs"><h3>Most cross-referenced book pairs</h3>
            <ol className="slim-scroll">{model.top.map(([a, b, n]) => <li key={a + "-" + b}><button type="button" aria-pressed={same(pinned, [a, b])} onClick={() => pin([a, b])}><span>{books[a].name} → {books[b].name}</span><span>{formatNumber(n)}</span></button></li>)}</ol>
          </div>
        </div></div>
      </div>
    </div>
  );
}
