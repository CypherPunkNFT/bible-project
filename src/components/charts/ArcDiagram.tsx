import { RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useCatalog } from "@/lib/catalog";
import { resolvedSectionColors, SECTIONS } from "@/lib/sections";
import { useThemeVersion } from "@/lib/theme";
import type { ArcData } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { loadOverview } from "./arc-overview";
import { arcBase, arcHeight, arcPainter } from "./arc-paint";

/** Indexed book views and a small canvas cache keep exploration off the full 140,000-arc drawing path.
 *  `focus` + `onFocusChange` let a page own the lit book (Connections in Scripture shares it with Book to book);
 *  `picker` replaces the book list in the controls; `prebuilt` shows the whole Bible from a picture drawn ahead on the
 *  page colour, so only a chart that sits on the page itself should set it. */
export function ArcDiagram({ data, focus: litBook, onFocusChange, picker, prebuilt = false }: { data: ArcData; focus?: string; onFocusChange?: (code: string) => void; picker?: ReactNode; prebuilt?: boolean }) {
  const catalog = useCatalog();
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const cache = useRef(new Map<string, HTMLCanvasElement>());
  const [width, setWidth] = useState(0);
  const [ownFocus, setOwnFocus] = useState("");
  const focus = litBook ?? ownFocus;
  const setFocus = onFocusChange ?? setOwnFocus;
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
  const height = arcHeight(width);

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
    let frame = 0;
    const show = (surface: HTMLCanvasElement) => {
      const element = canvas.current;
      const context = element?.getContext("2d");
      if (!element || !context) return;
      element.width = surface.width;
      element.height = surface.height;
      context.drawImage(surface, 0, 0);
    };
    const cached = cache.current.get(active);
    if (cached) {
      if (active) { cache.current.delete(active); cache.current.set(active, cached); }
      frame = requestAnimationFrame(() => show(cached));
      return () => cancelAnimationFrame(frame);
    }
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const surface = document.createElement("canvas");
    surface.width = Math.round(width * ratio);
    surface.height = Math.round(height * ratio);
    const paint = surface.getContext("2d");
    if (!paint) return;
    paint.setTransform(ratio, 0, 0, ratio, 0, 0);
    const colors = resolvedSectionColors();
    const painter = arcPainter(paint, prepared, { width, height, colors, active });
    let cancelled = false;
    const finish = () => {
      painter.bar();
      // Keep the overview plus the three most recent book views (bounded memory).
      if (cache.current.size >= 4) {
        const oldest = [...cache.current.keys()].find((key) => key !== "");
        if (oldest !== undefined) cache.current.delete(oldest);
      }
      cache.current.set(active, surface);
      show(surface);
    };
    // A book view, or the whole Bible without a matching picture: drawn in ~8 ms slices, in the same order, so the page
    // never freezes and the finished image is unchanged (the whole Bible is ~140,000 strokes, ~0.85 s here and ~5 s on
    // a slow phone). It is shown and cached only once complete.
    const drawLive = () => {
      const arcs = active ? prepared.byBook.get(active) ?? [] : prepared.arcs;
      let next = 0;
      const drawSlice = () => {
        const stopAt = performance.now() + 8;
        while (next < arcs.length) {
          painter.arc(arcs[next++]);
          if ((next & 255) === 0 && performance.now() > stopAt) { frame = requestAnimationFrame(drawSlice); return; }
        }
        finish();
      };
      frame = requestAnimationFrame(drawSlice);
    };
    if (active || !prebuilt) drawLive();
    else {
      // The whole Bible comes from a picture drawn ahead by the same code (scripts/build-arc-images.mjs), stretched from
      // its baseline to this one; the chapter bar is drawn here, so it keeps its exact size.
      loadOverview(width, ratio, getComputedStyle(document.documentElement).getPropertyValue("--page").trim(), colors, { chapters: data.chapters.length, arcs: data.arcs.length, references: prepared.total }).then((overview) => {
        if (cancelled) return;
        if (!overview) { drawLive(); return; }
        const { image, width: drawnWidth, base } = overview;
        // The picture is `drawnWidth` CSS pixels wide and reaches just below its baseline `base`: scale it so that
        // baseline lands on this chart's.
        const drawnHeight = image.naturalHeight * (drawnWidth / image.naturalWidth);
        paint.drawImage(image, 0, 0, width, drawnHeight * (arcBase(height) / base));
        finish();
      });
    }
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [active, data, prepared, width, height, themeVersion, prebuilt]);

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
        {picker ?? <label><span>Light up one book:</span><select value={focus} onChange={(event) => { setFocus(event.target.value); setHover(""); }}>
          <option value="">All books</option>
          {prepared.books.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
        </select></label>}
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
          onClick={(event) => { const code = pickAt(event.clientX); setFocus(code === focus ? "" : code); setHover(""); }} />
      </div>
      <div className="arc-bookmark"><span>Genesis</span><span>Revelation</span></div>
      <div className="chart-legend">
        {SECTIONS.filter((s) => s.id !== "apocrypha").map((s) => <span key={s.id}><i style={{ background: "var(--" + s.id + ")" }} />{s.name}</span>)}
      </div>
    </div>
  );
}
