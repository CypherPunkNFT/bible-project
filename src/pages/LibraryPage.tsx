import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { VersionsList } from "@/components/VersionsList";
import { useCatalog } from "@/lib/catalog";
import { loadChapterSummaries, loadStats, type ChapterSummary } from "@/lib/data";
import { lastReadPath } from "@/lib/last-read";
import { useProgress } from "@/lib/progress";
import { useAsync } from "@/lib/useAsync";
import { formatNumber } from "@/lib/utils";
import { ChapterPanel, type SummaryState } from "./library/ChapterPanel";
import { buildLibrary, findChapter, type Bar, type BookSpan } from "./library/model";
import { Parts } from "./library/Parts";
import type { PartId } from "./library/part-content";
import { River } from "./library/River";
import type { RiverApi } from "./library/useRiver";
import "./library/library.css";

type BookSummaries = Record<string, { status: "loading" } | { status: "ready"; chapters: Record<string, ChapterSummary> } | { status: "missing" }>;

/** Keys the page's ← → must leave alone: typing, and controls that use the arrows themselves. */
function arrowsBelongElsewhere(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) return true;
  const target = event.target instanceof Element ? event.target : null;
  return !!target?.closest('input, textarea, select, [contenteditable="true"], [role="tab"], [role="radio"], [role="group"], [role="slider"]');
}

const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The library: the whole Bible chapter by chapter, the chosen chapter, the six parts, and every version. */
export default function LibraryPage() {
  const catalog = useCatalog();
  const stats = useAsync(loadStats, "stats");
  const progress = useProgress();
  const [params, setParams] = useSearchParams();
  const library = useMemo(() => (stats.status === "ready" ? buildLibrary(stats.value) : null), [stats]);
  const [selection, setSelection] = useState({ index: -1, reveal: false });
  const [part, setPart] = useState<PartId>("gospels");
  const [summaries, setSummaries] = useState<BookSummaries>({});
  const river = useRef<RiverApi | null>(null);
  const panel = useRef<HTMLElement>(null);
  const centerNext = useRef(false);

  // The first chapter shown: the one in the address (?c=ROM.8), else John 1.
  useEffect(() => {
    if (!library || selection.index >= 0) return;
    const fromAddress = findChapter(library, params.get("c"));
    const index = fromAddress >= 0 ? fromAddress : findChapter(library, "JHN.1");
    setSelection({ index, reveal: fromAddress >= 0 });
    setPart(library.bars[index].section);
  }, [library, params, selection.index]);

  const select = useCallback(
    (index: number, { center = false } = {}) => {
      if (!library || index < 0 || index >= library.bars.length) return;
      const bar = library.bars[index];
      setSelection({ index, reveal: true });
      setPart(bar.section);
      centerNext.current = center;
      setParams((current) => {
        const next = new URLSearchParams(current);
        next.set("c", `${bar.code}.${bar.chapter}`);
        return next;
      }, { replace: true });
    },
    [library, setParams],
  );

  // Choosing from below the river brings the chapter to the middle of the screen (its top near the top if taller).
  useEffect(() => {
    if (!centerNext.current || !panel.current) return;
    centerNext.current = false;
    const box = panel.current.getBoundingClientRect();
    const offset = Math.max(24, (innerHeight - box.height) / 2);
    scrollTo({ top: scrollY + box.top - offset, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [selection]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.key !== "ArrowRight" && event.key !== "ArrowLeft") || arrowsBelongElsewhere(event)) return;
      event.preventDefault();
      select(selection.index + (event.key === "ArrowRight" ? 1 : -1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [select, selection.index]);

  const bar: Bar | undefined = library?.bars[selection.index];
  const code = bar?.code;
  useEffect(() => {
    if (!code || summaries[code]) return;
    setSummaries((all) => ({ ...all, [code]: { status: "loading" } }));
    loadChapterSummaries(code)
      .then((file) => setSummaries((all) => ({ ...all, [code]: { status: "ready", chapters: file.chapters } })))
      .catch((error: unknown) => {
        console.warn(`library: no chapter summaries for ${code}`, error);
        setSummaries((all) => ({ ...all, [code]: { status: "missing" } }));
      });
  }, [code, summaries]);

  const summaryOf = (b: Bar): SummaryState => {
    const book = summaries[b.code];
    if (!book || book.status === "loading") return { status: "loading" };
    return book.status === "ready" ? { status: "ready", summary: book.chapters[String(b.chapter)] } : { status: "missing" };
  };
  const titleOf = useCallback((b: Bar) => {
    const book = summaries[b.code];
    return book?.status === "ready" ? book.chapters[String(b.chapter)]?.title : undefined;
  }, [summaries]);

  // Read in the version this browser last read, if it numbers chapters like the KJV and has the chapter; else the KJV.
  const lastSlug = lastReadPath()?.split("/")[2];
  const readHref = (b: Bar) => {
    const version = catalog.translations.find((t) => t.slug === lastSlug);
    const fits = version?.numbering === "english" && version.books[b.code]?.includes(String(b.chapter));
    return `/read/${fits ? version.slug : "kjv"}/${b.code}/${b.chapter}`;
  };

  const showPart = (id: PartId) => {
    river.current?.flyToSection(id);
    document.getElementById("river")?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  };
  const showBook = (book: BookSpan) => {
    river.current?.flyToBook(book.index);
    select(book.start, { center: true });
  };
  const words = library?.bars.reduce((sum, b) => sum + b.words, 0);
  const verses = library?.bars.reduce((sum, b) => sum + b.verses, 0);

  return (
    <div className="lib">
      <header className="lib-intro">
        <p className="lib-eyebrow">
          <span className="lib-rule" />
          The library
        </p>
        <div className="lib-intro-grid">
          <h1>
            The whole Bible,
            <br />
            <em>chapter by chapter.</em>
          </h1>
          <div>
            <p className="lib-lead">Every chapter from Genesis to Revelation, laid out in one line. Zoom in, move along, and open any chapter to see what it holds.</p>
            <dl className="lib-stats">
              <Stat label="books" value={66} />
              <Stat label="chapters" value={library?.bars.length} />
              <Stat label="verses (KJV)" value={verses} />
              <Stat label="words (KJV)" value={words} />
              <Stat label="versions" value={catalog.translations.length} />
            </dl>
          </div>
        </div>
      </header>

      <River library={library} selection={selection} onSelect={select} handle={river} titleOf={titleOf} />

      {library && bar ? (
        <ChapterPanel ref={panel} library={library} index={selection.index} summary={summaryOf(bar)} readHref={readHref(bar)} onSelect={select} />
      ) : (
        <div className="lib-chapter lib-chapter-loading" />
      )}

      {library && (
        <Parts
          library={library}
          part={part}
          onPart={setPart}
          selected={selection.index}
          progress={progress}
          onChapter={(index) => select(index, { center: true })}
          onBook={showBook}
          onShowPart={showPart}
        />
      )}

      <section className="lib-versions" aria-label="Every version">
        <p className="lib-num">03</p>
        <VersionsList />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value === undefined ? "…" : formatNumber(value)}</dd>
    </div>
  );
}
