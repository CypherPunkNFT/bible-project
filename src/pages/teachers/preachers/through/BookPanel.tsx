// The narrow book panel of "Teachers through the Bible": every work of the chosen teacher on the chosen book, each
// linking to the work itself, with a small link to the chapter in the site's reader.
import { memo, useEffect, useRef, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen } from "lucide-react";
import type { Book } from "@/data/teachers/pages-types";
import { familyOf } from "../../shared/people";
import { SECTION_LABEL } from "../bible/model";
import { plural } from "../bible/words";
import { bookOf, chapterOf, exactYear, formatDate, type Entry, type Timeline, type Track } from "./model";

export type Order = "text" | "date";
const bookName = (book: Book) => (book.name === "Psalms" ? "Psalm" : book.name);
const tone = (token: string) => ({ "--tone": `var(${token})` }) as CSSProperties;

function WorkItem({ entry, books, owner, everyone }: { entry: Entry; books: Book[]; owner: Track | undefined; everyone: boolean }) {
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
  return <li className="thr-item">
    {work.u
      ? <a className="thr-work" href={work.u} target="_blank" rel="noreferrer" aria-label={`${work.t}, ${volume ? "read in the volume" : `read the ${kind}`} (opens a new tab)`}>{work.t}</a>
      : <span className="thr-work">{work.t}</span>}
    <p className="thr-meta">{bits.flatMap((bit, i) => (i ? [<span key={`sep-${i}`} className="thr-sep">·</span>, bit] : [bit]))}</p>
    {work.u && <a className="thr-go" href={work.u} target="_blank" rel="noreferrer">{volume ? "Read in the volume" : `Read the ${kind}`}<ArrowUpRight size={12} strokeWidth={1.5} aria-hidden /></a>}
  </li>;
}

interface PanelProps { books: Book[]; track: Track; byId: Map<string, Track>; timeline: Timeline | null; year: number; selected: number; order: Order; onOrder: (order: Order) => void }

export const BookPanel = memo(function BookPanel({ books, track, byId, timeline, year, selected, order, onOrder }: PanelProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const book = books[selected];
  const limited = timeline !== null && year < timeline.all;
  const entries = track.byBook[selected].filter(({ work }) => !limited || (track.inLife(work) && (exactYear(work) ?? Infinity) <= year));
  const sorted = order === "date" ? [...entries].sort((a, b) => (a.work.d ?? "9").localeCompare(b.work.d ?? "9") || a.work.v - b.work.v) : entries;
  const who = track.person ? track.person.short : "every teacher";
  useEffect(() => { if (listRef.current) listRef.current.scrollTop = 0; }, [track, selected, year, order]);

  const items: JSX.Element[] = [];
  let lastChapter = 0;
  sorted.forEach((entry, i) => {
    const chapter = chapterOf(entry.work);
    if (order === "text" && chapter !== lastChapter) items.push(<li key={`ch-${chapter}`} className="thr-chapter">{bookName(book)} {chapter}</li>);
    lastChapter = chapter;
    items.push(<WorkItem key={`${entry.person.id}-${entry.work.v}-${i}`} entry={entry} books={books} owner={byId.get(entry.person.id)} everyone={!track.person} />);
  });

  return <aside className="thr-book" style={tone(`--${book.section}`)}>
    <div className="thr-book-head"><p className="kicker">{SECTION_LABEL[book.section]}</p><h3>{book.name}</h3>
      <p className="thr-book-sub">{plural(entries.length, "work")}{limited ? ` by ${year}` : ""} · {who}</p>
      <div className="thr-seg" role="group" aria-label="Order" hidden={!entries.some(({ work }) => work.d)}>
        <button type="button" aria-pressed={order === "text"} onClick={() => onOrder("text")}>By chapter</button>
        <button type="button" aria-pressed={order === "date"} onClick={() => onOrder("date")}>By date</button></div></div>
    <ol className="thr-list slim-scroll" ref={listRef}>
      {items.length ? items : <li className="thr-empty">{limited ? `No works on ${book.name} by ${year}.` : `No works on ${book.name} by ${track.person ? track.person.short : "any teacher"} in the library yet.`}</li>}
    </ol>
  </aside>;
});
