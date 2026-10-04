import { memo, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sectionColor } from "@/lib/sections";
import type { Stats } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import type { SectionFilter } from "./SectionGuide";

const ChapterRow = memo(function ChapterRow({ book, max, onInspect }: { book: Stats["books"][number]; max: number; onInspect: (text: string) => void }) {
  const navigate = useNavigate();
  const [focused, setFocused] = useState(0);
  return <div className="chapter-atlas-row"><span>{book.name}</span><div className="chapter-atlas-squares">
    {book.chapters.map(([verses, words], i) => <button key={i} type="button" tabIndex={focused === i ? 0 : -1}
      aria-label={book.name + " " + (i + 1) + ": " + verses + " verses, " + formatNumber(words) + " words"}
      onMouseEnter={() => onInspect(book.name + " " + (i + 1) + " — " + verses + " verses, " + formatNumber(words) + " words")}
      onFocus={() => { setFocused(i); onInspect(book.name + " " + (i + 1) + " — " + verses + " verses, " + formatNumber(words) + " words"); }}
      onKeyDown={(event) => {
        const next = event.key === "ArrowRight" ? Math.min(i + 1, book.chapters.length - 1) : event.key === "ArrowLeft" ? Math.max(i - 1, 0) : event.key === "Home" ? 0 : event.key === "End" ? book.chapters.length - 1 : -1;
        if (next < 0) return;
        event.preventDefault();
        (event.currentTarget.parentElement?.children[next] as HTMLButtonElement | undefined)?.focus();
      }}
      onClick={() => navigate("/read/kjv/" + book.code + "/" + (i + 1))}
      style={{ background: `color-mix(in srgb, ${sectionColor(book.section)} ${Math.round(12 + 55 * Math.sqrt(words / max))}%, var(--page))`, borderColor: `color-mix(in srgb, ${sectionColor(book.section)} 45%, var(--line))` }}>{i + 1}</button>)}
  </div></div>;
});

/** Memoized rows keep pointer inspection from rerendering every chapter button. */
export function ChapterGrid({ stats, section = "" }: { stats: Stats; section?: SectionFilter }) {
  const [hover, setHover] = useState("");
  const canon = useMemo(() => stats.books.filter((b) => b.section !== "apocrypha"), [stats.books]);
  const max = useMemo(() => Math.max(1, ...canon.flatMap((b) => b.chapters.map((c) => c[1]))), [canon]);
  const books = canon.filter((b) => !section || b.section === section);
  return <div>
    <div className="chapter-atlas-key"><strong>{books.length} books · {formatNumber(books.reduce((n, b) => n + b.chapters.length, 0))} chapters</strong><span>One numbered tile = one chapter. Deeper colour = more words.</span></div>
    <p className="chart-live-detail" aria-live="polite">{hover || "Explore a square, then open it to read. Use arrow keys to move within a book."}</p>
    <div className="chapter-atlas">{books.map((book) => <ChapterRow key={book.code} book={book} max={max} onInspect={setHover} />)}</div>
    <div className="chart-legend"><span>Fewer words</span>{[.2, .4, .6, .8, 1].map((opacity) => <i key={opacity} style={{ background: "var(--prophets)", opacity, borderRadius: 2 }} />)}<span>More words · Longest chapter: Psalm 119</span></div>
  </div>;
}
