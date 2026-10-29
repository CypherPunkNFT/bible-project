import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { resolvedSectionColors } from "@/lib/sections";
import { useThemeVersion } from "@/lib/theme";
import type { BookInfo } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

type Pair = [number, number];
const GRID = 68; // 66 books plus two cells for the section strips along the top and left edges
const same = (a: Pair | null, b: Pair | null) => a?.[0] === b?.[0] && a?.[1] === b?.[1];

/** Book to book, led by the book lit in the arcs above: the grid shows its row and column, the list beside it its
 *  strongest partners in both directions. With no book lit, the list shows the strongest pairs in the whole Bible. */
export function BookConversation({ books, pairs, book }: { books: BookInfo[]; pairs: [string, string, number][]; book: string }) {
  const model = useMemo(() => {
    const index = new Map(books.map((b, i) => [b.code, i]));
    const cells = pairs.map(([a, b, n]) => [index.get(a) ?? -1, index.get(b) ?? -1, n] as const).filter(([a, b]) => a >= 0 && b >= 0);
    const values = new Map(cells.map(([a, b, n]) => [a * books.length + b, n]));
    const top = cells.filter(([a, b]) => a !== b).sort((x, y) => y[2] - x[2]).slice(0, 12);
    return { index, cells, values, top, max: Math.max(1, ...cells.map((c) => c[2])) };
  }, [books, pairs]);
  const count = (a: number, b: number) => model.values.get(a * books.length + b) ?? 0;
  const lit = book ? model.index.get(book) ?? -1 : -1;
  const partners = useMemo(() => {
    if (lit < 0) return [];
    const value = (a: number, b: number) => model.values.get(a * books.length + b) ?? 0;
    return books.map((_, j) => ({ j, out: value(lit, j), back: value(j, lit) })).filter((p) => p.j !== lit && p.out + p.back > 0).sort((x, y) => y.out + y.back - (x.out + x.back)).slice(0, 12);
  }, [books, lit, model]);

  const [hover, setHover] = useState<Pair | null>(null);
  const [pinned, setPinned] = useState<Pair | null>(null);
  useEffect(() => { setPinned(null); setHover(null); }, [book]);
  const active = pinned ?? hover;
  const pin = (pair: Pair) => { setPinned((current) => same(current, pair) ? null : pair); setHover(null); };

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
    context.clearRect(0, 0, width, width);
    const colors = resolvedSectionColors();
    const cell = width / GRID;
    for (const [i, b] of books.entries()) {
      context.globalAlpha = lit < 0 || i === lit ? 1 : .3;
      context.fillStyle = colors[b.section];
      context.fillRect(0, (i + 2) * cell, cell * 1.3, cell);
      context.fillRect((i + 2) * cell, 0, cell, cell * 1.3);
    }
    for (const [a, b, n] of model.cells) {
      const strength = .12 + .88 * Math.sqrt(n / model.max);
      context.globalAlpha = lit < 0 || a === lit || b === lit ? strength : strength * .14;
      context.fillStyle = colors[books[a === lit ? b : a].section]; // a lit book's cells take its partner's colour
      context.fillRect((b + 2) * cell, (a + 2) * cell, cell, cell);
    }
  }, [books, model, width, lit, themeVersion]);

  const pick = (x: number, y: number): Pair | null => {
    const rect = canvas.current?.getBoundingClientRect();
    if (!rect?.width) return null;
    const a = Math.floor(((y - rect.top) / rect.height) * GRID) - 2;
    const b = Math.floor(((x - rect.left) / rect.width) * GRID) - 2;
    return a >= 0 && b >= 0 && a < books.length && b < books.length ? [a, b] : null;
  };
  const at = (i: number) => ((i + 2) / GRID) * 100 + "%";
  const litBook = lit >= 0 ? books[lit] : undefined;
  const partnerMax = Math.max(1, ...partners.map((p) => p.out + p.back));
  const pairMax = Math.max(1, ...model.top.map((c) => c[2]));

  return <div className="cx-conversation">
    <div className="cx-matrix">
      <div ref={wrap} className="cx-matrix-surface">
        <canvas ref={canvas} role="img" aria-label="Grid of cross-references between every pair of books: rows are the book that refers, columns the book referred to. Choose a pair from the list beside it to read its numbers."
          onPointerMove={(event) => { if (event.pointerType !== "touch" && !pinned) { const pair = pick(event.clientX, event.clientY); setHover((current) => same(current, pair) ? current : pair); } }}
          onPointerLeave={() => setHover(null)} onClick={(event) => { const pair = pick(event.clientX, event.clientY); if (pair) pin(pair); }} />
        {lit >= 0 && <><i className="cx-band" style={{ left: 0, right: 0, top: at(lit), height: 100 / GRID + "%" }} /><i className="cx-band" style={{ top: 0, bottom: 0, left: at(lit), width: 100 / GRID + "%" }} /></>}
        {active && <i className="cx-cell" style={{ left: at(active[1]), top: at(active[0]), width: 100 / GRID + "%", height: 100 / GRID + "%" }} />}
      </div>
      <p className="cx-axis"><span>Rows refer</span><ArrowRight size={12} aria-hidden="true" /><span>columns are referred to</span></p>
    </div>

    <div className="cx-partners">
      <div className="cx-pair-detail" aria-live="polite">
        {active ? <>
          <h3>{books[active[0]].name} <ArrowRight size={18} aria-hidden="true" /> {books[active[1]].name}</h3>
          <p><strong>{formatNumber(count(active[0], active[1]))}</strong> cross-references this way{active[0] !== active[1] && <> · <strong>{formatNumber(count(active[1], active[0]))}</strong> back</>}</p>
        </> : litBook ? <>
          <h3>{litBook.name} in conversation</h3>
          <p>The books it shares the most cross-references with, counted both ways. Choose one to see each direction.</p>
        </> : <>
          <h3>The strongest conversations</h3>
          <p>The book pairs joined by the most cross-references. Light up a book above to follow its own.</p>
        </>}
      </div>
      <ol className="cx-list">
        {litBook ? partners.map(({ j, out, back }) => <li key={j}><button type="button" aria-pressed={same(pinned, [lit, j])} onClick={() => pin([lit, j])} style={{ "--cx-tone": `var(--${books[j].section})` } as CSSProperties}>
          <span className="cx-list-name">{books[j].name}</span><span className="cx-list-count">{formatNumber(out + back)}</span>
          <span className="cx-list-line" aria-hidden="true"><i style={{ width: (out / partnerMax) * 100 + "%" }} /><i className="cx-back" style={{ width: (back / partnerMax) * 100 + "%" }} /></span>
        </button></li>)
          : model.top.map(([a, b, n]) => <li key={a + "-" + b}><button type="button" aria-pressed={same(pinned, [a, b])} onClick={() => pin([a, b])} style={{ "--cx-tone": `var(--${books[a].section})` } as CSSProperties}>
            <span className="cx-list-name">{books[a].name} <ArrowRight size={12} aria-hidden="true" /> {books[b].name}</span><span className="cx-list-count">{formatNumber(n)}</span>
            <span className="cx-list-line" aria-hidden="true"><i style={{ width: (n / pairMax) * 100 + "%" }} /></span>
          </button></li>)}
      </ol>
      {litBook && <p className="cx-list-key"><span><i /> {litBook.name} refers to it</span><span><i className="cx-back" /> it refers to {litBook.name}</span></p>}
      {litBook && <Link className="cx-read" to={`/read/kjv/${litBook.code}/1`}>Open {litBook.name} in the reader <ArrowRight size={14} aria-hidden="true" /></Link>}
    </div>
  </div>;
}
