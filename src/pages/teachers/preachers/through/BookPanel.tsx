// The narrow book panel of "Teachers through the Bible": every work of the chosen teacher on the chosen book, each
// linking to the work itself, with a small link to the chapter in the site's reader.
import { memo, useEffect, useMemo, useRef, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen } from "lucide-react";
import type { Book } from "@/data/teachers/pages-types";
import { WindowedRows } from "@/components/WindowedRows";
import { familyOf } from "../../shared/people";
import { SECTION_LABEL } from "../bible/model";
import { bookOf, chapterOf, exactYear, formatDate, type Entry, type Timeline, type Track } from "./model";
import { compareCode, plural } from "@/lib/site-format";

export type Order = "text" | "date";
const bookName = (book: Book) => (book.name === "Psalms" ? "Psalm" : book.name);
const tone = (token: string) => ({ "--tone": `var(${token})` }) as CSSProperties;
// One line of the book's list: a chapter heading (in chapter order), or a work.
interface Line { key: string; chapter: number; entry?: Entry }
const lineKey = (line: Line) => line.key;
const isHeading = (line: Line) => !line.entry;

function WorkItem({ entry, books, owner, everyone, row }: { entry: Entry; books: Book[]; owner: Track | undefined; everyone: boolean; row: number }) {
  const { work, person } = entry;
  const book = books[bookOf(work)], chapter = chapterOf(work), verse = work.v % 1000;
  const volume = Boolean(work.u) && (owner?.urls.get(work.u ?? "") ?? 0) > 1;
  const kind = work.g.replace(/-/g, " ");
  const bits = [
    <Link key="ref" className="thr-ref" to={`/read/kjv/${book.code}/${chapter}${verse > 1 ? `?hl=${verse}` : ""}`} title={`Read ${bookName(book)} ${chapter} on this site`}>
      <BookOpen size={12} strokeWidth={1.5} aria-hidden />{work.t === work.r ? `Read ${bookName(book)} ${chapter}` : work.r}</Link>,
    work.d ? <span key="date">{formatDate(work.d)}</span> : null,
    everyone ? <span key="who" className="thr-who-tag" style={tone(familyOf(person).tone)}>{person.short}</span> : null,
    work.g !== "sermon" ? <span key="kind">{kind}</span> : null,
  ].filter(Boolean);
  return <li className="thr-item" data-row={row}>
    {work.u
      ? <a className="thr-work" href={work.u} target="_blank" rel="noreferrer" aria-label={`${work.t}, ${volume ? "read in the volume" : `read the ${kind}`} (opens a new tab)`}>{work.t}</a>
      : <span className="thr-work">{work.t}</span>}
    <p className="thr-meta">{bits.flatMap((bit, i) => (i ? [<span key={`sep-${i}`} className="thr-sep">·</span>, bit] : [bit]))}</p>
    {work.u && <a className="thr-go" href={work.u} target="_blank" rel="noreferrer">{volume ? "Read in the volume" : `Read the ${kind}`}<ArrowUpRight size={12} strokeWidth={1.5} aria-hidden /></a>}
  </li>;
}

interface PanelProps { books: Book[]; track: Track; byId: Map<string, Track>; timeline: Timeline | null; year: number; selected: number; order: Order; onOrder: (order: Order) => void }

export const BookPanel = memo(function BookPanel({ books, track, byId, timeline, year, selected, order, onOrder }: PanelProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const book = books[selected];
  const limited = timeline !== null && year < timeline.all;
  const entries = useMemo(() => track.byBook[selected].filter(({ work }) => !limited || (track.inLife(work) && (exactYear(work) ?? Infinity) <= year)), [track, selected, limited, year]);
  const who = track.person ? track.person.short : "every teacher";
  useEffect(() => { if (listRef.current) listRef.current.scrollTop = 0; }, [track, selected, year, order]);

  const lines = useMemo(() => {
    const sorted = order === "date" ? [...entries].sort((a, b) => compareCode(a.work.d ?? "9", b.work.d ?? "9") || a.work.v - b.work.v) : entries;
    const out: Line[] = [];
    let lastChapter = 0;
    sorted.forEach((entry, i) => {
      const chapter = chapterOf(entry.work);
      if (order === "text" && chapter !== lastChapter) out.push({ key: `ch-${chapter}`, chapter });
      lastChapter = chapter;
      out.push({ key: `${entry.person.id}-${entry.work.v}-${i}`, chapter, entry });
    });
    return out;
  }, [entries, order]);

  return <aside className="thr-book" style={tone(`--${book.section}`)}>
    <div className="thr-book-head"><p className="kicker">{SECTION_LABEL[book.section]}</p><h3>{book.name}</h3>
      <p className="thr-book-sub">{plural(entries.length, "{n} work", "{n} works")}{limited ? ` by ${year}` : ""} · {who}</p>
      <div className="thr-seg" role="group" aria-label="Order" hidden={!entries.some(({ work }) => work.d)}>
        <button type="button" aria-pressed={order === "text"} onClick={() => onOrder("text")}>By chapter</button>
        <button type="button" aria-pressed={order === "date"} onClick={() => onOrder("date")}>By date</button></div></div>
    {/* Psalms holds hundreds of works: the box scrolls and the list inside is drawn a window of rows at a time, each
        chapter heading a row of its own (owner's scroll rule, 2026-11-17). Headings stick, so they carry data-sticky. */}
    <div className="thr-list slim-scroll" ref={listRef}>
      {lines.length
        ? <WindowedRows as="ol" className="thr-rows" items={lines} itemKey={lineKey} fullRow={isHeading} estimate={84}
          renderItem={(line, row) => line.entry
            ? <WorkItem key={line.key} entry={line.entry} books={books} owner={byId.get(line.entry.person.id)} everyone={!track.person} row={row} />
            : <li key={line.key} className="thr-chapter" data-row={row} data-sticky="">{bookName(book)} {line.chapter}</li>} />
        : <ol className="thr-rows"><li className="thr-empty">{limited ? `No works on ${book.name} by ${year}.` : `No works on ${book.name} by ${track.person ? track.person.short : "any teacher"} in the library yet.`}</li></ol>}
    </div>
  </aside>;
});
