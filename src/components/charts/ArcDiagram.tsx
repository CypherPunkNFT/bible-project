import { RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCatalog } from "@/lib/catalog";
import { resolvedSectionColors, SECTIONS } from "@/lib/sections";
import { useThemeVersion } from "@/lib/theme";
import type { ArcData } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

/** Indexed book views and a small canvas cache keep exploration off the full 140,000-arc drawing path. */
export function ArcDiagram({ data }: { data: ArcData }) {
  const catalog = useCatalog();
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const cache = useRef(new Map<string, HTMLCanvasElement>());
  const [width, setWidth] = useState(0);
  const [focus, setFocus] = useState("");
  const [hover, setHover] = useState("");
  const themeVersion = useThemeVersion();
  const prepared = useMemo(() => {
    const byCode = new Map(catalog.books.map((b) => [b.code, b]));
    const bookOf = data.chapters.map((label) => label.split(" ")[0]);
    const books = catalog.books.filter((b) => bookOf.includes(b.code));
    const arcs = [...data.arcs].sort((a, b) => a[2] - b[2]);
    const byBook = new Map<string, ArcData["arcs"]>();
    const counts = new Map<string, number>();
    let total = 0;
    for (const edge of arcs) {
      total += edge[2];
      for (const code of new Set([bookOf[edge[0]], bookOf[edge[1]]])) {
        if (!byBook.has(code)) byBook.set(code, []);
        byBook.get(code)!.push(edge);
        counts.set(code, (counts.get(code) ?? 0) + edge[2]);
      }
    }
    return { bookOf, books, arcs, byBook, counts, total, sections: bookOf.map((code) => byCode.get(code)?.section ?? "apocrypha") };
  }, [data, catalog.books]);
  const active = focus || hover;
  const height = Math.round(Math.min(430, width * .45)) + 26;

  useEffect(() => {
    const element = wrap.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(1, Math.floor(entry.contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // A resize, theme change or new dataset invalidates every cached image.
  useEffect(() => { cache.current.clear(); }, [prepared, width, height, themeVersion]);

  useEffect(() => {
    if (width < 8) return; // a disappearing panel can briefly report a zero-width content box
    const frame = requestAnimationFrame(() => {
      const element = canvas.current;
      const context = element?.getContext("2d");
      if (!element || !context) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      let surface = cache.current.get(active);
      if (!surface) {
        surface = document.createElement("canvas");
        surface.width = Math.round(width * ratio);
        surface.height = Math.round(height * ratio);
        const paint = surface.getContext("2d");
        if (!paint) return;
        paint.setTransform(ratio, 0, 0, ratio, 0, 0);
        const colors = resolvedSectionColors();
        const n = data.chapters.length;
        const base = height - 22;
        const x = (i: number) => ((i + .5) / n) * width;
        const verticalScale = (height - 28) / (width / 2);
        paint.lineWidth = active ? .8 : .55;
        for (const [a, b, count] of active ? prepared.byBook.get(active) ?? [] : prepared.arcs) {
          const x1 = x(a);
          const radius = Math.abs(x(b) - x1) / 2;
          if (radius === 0) continue;
          paint.beginPath();
          paint.ellipse(x1 + radius, base, radius, radius * verticalScale, 0, Math.PI, 0);
          const other = active && prepared.bookOf[a] === active ? b : a;
          paint.strokeStyle = colors[prepared.sections[other]];
          paint.globalAlpha = Math.min(active ? .9 : .35, (active ? .12 : .018) * (1 + Math.log2(count)));
          paint.stroke();
        }
        for (let i = 0; i < n; i++) {
          paint.fillStyle = colors[prepared.sections[i]];
          paint.globalAlpha = active && prepared.bookOf[i] !== active ? .25 : 1;
          paint.fillRect((i / n) * width, base + 3, width / n + .4, 12);
        }
        // Keep the overview plus the three most recent book views (bounded memory).
        if (cache.current.size >= 4) {
          const oldest = [...cache.current.keys()].find((key) => key !== "");
          if (oldest !== undefined) cache.current.delete(oldest);
        }
        cache.current.set(active, surface);
      } else if (active) {
        cache.current.delete(active);
        cache.current.set(active, surface);
      }
      element.width = surface.width;
      element.height = surface.height;
      context.drawImage(surface, 0, 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [active, data, prepared, width, height, themeVersion]);

  const pickAt = (clientX: number) => {
    const rect = canvas.current?.getBoundingClientRect();
    if (!rect?.width) return "";
    const index = Math.min(data.chapters.length - 1, Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * data.chapters.length)));
    return prepared.bookOf[index] ?? "";
  };
  const book = prepared.books.find((b) => b.code === active);

  return (
    <div>
      <div className="chart-controls">
        <label><span>Light up one book:</span><select value={focus} onChange={(event) => { setFocus(event.target.value); setHover(""); }}>
          <option value="">All books</option>
          {prepared.books.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
        </select></label>
        {focus && <button type="button" className="chart-control-reset" onClick={() => { setFocus(""); setHover(""); }}><RotateCcw size={13} aria-hidden="true" /> Reset view</button>}
        <span className="chart-hint">{focus ? "Book pinned. Reset to explore the whole Bible." : "Hover to explore · Click or tap to pin a book"}</span>
      </div>
      <div className="chart-live-detail" aria-live="polite">
        <strong>{book?.name ?? "The whole Bible"}</strong>
        <span>{formatNumber(book ? prepared.counts.get(book.code) ?? 0 : prepared.total)} cross-references between chapters</span>
      </div>
      <div ref={wrap} className="relative w-full">
        <canvas ref={canvas} style={{ width: width || "100%", height }} className="block cursor-crosshair" role="img"
          aria-label="Arc diagram: every cross-reference between two chapters of the Bible drawn as an arc above a bar of all chapters, coloured by section"
          onPointerMove={(event) => { if (event.pointerType !== "touch" && !focus) setHover(pickAt(event.clientX)); }}
          onPointerLeave={() => setHover("")}
          onClick={(event) => { const code = pickAt(event.clientX); setFocus((current) => code === current ? "" : code); setHover(""); }} />
      </div>
      <div className="arc-bookmark"><span>Genesis</span><span>Revelation</span></div>
      <div className="chart-legend">
        {SECTIONS.filter((s) => s.id !== "apocrypha").map((s) => <span key={s.id}><i style={{ background: "var(--" + s.id + ")" }} />{s.name}</span>)}
      </div>
    </div>
  );
}
