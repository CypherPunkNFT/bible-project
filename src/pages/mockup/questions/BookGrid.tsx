// 01 Questions book by book: one tile per book, coloured by its section and deeper where more questions are tied to
// it. Hovering a tile names it on the line below; choosing one filters the questions further down.
import { useState, type CSSProperties } from "react";
import type { BankBook } from "@/lib/data";
import { SectionHead } from "./shared";

const LEGEND: [string, string][] = [["history", "Law & history"], ["poetry", "Poetry & wisdom"], ["prophets", "Prophets"],
  ["gospels", "Gospels & Acts"], ["epistles", "Letters"], ["revelation", "Revelation"]];

interface Props { books: BankBook[]; counts: Map<string, number>; selected: string; onChoose: (code: string) => void }

export function BookGrid({ books, counts, selected, onChoose }: Props) {
  const [hover, setHover] = useState<BankBook | null>(null);
  const max = Math.max(1, ...counts.values());
  const shown = hover ?? books.find((b) => b.code === selected) ?? null;
  const count = (code: string) => counts.get(code) ?? 0;
  return <section className="qp-section qp-books" aria-labelledby="qp-books-title">
    <SectionHead n="01" id="qp-books-title" title={<>Questions <em>book by book</em></>}
      lead="Every book of the Bible with the questions tied to it, by their reference or by naming it. The deeper the colour, the more questions. Choose a book to see its questions below." />
    {([["OT", "Old Testament"], ["NT", "New Testament"]] as const).map(([testament, label]) => <div className="qp-book-row" key={testament}>
      <span className="qp-book-label">{label}</span>
      <div className="qp-book-tiles">{books.filter((b) => b.testament === testament).map((b) => {
        const n = count(b.code), on = selected === b.code;
        const style = { "--tone": `var(--${b.section})`, "--heat": `${Math.round(8 + 72 * Math.sqrt(n / max))}%` } as CSSProperties;
        return <button key={b.code} type="button" style={style} aria-pressed={on} aria-label={`${b.name}, ${n} questions`}
          className={`qp-book${n / max > 0.5 ? " is-deep" : ""}${on ? " is-on" : ""}`} disabled={!n && !on}
          onMouseEnter={() => setHover(b)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(b)} onBlur={() => setHover(null)}
          onClick={() => onChoose(on ? "" : b.code)}>
          <span>{b.short}</span><small>{n}</small>
        </button>;
      })}</div>
    </div>)}
    <div className="qp-book-foot">
      <p aria-live="polite">{shown
        ? <><strong>{shown.name}</strong> · {count(shown.code).toLocaleString()} questions{selected === shown.code ? " · shown below" : ""}</>
        : "Point at a book to see how many questions it has."}</p>
      <ul className="qp-legend">{LEGEND.map(([section, label]) => <li key={section} style={{ "--tone": `var(--${section})` } as CSSProperties}>{label}</li>)}</ul>
    </div>
  </section>;
}
