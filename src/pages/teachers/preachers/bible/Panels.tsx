// The side panel of "The whole Bible" (and, on phones, the bottom sheet): a summary of the chosen chip, or one chapter
// with who took it as a main text and the titles, each linking to the work itself.
import type { CSSProperties, MouseEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, BookOpen, X } from "lucide-react";
import type { Person } from "@/data/teachers/pages-types";
import { familyOf, formatNumber, lifeLabel } from "../../shared/people";
import { GENRE_WORD, SECTION_LABEL, SHOWN_TITLES, chapterName, readHref, relevant, valueOf, type BibleModel, type Cell, type TitledWork } from "./model";
import { plural } from "./words";

const tone = (token: string) => ({ "--tone": `var(${token})` }) as CSSProperties;
type Open = (id: string, origin: Element) => void;

function PersonButton({ person, label, onOpen }: { person: Person; label?: string; onOpen: Open }) {
  return <button type="button" className="bib-name" onClick={(e: MouseEvent<HTMLButtonElement>) => onOpen(person.id, e.currentTarget)}>{label ?? person.name}</button>;
}

export function Summary({ model, view, narrow, onOpen, onPin }: { model: BibleModel; view: string; narrow: boolean; onOpen: Open; onPin: (i: number) => void }) {
  const meta = model.views.find((v) => v.id === view) ?? model.views[0];
  const lit = model.cells.filter((c) => valueOf(c, view));
  const works = lit.reduce((sum, c) => sum + valueOf(c, view), 0);
  const top = [...lit].sort((a, b) => valueOf(b, view) - valueOf(a, view) || a.i - b.i).slice(0, 6);
  const note = view === "all"
    ? `Spurgeon's sermons are ${formatNumber(model.spurgeonWorks)} of these ${formatNumber(model.totalWorks)}, so his choices set most of the brightness. Choose “Without Spurgeon” to see every other teacher.`
    : view === "others" ? `Every teacher but Spurgeon: ${model.teacherCount - 1} of them. Their works in the library record far fewer Bible texts, so this map is sparse.` : "";
  return <div className="bib-inner" style={tone(meta.tone)}>
    <p className="kicker">{view === "all" ? "Every teacher in the library" : view === "others" ? "Every teacher except Spurgeon" : meta.person ? familyOf(meta.person).label : meta.label}</p>
    <h3>{meta.person ? <PersonButton person={meta.person} onOpen={onOpen} /> : meta.label}{meta.person && <small>{lifeLabel(meta.person)}</small>}</h3>
    <p className="bib-big"><b>{formatNumber(lit.length)}</b> chapters · <b>{formatNumber(works)}</b> {works === 1 ? "work" : "works"}</p>
    {note && <p className="bib-note">{note}</p>}
    <p className="bib-mini">Most taken chapters</p>
    <ol className="bib-top">{top.map((c) => <li key={c.i}><button type="button" onClick={() => onPin(c.i)}><span>{chapterName(model.books, c)}</span><b>{valueOf(c, view)}</b></button></li>)}</ol>
    <p className="bib-hint">{narrow ? "Tap a square" : "Point at a square, or click it to keep it open,"} to see who took that chapter and read what they wrote.</p>
  </div>;
}

function WorkLink({ entry, model }: { entry: TitledWork; model: BibleModel }) {
  const { person, work } = entry;
  const volume = work.u ? (model.sharedUrl.get(person.id)?.get(work.u) ?? 0) > 1 : false;
  const year = work.d ? work.d.slice(0, 4) : "";
  const kind = work.g !== "sermon" && GENRE_WORD[work.g] ? ` · ${GENRE_WORD[work.g]}` : "";
  return <li>
    {work.u
      ? <a className="bib-work" href={work.u} target="_blank" rel="noreferrer" aria-label={`${work.t}, ${volume ? "read in the volume" : "read it"} (opens a new tab)`}><span>{work.t}</span><ArrowUpRight size={13} strokeWidth={1.5} aria-hidden /></a>
      : <span className="bib-work-plain">{work.t}</span>}
    <small>{work.r} · {person.short}{year ? ` · ${year}` : ""}{kind}{work.u && volume && <> · <em>in the volume</em></>}</small>
  </li>;
}

interface ChapterProps { model: BibleModel; cell: Cell; view: string; closable: boolean; expanded: boolean; onOpen: Open; onClose: () => void; onExpand: () => void }

export function ChapterPanel({ model, cell, view, closable, expanded, onOpen, onClose, onExpand }: ChapterProps) {
  const section = model.books[cell.b].section;
  const entries = Object.entries(cell.counts).sort((a, b) => b[1] - a[1]);
  const max = entries.length ? entries[0][1] : 1;
  const list = (model.titles.get(cell.key) ?? []).filter(({ person }) => relevant(view, person.id));
  const counted = entries.filter(([id]) => relevant(view, id)).reduce((sum, [, c]) => sum + c, 0);
  const elsewhere = counted - list.length;
  const shown = expanded ? list : list.slice(0, SHOWN_TITLES);
  const name = chapterName(model.books, cell);
  return <div className="bib-inner" style={tone(`--${section}`)}>
    <div className="bib-top-row"><p className="kicker">{SECTION_LABEL[section]}</p>
      {closable && <button type="button" className="bib-icon-btn" onClick={onClose} aria-label="Close"><X size={16} strokeWidth={1.5} aria-hidden /></button>}</div>
    <h3>{name}<small>{cell.verses} verses</small></h3>
    <p className="bib-note">{cell.total
      ? `${plural(cell.total, "work")} in the library ${cell.total === 1 ? "takes" : "take"} this chapter as their main text, by ${plural(cell.voices, "teacher")}.`
      : "No work in the library takes this chapter as its main text yet."}</p>
    {entries.length > 0 && <ul className="bib-bars">{entries.map(([id, count]) => {
      const person = model.people.get(id);
      if (!person) throw new Error(`The whole Bible: chapter ${cell.key} names "${id}", who is not in the people list`);
      return <li key={id} className={relevant(view, id) ? "" : "bib-faded"} style={tone(familyOf(person).tone)}>
        <PersonButton person={person} label={person.short} onOpen={onOpen} />
        <span className="bib-vbar"><i style={{ width: `${Math.max(4, (count / max) * 100).toFixed(1)}%` }} /></span><b>{count}</b>
      </li>;
    })}</ul>}
    {shown.length > 0 && <><p className="bib-mini">Read their works</p>
      <ul className="bib-titles">{shown.map((entry, i) => <WorkLink key={`${entry.person.id}-${entry.work.v}-${i}`} entry={entry} model={model} />)}</ul></>}
    {list.length > shown.length && <button type="button" className="bib-more" onClick={onExpand}>Show all {formatNumber(list.length)} titles</button>}
    {elsewhere > 0 && <p className="bib-more-note">{plural(elsewhere, "more work")} {elsewhere === 1 ? "takes" : "take"} this chapter alongside an earlier main text, so {elsewhere === 1 ? "it is" : "they are"} listed under that chapter.</p>}
    <Link className="bib-read" to={readHref(model.books, cell)}><BookOpen size={15} strokeWidth={1.5} aria-hidden />Read {name}<ArrowRight size={15} strokeWidth={1.5} aria-hidden /></Link>
  </div>;
}
