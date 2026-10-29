import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { SectionFilter } from "@/components/charts/SectionGuide";
import { useCatalog } from "@/lib/catalog";
import { loadChapterSummaries, type ChapterSummary } from "@/lib/data";
import { lastReadPath } from "@/lib/last-read";
import { sectionColor } from "@/lib/sections";
import { cn, formatNumber } from "@/lib/utils";
import { ChapterPanel, type SummaryState } from "@/pages/library/ChapterPanel";
import { minutesToRead, type Bar, type BookSpan, type Library } from "@/pages/library/model";
import "@/pages/library/library.css";
import { ChapterCompanions } from "./ChapterCompanions";

type Metric = "words" | "verses" | "chapters";
const METRICS: Metric[] = ["words", "verses", "chapters"];
type BookSummaries = Record<string, { status: "loading" } | { status: "ready"; chapters: Record<string, ChapterSummary> } | { status: "missing" }>;

/** The book lengths; the chosen book opens below the whole list: its chapters as a strip, then the chosen chapter's AI
 *  summary card (the Library page's own ChapterPanel). Replaces the separate Book lengths and Chapter atlas charts. */
export function BookChapters({ library, section }: { library: Library; section: SectionFilter }) {
  const catalog = useCatalog();
  const [metric, setMetric] = useState<Metric>("words");
  const [order, setOrder] = useState<"canon" | "longest">("canon");
  const [chosen, setChosen] = useState(0); // a chapter index into library.bars; -1 = no book open
  const [summaries, setSummaries] = useState<BookSummaries>({});
  const opened = useRef<HTMLDivElement>(null);

  const verses = useMemo(() => library.books.map((b) => library.bars.slice(b.start, b.start + b.count).reduce((n, bar) => n + bar.verses, 0)), [library]);
  const value = (b: BookSpan) => (metric === "words" ? b.words : metric === "verses" ? verses[b.index] : b.count);
  const books = library.books.filter((b) => !section || b.section === section);
  if (order === "longest") books.sort((a, b) => value(b) - value(a));
  const max = Math.max(1, ...books.map(value));

  const bar: Bar | undefined = chosen >= 0 ? library.bars[chosen] : undefined;
  const shownBook = bar && books.some((b) => b.index === bar.book);

  const code = bar?.code;
  useEffect(() => {
    if (!code || summaries[code]) return;
    setSummaries((all) => ({ ...all, [code]: { status: "loading" } }));
    loadChapterSummaries(code)
      .then((file) => setSummaries((all) => ({ ...all, [code]: { status: "ready", chapters: file.chapters } })))
      .catch((error: unknown) => {
        console.warn(`structure mock-up: no chapter summaries for ${code}`, error);
        setSummaries((all) => ({ ...all, [code]: { status: "missing" } }));
      });
  }, [code, summaries]);

  // The open book sits below the whole list: choosing a book brings it into view (not on first load, Genesis by default).
  const openBook = bar?.book;
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    opened.current?.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [openBook]);

  const summaryOf = (b: Bar): SummaryState => {
    const book = summaries[b.code];
    if (!book || book.status === "loading") return { status: "loading" };
    return book.status === "ready" ? { status: "ready", summary: book.chapters[String(b.chapter)] } : { status: "missing" };
  };
  const lastSlug = lastReadPath()?.split("/")[2];
  const readHref = (b: Bar) => {
    const version = catalog.translations.find((t) => t.slug === lastSlug);
    const fits = version?.numbering === "english" && version.books[b.code]?.includes(String(b.chapter));
    return `/read/${fits ? version.slug : "kjv"}/${b.code}/${b.chapter}`;
  };
  const toggle = (book: BookSpan) => setChosen(bar?.book === book.index ? -1 : book.start);

  return (
    <div>
      <div className="chart-controls">
        <div role="group" aria-label="Measure" className="inline-flex rounded-full bg-surface-2 p-0.5">
          {METRICS.map((m) => <button key={m} type="button" aria-pressed={metric === m} onClick={() => setMetric(m)}
            className={cn("rounded-full px-3 py-1.5 capitalize", metric === m ? "bg-ink text-page" : "text-muted hover:text-ink")}>{m}</button>)}
        </div>
        <label>Order<select aria-label="Order" value={order} onChange={(event) => setOrder(event.target.value as "canon" | "longest")}><option value="canon">Bible order</option><option value="longest">Longest first</option></select></label>
        <span className="shape-hint">Choose a book to open its chapters and their summaries.</span>
      </div>
      <ol className="shape-books">
        {books.map((b) => (
          <li key={b.code}>
            <button type="button" aria-expanded={bar?.book === b.index} className={bar?.book === b.index ? "on" : undefined} onClick={() => toggle(b)}
              aria-label={`${b.name}: ${formatNumber(value(b))} ${metric}. ${bar?.book === b.index ? "Close" : "Open"} its chapters.`}>
              <span className="truncate text-right">{b.name}</span>
              <span className="size-bar-track"><span style={{ width: Math.max(0.5, (value(b) / max) * 100) + "%", background: sectionColor(b.section) }} /></span>
              <span className="text-right tabular-nums text-muted">{formatNumber(value(b))}</span>
            </button>
          </li>
        ))}
      </ol>
      {bar && shownBook && (
        <div ref={opened} className="shape-open" style={{ "--tone": `var(--${bar.section})` } as CSSProperties}>
          <OpenBook library={library} bar={bar} summaries={summaries} onSelect={setChosen} onClose={() => setChosen(-1)} />
          <ChapterPanel library={library} index={chosen} summary={summaryOf(bar)} readHref={readHref(bar)} onSelect={setChosen} />
          <ChapterCompanions code={bar.code} bookNumber={bar.book + 1} chapter={bar.chapter} name={`${bar.name} ${bar.chapter}`} />
        </div>
      )}
    </div>
  );
}

/** The open book's heading and its chapters as one strip of bars, each as tall as its word count. */
function OpenBook({ library, bar, summaries, onSelect, onClose }: { library: Library; bar: Bar; summaries: BookSummaries; onSelect: (index: number) => void; onClose: () => void }) {
  const book = library.books[bar.book];
  const chapters = library.bars.slice(book.start, book.start + book.count);
  const maxWords = Math.max(...chapters.map((c) => c.words));
  const [hover, setHover] = useState<Bar | null>(null);
  const file = summaries[book.code];
  const titleOf = (c: Bar) => (file?.status === "ready" ? file.chapters[String(c.chapter)]?.title : undefined);
  const shown = hover ?? bar;
  const labelEvery = book.count > 60 ? 10 : book.count > 30 ? 5 : 1;
  return (
    <div className="shape-book" style={{ "--tone": `var(--${book.section})` } as CSSProperties}>
      <div className="shape-book-head">
        <div><h3>{book.name}</h3><p>{book.count} {book.count === 1 ? "chapter" : "chapters"} · {formatNumber(book.words)} words · about {minutesToRead(book.words)} min to read</p></div>
        <button type="button" onClick={onClose} aria-label={`Close ${book.name}`}><X size={16} aria-hidden="true" /></button>
      </div>
      <p className="shape-book-detail" aria-live="polite"><strong>{shown.name} {shown.chapter}</strong>{titleOf(shown) && <em>{titleOf(shown)}</em>}<span>{shown.verses} verses · {formatNumber(shown.words)} words</span></p>
      <div className="shape-strip" style={{ "--gap": `${book.count > 80 ? 1 : book.count > 40 ? 2 : 4}px` } as CSSProperties} onMouseLeave={() => setHover(null)}>
        {chapters.map((c) => (
          <button key={c.index} type="button" className={c.index === bar.index ? "on" : undefined}
            aria-label={`${c.name} ${c.chapter}${titleOf(c) ? ": " + titleOf(c) : ""}`} aria-pressed={c.index === bar.index}
            onMouseEnter={() => setHover(c)} onFocus={() => setHover(c)} onBlur={() => setHover(null)} onClick={() => onSelect(c.index)}>
            <i style={{ height: `${Math.max(6, (c.words / maxWords) * 100)}%` }} />
            <span>{c.chapter === 1 || c.chapter % labelEvery === 0 ? c.chapter : ""}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
