import { RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useCatalog } from "@/lib/catalog";
import { resolvedSectionColors, SECTIONS } from "@/lib/sections";
import type { Arc, ArcSource } from "@/lib/arc-source";
import { useThemeVersion } from "@/lib/theme";
import { formatNumber } from "@/lib/utils";
import { loadOverview } from "./arc-overview";
import { arcBase, arcHeight, arcPainter } from "./arc-paint";

const HOVER_REST_MS = 180;

/** Book views and a small canvas cache keep exploration off the full 140,000-arc drawing path. The chart reads an
 *  ArcSource (src/lib/arc-source.ts): the chapters and totals at once, a book's chapter arcs only when it is lit (a
 *  hover lights a book once the pointer rests on it, so sweeping across the chart does not read every book). The whole
 *  Bible is the picture drawn ahead where one fits, and otherwise the book-to-book arcs: each pair of books as one arc
 *  between their middle chapters, carrying all their references.
 *  `focus` + `onFocusChange` let a page own the lit book (Connections in Scripture shares it with Book to book);
 *  `picker` replaces the book list in the controls; `prebuilt` shows the whole Bible from a picture drawn ahead on the
 *  page colour, so only a chart that sits on the page itself should set it. */
export function ArcDiagram({ data, focus: litBook, onFocusChange, picker, prebuilt = false }: { data: ArcSource; focus?: string; onFocusChange?: (code: string) => void; picker?: ReactNode; prebuilt?: boolean }) {
  const catalog = useCatalog();
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const cache = useRef(new Map<string, HTMLCanvasElement>());
  const [width, setWidth] = useState(0);
  const [ownFocus, setOwnFocus] = useState("");
  const focus = litBook ?? ownFocus;
  const setFocus = onFocusChange ?? setOwnFocus;
  const [hover, setHoverNow] = useState("");
  const hoverTimer = useRef(0);
  // A hover lights a book once the pointer has rested on it for HOVER_REST_MS; leaving the chart clears it at once.
  const setHover = (code: string) => {
    clearTimeout(hoverTimer.current);
    if (!code) setHoverNow("");
    else hoverTimer.current = window.setTimeout(() => setHoverNow(code), HOVER_REST_MS);
  };
  useEffect(() => () => clearTimeout(hoverTimer.current), []);
  const themeVersion = useThemeVersion();
  const prepared = useMemo(() => {
    const byCode = new Map(catalog.books.map((b) => [b.code, b]));
    const bookOf = data.chapters.map((label) => label.split(" ")[0]);
    const books = catalog.books.filter((b) => bookOf.includes(b.code));
    const counts = new Map(data.books.map((book) => [book.code, book.count]));
    // The whole Bible book to book: one arc per pair of books, between their middle chapters, weakest first.
    const middle = new Map<string, number>();
    let start = 0;
    for (const book of data.books) { middle.set(book.code, start + Math.floor(book.chapters.length / 2)); start += book.chapters.length; }
    const bookArcs: Arc[] = data.books.flatMap((book) => Object.entries(book.links).map(([other, n]): Arc => [middle.get(book.code)!, middle.get(other)!, n]))
      .filter(([a, b]) => a !== undefined && b !== undefined).sort((a, b) => a[2] - b[2]);
    return { bookOf, books, bookArcs, counts, total: data.references, sections: bookOf.map((code) => byCode.get(code)?.section ?? "apocrypha") };
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
    const view = { width, height, colors, active };
    let cancelled = false;
    const finish = () => {
      arcPainter(paint, { arcs: [], bookOf: prepared.bookOf, sections: prepared.sections }, view).bar();
      // Keep the overview plus the three most recent book views (bounded memory).
      if (cache.current.size >= 4) {
        const oldest = [...cache.current.keys()].find((key) => key !== "");
        if (oldest !== undefined) cache.current.delete(oldest);
      }
      cache.current.set(active, surface);
      show(surface);
    };
    // A book view, or the whole Bible book to book: drawn in ~8 ms slices, in the same order, so the page never freezes
    // and the finished image is unchanged (Psalms is ~28,000 strokes). It is shown and cached only once complete.
    const drawLive = (arcs: Arc[]) => {
      const painter = arcPainter(paint, { arcs, bookOf: prepared.bookOf, sections: prepared.sections }, view);
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
    if (active) {
      data.bookArcs(active).then((arcs) => { if (!cancelled) drawLive(arcs); })
        .catch((error: unknown) => console.warn(`arc chart: the arcs of ${active} could not be read`, error));
    } else if (!prebuilt) drawLive(prepared.bookArcs);
    else {
      // The whole Bible comes from a picture drawn ahead by the same code (scripts/build-arc-images.mjs), stretched from
      // its baseline to this one; the chapter bar is drawn here, so it keeps its exact size.
      loadOverview(width, ratio, getComputedStyle(document.documentElement).getPropertyValue("--page").trim(), colors, { chapters: data.chapters.length, arcs: data.arcs, references: prepared.total }).then((overview) => {
        if (cancelled) return;
        if (!overview) { drawLive(prepared.bookArcs); return; }
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
    <div className="arc-diagram">
      <div className="arc-head">
      <div className="chart-controls">
        {picker ?? <label><span>Light up one book:</span><select value={focus} onChange={(event) => { setFocus(event.target.value); setHover(""); }}>
          <option value="">All books</option>
          {prepared.books.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
        </select></label>}
        {focus && <button type="button" className="chart-control-reset" onClick={() => { setFocus(""); setHover(""); }}><RotateCcw size={13} aria-hidden="true" /> Reset view</button>}
        <span className="chart-hint">{focus ? <span>Book pinned. Reset to explore the whole Bible.</span> : <><span>Hover to explore</span><span>Click or tap to pin a book</span></>}</span>
      </div>
      <div className="chart-live-detail" aria-live="polite">
        <strong>{book?.name ?? "The whole Bible"}</strong>
        <span>{`${formatNumber(book ? prepared.counts.get(book.code) ?? 0 : prepared.total)} cross-references between chapters`}</span>
      </div>
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
