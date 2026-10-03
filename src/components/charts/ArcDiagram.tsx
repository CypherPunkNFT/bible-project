import { useEffect, useMemo, useRef, useState } from "react";
import { useCatalog } from "@/lib/catalog";
import { resolvedSectionColors, SECTIONS } from "@/lib/sections";
import { useThemeVersion } from "@/lib/theme";
import type { ArcData, SectionId } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

interface Prepared {
  /** chapter index -> book code */
  bookOf: string[];
  sectionOf: SectionId[];
  /** first chapter index of each book, in order */
  bookStarts: { code: string; name: string; start: number; end: number; section: SectionId }[];
}

function prepare(data: ArcData, books: { code: string; name: string; section: SectionId }[]): Prepared {
  const byCode = new Map(books.map((b) => [b.code, b]));
  const bookOf = data.chapters.map((label) => label.split(" ")[0]);
  const sectionOf = bookOf.map((code) => byCode.get(code)?.section ?? "apocrypha");
  const bookStarts: Prepared["bookStarts"] = [];
  bookOf.forEach((code, index) => {
    const last = bookStarts[bookStarts.length - 1];
    if (last?.code === code) last.end = index;
    else bookStarts.push({ code, name: byCode.get(code)?.name ?? code, start: index, end: index, section: byCode.get(code)?.section ?? "apocrypha" });
  });
  return { bookOf, sectionOf, bookStarts };
}

/**
 * Every cross-reference between two different chapters, drawn as an arc above a bar of all 1,189
 * chapters (after Chris Harrison's 2007 picture). Arc colour = the section of the earlier chapter.
 * Pick a book to light up only its arcs.
 */
export function ArcDiagram({ data }: { data: ArcData }) {
  const catalog = useCatalog();
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1000);
  const [focus, setFocus] = useState<string>("");
  const [hover, setHover] = useState<Prepared["bookStarts"][number] | null>(null);
  const themeVersion = useThemeVersion();
  const prepared = useMemo(() => prepare(data, catalog.books), [data, catalog.books]);
  const height = Math.round(width * 0.5) + 28;

  useEffect(() => {
    const element = wrap.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(320, Math.floor(entry.contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;
    const ratio = window.devicePixelRatio || 1;
    element.width = width * ratio;
    element.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    const colors = resolvedSectionColors();
    const n = data.chapters.length;
    const x = (i: number) => ((i + 0.5) / n) * width;
    const base = height - 22;

    // One stroke per arc: overlapping arcs must add up (a single path would paint its overlaps once,
    // turning the lace into a flat wash). Weak links first so the strong ones sit on top.
    const focused = focus || hover?.code || "";
    const perCount = focused ? 0.12 : 0.018;
    const ceiling = focused ? 0.9 : 0.35;
    context.lineWidth = focused ? 0.8 : 0.55;
    for (const [a, b, count] of data.arcs) {
      if (focused && prepared.bookOf[a] !== focused && prepared.bookOf[b] !== focused) continue;
      const x1 = x(a);
      const radius = (x(b) - x1) / 2;
      context.beginPath();
      context.arc(x1 + radius, base, radius, Math.PI, 0);
      // Lit-up book: colour each arc by the section at its OTHER end, so you see where its links go.
      const other = focused && prepared.bookOf[a] === focused ? b : a;
      context.strokeStyle = colors[prepared.sectionOf[other]];
      context.globalAlpha = Math.min(ceiling, perCount * (1 + Math.log2(count)));
      context.stroke();
    }
    context.globalAlpha = 1;
    // The chapter bar.
    for (let i = 0; i < n; i++) {
      context.fillStyle = colors[prepared.sectionOf[i]];
      context.globalAlpha = focused && prepared.bookOf[i] !== focused ? 0.35 : 1;
      context.fillRect((i / n) * width, base + 3, width / n + 0.4, 12);
    }
    context.globalAlpha = 1;
  }, [data, prepared, width, height, focus, hover, themeVersion]);

  const pickAt = (clientX: number) => {
    const rect = canvas.current?.getBoundingClientRect();
    if (!rect) return null;
    const index = Math.floor(((clientX - rect.left) / rect.width) * data.chapters.length);
    return prepared.bookStarts.find((b) => index >= b.start && index <= b.end) ?? null;
  };

  const focusedBook = prepared.bookStarts.find((b) => b.code === (focus || hover?.code));
  const focusedCount = useMemo(() => {
    if (!focusedBook) return 0;
    return data.arcs.reduce((sum, [a, b, count]) => sum + (prepared.bookOf[a] === focusedBook.code || prepared.bookOf[b] === focusedBook.code ? count : 0), 0);
  }, [focusedBook, data.arcs, prepared.bookOf]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-muted">Light up one book:</span>
          <select value={focus} onChange={(e) => setFocus(e.target.value)} className="h-9 rounded-lg border border-line bg-surface px-2">
            <option value="">All books</option>
            {prepared.bookStarts.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <span className="text-muted" aria-live="polite">
          {focusedBook
            ? `${focusedBook.name}: ${formatNumber(focusedCount)} cross-references to or from other chapters`
            : `${formatNumber(data.arcs.reduce((s, a) => s + a[2], 0))} cross-references between ${formatNumber(data.arcs.length)} pairs of chapters`}
        </span>
      </div>
      <div ref={wrap} className="relative w-full">
        <canvas
          ref={canvas}
          style={{ width, height }}
          className="block cursor-crosshair"
          role="img"
          aria-label="Arc diagram: every cross-reference between two chapters of the Bible drawn as an arc above a bar of all chapters, coloured by section"
          onMouseMove={(e) => setHover(pickAt(e.clientX))}
          onMouseLeave={() => setHover(null)}
          onClick={(e) => {
            const book = pickAt(e.clientX);
            setFocus((current) => (book && book.code !== current ? book.code : ""));
          }}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {SECTIONS.filter((s) => s.id !== "apocrypha").map((s) => (
          <span key={s.id} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: `var(--${s.id})` }} /> {s.name}
          </span>
        ))}
        <span>· Point at the bar to light up a book; click to keep it.</span>
      </div>
    </div>
  );
}
