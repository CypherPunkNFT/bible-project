import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { StableTip } from "@/components/StableTip";
import { FlowChart } from "@/components/letters/FlowChart";
import { useVerseIndex } from "@/components/letters/letter-hooks";
import { Section } from "@/components/letters/LetterParts";
import type { Flow } from "@/data/letters/types";
import type { Prophet, Span } from "@/data/people-pages/types";
import { useCatalog } from "@/lib/catalog";
import { bookByNum, formatRange, splitId } from "@/lib/refs";
import { studyRefLink } from "@/lib/study";
import type { Catalog } from "@/lib/types";
import { EvidenceClaim } from "./Evidence";
import { ReadLink } from "./ProphetSections";

type Book = Prophet["books"][number];

/**
 * The books that bear the prophet's name (writing prophets only): what each contains, its outline as bars as long as
 * their parts, the places the New Testament quotes marked above the bars, and those quotations as a flow from the
 * book's chapters to the New Testament books (the Letters pages' Flow chart). Nothing is retold beyond the outline.
 */
export function BookSection({ prophet, singer }: { prophet: Prophet; singer?: boolean }) {
  const catalog = useCatalog();
  if (!prophet.books.length) return null;
  const psalms = prophet.books.every((b) => b.code === "PSA");
  return <Section id="pp-book" kicker={prophet.books.length > 1 ? "The books" : psalms && singer ? "The psalms" : "The book"}
    title={psalms && singer ? "The psalms that bear the name" : prophet.books.length > 1 ? `${prophet.books.length} books bear the name` : `The book of ${prophet.books[0].title}`}
    lead="Its parts in order, as long as they are. Ticks above the bar mark the verses the New Testament quotes.">
    {prophet.books.map((book, i) => <div key={book.code + i} className={i > 0 ? "pp-divider-top" : undefined}>
      <div className="pp-book-head">
        {prophet.books.length > 1 ? <h4>{book.title}</h4> : <span />}
        <ReadLink code={book.code} name={catalog.books.find((b) => b.code === book.code)?.name ?? book.title} />
      </div>
      <EvidenceClaim claim={book.claim} as="div" />
      {book.outline.length > 0 && <OutlineBars book={book} />}
      {book.quotedInNT.length > 0 && <>
        <p className="pp-label" style={{ marginTop: "1.4rem" }}>Where the New Testament quotes it · {book.quotedInNT.length}</p>
        <FlowChart flow={quotationFlow(catalog, book)} />
      </>}
    </div>)}
  </Section>;
}

const chapterLabel = (catalog: Catalog, id: number) => { const { num, chapter } = splitId(id); return `${bookByNum(catalog, num)?.name ?? ""} ${chapter}`; };

/** The book's chapters (left) flowing into the New Testament books that quote them (right, in canonical order). */
function quotationFlow(catalog: Catalog, book: Book): Flow {
  const links = new Map<string, Flow["links"][number]>();
  const sorted = [...book.quotedInNT].sort((a, b) => a.at[0] - b.at[0]);
  for (const q of sorted) {
    const source = chapterLabel(catalog, q.from[0]);
    const target = bookByNum(catalog, splitId(q.at[0]).num)?.name ?? "";
    const key = `${source}→${target}`;
    const link = links.get(key) ?? { source, target, value: 0, refs: [] };
    link.value += 1;
    link.refs!.push(q.at);
    links.set(key, link);
  }
  const books = new Set([...links.values()].map((l) => l.target));
  return { id: `${book.code}-nt`, title: `Where the New Testament quotes ${book.title}`, links: [...links.values()],
    claim: { text: `Each band joins a chapter of ${book.title} to the New Testament ${books.size === 1 ? "book" : "books"} quoting it (${books.size === 1 ? "one book" : `${books.size} books`}).` } };
}

/** The outline as one bar of parts, each as long as its verses; pointing at a part names it, choosing opens it. */
function OutlineBars({ book }: { book: Book }) {
  const catalog = useCatalog();
  const index = useVerseIndex();
  const [lit, setLit] = useState<number | null>(null);
  if (!index) return <div className="pp-outline" style={{ minHeight: 64 }} />;
  const size = (span: Span) => Math.max(1, index(span[1]) - index(span[0]) + 1);
  const start = index(book.outline[0].span[0]);
  const total = Math.max(1, index(book.outline[book.outline.length - 1].span[1]) - start + 1);
  const ticks = book.quotedInNT.map((q) => ({ at: q.at, x: ((index(q.from[0]) - start) / total) * 100 })).filter((t) => t.x >= 0 && t.x <= 100);
  const part = lit !== null ? book.outline[lit] : undefined;
  const outlineResting = `${book.outline.length} parts. Point at one to name it; choose it to read.`;
  const partTip = (o: (typeof book.outline)[number]) => <><strong>{o.title}</strong> · {formatRange(catalog, o.span[0], o.span[1])}</>;
  return <div className="pp-outline">
    {ticks.length > 0 && <div className="pp-outline-ticks" aria-hidden>{ticks.map((t, i) => <i key={i} style={{ left: `${t.x}%` }} />)}</div>}
    {/* The Letters pages' outline bars (letters.css lg-outline): the in-bar names drop on phones; the list names them. */}
    <nav className="lg-outline" aria-label={`${book.title}: its parts`}>
      {book.outline.map((o, i) => <Link key={o.title + i} className="lg-outline-part" to={studyRefLink(catalog, o.span)} style={{ flexGrow: size(o.span) } as CSSProperties} data-kept={lit === i ? "" : undefined}
        aria-label={`${i + 1}. ${o.title}, ${formatRange(catalog, o.span[0], o.span[1])}`}
        onMouseEnter={() => setLit(i)} onMouseLeave={() => setLit(null)} onFocus={() => setLit(i)} onBlur={() => setLit(null)}><span>{i + 1} · {o.title}</span></Link>)}
    </nav>
    <StableTip className="pp-outline-tip" show={part ? partTip(part) : outlineResting} options={[outlineResting, ...book.outline.map(partTip)]} />
    <ol className="pp-outline-list">{book.outline.map((o, i) => <li key={o.title + i} data-lit={lit === i ? "" : undefined} onMouseEnter={() => setLit(i)} onMouseLeave={() => setLit(null)}>
      <span className="pp-outline-n">{i + 1}</span><span>{o.title}</span><Link to={studyRefLink(catalog, o.span)}>{formatRange(catalog, o.span[0], o.span[1])}</Link>
    </li>)}</ol>
  </div>;
}
