// 01 Choose where, as one wide chart: every book of the Bible a bar as tall as its questions, in its section's colour,
// the two Testaments side by side with their sections named underneath (owner, 2026-10-22: "a very wide horizontal
// visual… bar graphs of chapters and books"). Choosing a book opens a second chart of its chapters, to narrow the
// test to one chapter.
import { useState, type CSSProperties } from "react";
import { useCatalog } from "@/lib/catalog";
import type { BankBook } from "@/lib/data";
import { chaptersOf, type TestQuestion } from "./engine";

const SECTION_NAMES: Record<string, string> = { history: "Law & history", poetry: "Poetry & wisdom", prophets: "Prophets",
  gospels: "Gospels & Acts", epistles: "Letters", revelation: "Revelation" };

/** A bar's height: by the square root, so a book with few questions still shows beside one with hundreds. */
const barHeight = (n: number, max: number) => (n ? `${Math.max(4, Math.round(100 * Math.sqrt(n / max)))}%` : "0%");

/** The books in a row, split where the section changes. */
function sectionRuns(books: BankBook[]) {
  const runs: { section: string; length: number }[] = [];
  for (const b of books) {
    const last = runs[runs.length - 1];
    if (last?.section === b.section) last.length++;
    else runs.push({ section: b.section, length: 1 });
  }
  return runs;
}

interface Props {
  books: BankBook[];
  counts: Map<string, number>;
  selected: string;
  onChoose: (code: string) => void;
  pool: TestQuestion[];
  bookRows: number[];
  chapter: number | null;
  onChapter: (chapter: number | null) => void;
}

export function BookBars({ books, counts, selected, onChoose, pool, bookRows, chapter, onChapter }: Props) {
  const [hover, setHover] = useState<BankBook | null>(null);
  const max = Math.max(1, ...counts.values());
  const count = (code: string) => counts.get(code) ?? 0;
  const chosen = books.find((b) => b.code === selected) ?? null;
  const shown = hover ?? chosen;
  return <div className={`bb${chosen ? " has-choice" : ""}`}>
    <p className="bb-readout" aria-live="polite">{shown
      ? <><strong>{shown.name}</strong> · {count(shown.code).toLocaleString()} questions{shown === chosen ? " · chosen" : ""}</>
      : <><strong>{books.length} books</strong> · point at one to see it, choose one to be tested on it</>}</p>
    <div className="bb-testaments">
      {(["OT", "NT"] as const).map((testament) => {
        const list = books.filter((b) => b.testament === testament);
        return <div className="bb-testament" key={testament} style={{ flexGrow: list.length }}>
          <div className="bb-bars">{list.map((b) => {
            const n = count(b.code), on = b === chosen;
            const style = { "--tone": `var(--${b.section})`, "--h": barHeight(n, max) } as CSSProperties;
            return <button key={b.code} type="button" className={`bb-bar${on ? " is-on" : ""}`} style={style} aria-pressed={on}
              aria-label={`${b.name}, ${n} questions`} disabled={!n && !on} onClick={() => onChoose(on ? "" : b.code)}
              onMouseEnter={() => setHover(b)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(b)} onBlur={() => setHover(null)}>
              <span className="bb-column"><span className="bb-fill" /></span><span className="bb-name">{b.short}</span>
            </button>;
          })}</div>
          <div className="bb-sections">{sectionRuns(list).map((run, i) =>
            <span key={i} className={run.length < 3 ? "is-short" : ""} style={{ flexGrow: run.length, "--tone": `var(--${run.section})` } as CSSProperties}>
              {SECTION_NAMES[run.section] ?? run.section}</span>)}</div>
          <p className="bb-testament-name">{testament === "OT" ? "Old Testament" : "New Testament"}</p>
        </div>;
      })}
    </div>
    {chosen && <ChapterBars key={chosen.code} book={chosen} pool={pool} bookRows={bookRows} chapter={chapter} onChapter={onChapter} />}
  </div>;
}

function ChapterBars({ book, pool, bookRows, chapter, onChapter }: { book: BankBook; pool: TestQuestion[]; bookRows: number[]; chapter: number | null; onChapter: Props["onChapter"] }) {
  const catalog = useCatalog();
  const [hover, setHover] = useState<number | null>(null);
  const counts = new Map<number, number>();
  let untied = 0;
  for (const row of bookRows) {
    const found = chaptersOf(pool[row], book.code);
    if (!found.length) untied++;
    for (const c of found) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const listed = (catalog.translations.find((t) => t.slug === "bsb")?.books[book.code] ?? []).map(Number).filter((c) => c > 0);
  const chapters = listed.length ? listed : Array.from({ length: Math.max(0, ...counts.keys()) }, (_, i) => i + 1);
  const max = Math.max(1, ...counts.values());
  const shown = hover ?? chapter;
  const labelled = (c: number) => chapters.length <= 30 || c === 1 || c % 10 === 0;
  return <div className="bb-chapters" style={{ "--tone": `var(--${book.section})` } as CSSProperties}>
    <div className="bb-chapters-head">
      <p aria-live="polite"><strong>{book.name}</strong>, chapter by chapter{shown
        ? <> · chapter {shown}: {(counts.get(shown) ?? 0).toLocaleString()} questions{shown === chapter ? " · chosen" : ""}</>
        : <> · choose a chapter, or keep the whole book</>}</p>
      <button type="button" className="bb-all" aria-pressed={!chapter} onClick={() => onChapter(null)}>All of {book.name} · {bookRows.length.toLocaleString()}</button>
    </div>
    <div className="bb-chapter-bars">{chapters.map((c) => {
      const n = counts.get(c) ?? 0, on = c === chapter;
      return <button key={c} type="button" className={`bb-chapter${on ? " is-on" : ""}`} style={{ "--h": barHeight(n, max) } as CSSProperties}
        aria-pressed={on} aria-label={`Chapter ${c}, ${n} questions`} disabled={!n && !on} onClick={() => onChapter(on ? null : c)}
        onMouseEnter={() => setHover(c)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(c)} onBlur={() => setHover(null)}>
        <span className="bb-column"><span className="bb-fill" /></span><span className="bb-number">{labelled(c) ? c : ""}</span>
      </button>;
    })}</div>
    {untied > 0 && <p className="bb-note">{untied.toLocaleString()} of its questions name {book.name} without a chapter; they are drawn only with all of the book.</p>}
  </div>;
}
