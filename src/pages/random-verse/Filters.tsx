// Where the verse comes from (the whole Bible, a Testament or one book) and an optional theme. A theme with none of
// its verses in the chosen books is greyed out rather than hidden, so the list never jumps about.
import { useMemo } from "react";
import { SECTIONS } from "@/lib/sections";
import type { BookInfo } from "@/lib/types";
import { makePool, poolSize, type From } from "./pick";
import { THEMES, type Theme } from "./themes";

export function Filters({ books, inScope, from, theme, onFrom, onTheme }: {
  books: readonly BookInfo[]; inScope: readonly string[]; from: From; theme: Theme | undefined;
  onFrom: (from: From) => void; onTheme: (theme: Theme | undefined) => void;
}) {
  const sections = useMemo(() => SECTIONS.map((section) => ({ ...section, books: books.filter((book) => book.section === section.id) }))
    .filter((section) => section.books.length), [books]);
  return (
    <div className="rv-filters">
      <label className="rv-field">
        <span>From</span>
        <select value={from} onChange={(event) => onFrom(event.target.value)}>
          <option value="">Whole Bible</option>
          <option value="ot">Old Testament</option>
          <option value="nt">New Testament</option>
          {sections.map((section) => <optgroup key={section.id} label={section.name}>
            {section.books.map((book) => <option key={book.code} value={book.code}>{book.name}</option>)}
          </optgroup>)}
        </select>
      </label>
      <div className="rv-themes" role="group" aria-label="Theme">
        <button type="button" className="rv-chip" aria-pressed={!theme} onClick={() => onTheme(undefined)}>Any theme</button>
        {THEMES.map((each) => <button key={each.id} type="button" className="rv-chip" aria-pressed={theme?.id === each.id}
          disabled={poolSize(makePool(inScope, each)) === 0} onClick={() => onTheme(each)}>{each.title}</button>)}
      </div>
    </div>
  );
}
