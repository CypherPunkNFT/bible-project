import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { SECTIONS } from "@/lib/sections";
import type { BookInfo } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

// The emblem's 5 × 5 grid: one square per cell, coloured by the six canon sections in reading order, each fading in
// and out on its own slow beat, so the button reads as "the whole matrix of books".
const EMBLEM = Array.from({ length: 25 }, (_, i) => ({ section: SECTIONS[Math.floor((i / 25) * 6)].id, delay: ((i * 7) % 25) * .22 }));

/** The round matrix emblem that opens the book atlas, with the lit book's name beside it. */
export function BookAtlasButton({ book, onOpen }: { book?: BookInfo; onOpen: () => void }) {
  return <button type="button" className="cx-atlas-button" onClick={onOpen} aria-haspopup="dialog">
    <span className="cx-emblem" aria-hidden="true">
      {EMBLEM.map((cell, i) => <i key={i} style={{ background: `var(--${cell.section})`, animationDelay: `${cell.delay}s` } as CSSProperties} />)}
    </span>
    <span className="cx-atlas-text"><small>{book ? "Lit book" : "All 66 books"}</small><strong>{book?.name ?? "Choose a book"}</strong></span>
  </button>;
}

/** Every book of the canon, grouped by section, each with a fine line for its share of the cross-references. */
export function BookAtlas({ books, totals, selected, onChoose, onClose }: { books: BookInfo[]; totals: Map<string, number>; selected: string; onChoose: (code: string) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  useEffect(() => { dialog.current?.showModal(); }, []);
  const max = useMemo(() => Math.max(1, ...totals.values()), [totals]);
  const match = query.trim().toLowerCase();
  const choose = (code: string) => { onChoose(code); dialog.current?.close(); };
  const groups = SECTIONS.filter((section) => section.id !== "apocrypha").map((section) => ({ section, books: books.filter((book) => book.section === section.id && (!match || book.name.toLowerCase().includes(match))) })).filter((group) => group.books.length);

  return <dialog ref={dialog} className="cx-atlas" onClose={onClose} onClick={(event) => { if (event.target === dialog.current) dialog.current?.close(); }} aria-labelledby="cx-atlas-title">
    <header className="cx-atlas-head">
      <div><p>Choose a book to light up</p><h2 id="cx-atlas-title">The sixty-six books</h2></div>
      <label className="cx-atlas-search"><Search size={15} aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a book" aria-label="Find a book" /></label>
      <button type="button" className="cx-atlas-close" onClick={() => dialog.current?.close()} aria-label="Close"><X size={18} aria-hidden="true" /></button>
    </header>
    <div className="cx-atlas-body">
      <button type="button" className="cx-atlas-all" aria-pressed={!selected} onClick={() => choose("")}>The whole Bible <span>every book at once</span></button>
      {groups.map(({ section, books: list }) => <section key={section.id} className="cx-atlas-group" style={{ "--cx-tone": `var(--${section.id})` } as CSSProperties}>
        <h3>{section.name}<span>{section.span}</span></h3>
        <ol>{list.map((book) => <li key={book.code}><button type="button" aria-pressed={selected === book.code} onClick={() => choose(book.code)}>
          <span className="cx-atlas-name">{book.name}</span>
          <span className="cx-atlas-count">{formatNumber(totals.get(book.code) ?? 0)}</span>
          <i style={{ width: `${Math.max(4, ((totals.get(book.code) ?? 0) / max) * 100)}%` }} aria-hidden="true" />
        </button></li>)}</ol>
      </section>)}
      {!groups.length && <p className="cx-atlas-empty">No book matches “{query}”.</p>}
    </div>
  </dialog>;
}
