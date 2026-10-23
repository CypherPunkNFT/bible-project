// questions_mockup 01, redone (owner, 2026-10-23): each colour has its own row of books, a long section split in two
// evenly, the name on its first row (History and the Prophets in two, the Epistles in three), and at the right the hymns page's
// ring of 66 spokes, one per book, as long as its questions (geometry shared with the Preachers and Hymns pages).
// Pointing at a tile or a spoke lights the other and names the book in the ring's centre; choosing either opens that
// book's panel below. It replaced BookGrid.tsx (ARCHIVE/mockups/BookGrid-2026-10-23.tsx). Styles: questions-panels.css (.qx-books, .qx-ring).
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { BankBook } from "@/lib/data";
import { BOOKS, R0, SpokeAnimator, angle, niceStep, point, radiusOf, wedge } from "@/pages/teachers/preachers/through/geometry";
import { SectionHead } from "./shared";

const ROWS = [
  { testament: "Old Testament", label: "Law", from: "GEN", to: "DEU" },
  { label: "History", from: "JOS", to: "1KI" },
  { label: "", from: "2KI", to: "EST" },
  { label: "Poetry & wisdom", from: "JOB", to: "SNG" },
  { label: "Prophets", from: "ISA", to: "OBA" },
  { label: "", from: "JON", to: "MAL" },
  { testament: "New Testament", label: "Gospels & Acts", from: "MAT", to: "ACT" },
  { label: "Epistles", from: "ROM", to: "COL" },
  { label: "", from: "1TH", to: "HEB" },
  { label: "", from: "JAS", to: "JUD" },
  { label: "Revelation", from: "REV", to: "REV" },
];

// A book's name just past its own spoke's tip, turned to read outward (flipped on the left half).
function labelAt(b: number, r: number) {
  const a = angle(b) + Math.PI / BOOKS, deg = (a * 180) / Math.PI, flip = Math.cos(a) < 0;
  return { transform: `translate(${point(r + 8, a).replace(" ", ",")}) rotate(${flip ? deg + 180 : deg})`, anchor: (flip ? "end" : "start") as "end" | "start" };
}

// Which spokes carry a name (owner: at least one book in every 30 degrees): the largest book in each twelfth of the
// ring, then the eight largest overall unless a spoke beside them is already named.
function namedBooks(totals: number[]) {
  const named = new Set<number>();
  for (let sector = 0; sector < 12; sector++) {
    const from = Math.round((sector * BOOKS) / 12), to = Math.round(((sector + 1) * BOOKS) / 12);
    let best = from;
    for (let b = from; b < to; b++) if (totals[b] > totals[best]) best = b;
    if (totals[best]) named.add(best);
  }
  const largest = totals.map((t, b) => [t, b]).sort((x, y) => y[0] - x[0]).slice(0, 8).map(([, b]) => b);
  for (const b of largest) if (!named.has(b - 1) && !named.has(b + 1)) named.add(b);
  return [...named];
}

interface Props { books: BankBook[]; counts: Map<string, number>; selected: string; onChoose: (code: string) => void }

export function BookRing({ books, counts, selected, onChoose }: Props) {
  const [hover, setHover] = useState("");
  const count = (code: string) => counts.get(code) ?? 0;
  const max = Math.max(1, ...counts.values());
  const indexOf = (code: string) => books.findIndex((b) => b.code === code);
  const point = (code: string) => ({ onMouseEnter: () => setHover(code), onMouseLeave: () => setHover(""), onFocus: () => setHover(code), onBlur: () => setHover("") });
  return <section className="qp-section qp-books qx-books" aria-labelledby="qp-books-title">
    <SectionHead n="01" id="qp-books-title" title={<>Questions <em>book by book</em></>}
      lead="Every book of the Bible with the questions tied to it, by their reference or by naming it. The deeper the colour and the longer the spoke, the more questions. Choose a book to see its questions." />
    <div className="qx-books-layout">
      <div className="qx-rows">{ROWS.map((row) => {
        const shelf = books.slice(indexOf(row.from), indexOf(row.to) + 1);
        const tone = { "--tone": `var(--${shelf[0]?.section})` } as CSSProperties;
        return <div key={row.from} className="qx-row-wrap">
          {row.testament && <p className="qp-book-label">{row.testament}</p>}
          <div className="qx-row" style={tone}>
            <span className="qx-row-label" data-empty={row.label ? undefined : ""}>{row.label}</span>
            <div className="qx-row-tiles">{shelf.map((b) => {
              const n = count(b.code), on = selected === b.code;
              const style = { "--heat": `${Math.round(8 + 72 * Math.sqrt(n / max))}%` } as CSSProperties;
              return <button key={b.code} type="button" style={style} aria-pressed={on} aria-label={`${b.name}, ${n} questions`} disabled={!n && !on}
                className={`qp-book${n / max > 0.5 ? " is-deep" : ""}${on ? " is-on" : ""}${hover === b.code ? " is-lit" : ""}`}
                {...point(b.code)} onClick={() => onChoose(on ? "" : b.code)}>
                <span>{b.short}</span><small>{n}</small>
              </button>;
            })}</div>
          </div>
        </div>;
      })}</div>
      <QuestionRing books={books} totals={books.map((b) => count(b.code))} lit={indexOf(hover || selected)}
        chosen={indexOf(selected)} onHover={(b) => setHover(b < 0 ? "" : books[b].code)} onChoose={(b) => onChoose(books[b].code === selected ? "" : books[b].code)} />
    </div>
  </section>;
}

interface RingProps { books: BankBook[]; totals: number[]; lit: number; chosen: number; onHover: (b: number) => void; onChoose: (b: number) => void }

function QuestionRing({ books, totals, lit, chosen, onHover, onChoose }: RingProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const max = Math.max(1, ...totals);
  const top = totals.indexOf(max);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const spokes = new SpokeAnimator(paths.current);
    spokes.setGoals(Float32Array.from(totals, (t) => Math.sqrt(t / max)));
    const firstGrow = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { firstGrow.disconnect(); spokes.grow(); } }, { threshold: 0.2 });
    firstGrow.observe(svg);
    return () => { firstGrow.disconnect(); spokes.stop(); };
  }, [totals.join(), max]); // eslint-disable-line react-hooks/exhaustive-deps -- totals change only with the bank
  const guides = [niceStep(max), max].filter(Boolean).map((v) => ({ v, r: radiusOf(Math.sqrt(v / max)) }));
  const labelled = namedBooks(totals);
  const centre = lit >= 0 ? lit : top;
  return <figure className="qx-ring-card">
    <svg ref={svgRef} className="qx-ring" viewBox="-322 -322 644 644" role="img" aria-label="Questions by book of the Bible: one spoke per book, as long as its questions">
      <g>{guides.map(({ v, r }) => <g key={v}><circle r={r.toFixed(1)} className="qx-ring-guide" />
        <text className="qx-ring-guide-label" textAnchor="middle" y={(r + 13).toFixed(1)}>{v.toLocaleString()}</text></g>)}</g>
      <g onPointerLeave={() => onHover(-1)}>{books.map((book, b) =>
        <path key={book.code} ref={(el) => { paths.current[b] = el; }} fill={`var(--${book.section})`} d={wedge(b, R0)}
          className={[totals[b] ? "" : "is-zero", b === lit ? "is-lit" : "", b === chosen ? "is-on" : ""].join(" ").trim() || undefined}
          onPointerEnter={() => onHover(b)} onClick={() => onChoose(b)}><title>{`${book.name}: ${totals[b]} questions`}</title></path>)}</g>
      <g>{labelled.map((b) => { const at = labelAt(b, radiusOf(Math.sqrt(totals[b] / max))); return <text key={b} className="qx-ring-label" transform={at.transform} textAnchor={at.anchor} dominantBaseline="middle">{books[b].name}</text>; })}</g>
      <circle r={R0 - 6} className="qx-ring-hole" />
      <text className="qx-ring-big" y="0" textAnchor="middle">{totals[centre].toLocaleString()}</text>
      <text className="qx-ring-small" y="26" textAnchor="middle">{books[centre].name}</text>
    </svg>
  </figure>;
}
