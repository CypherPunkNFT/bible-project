// The first three sections after the face (approved mock-up D: js/shelf.js, evidence.js, trail.js): the surviving books,
// the five kinds of evidence, and one writing followed through the records that speak to it.
import { useState, type CSSProperties, type ReactNode } from "react";
import { SectionHead } from "@/pages/study/manuscripts/parts";
import { CN, D, name, records, tone } from "./model";
import { Cite, PictureImg } from "./parts";

/** The six pictured codices as short cards (picture, date, name, where it is kept); each opens its picture's sheet. */
export function Shelf({ num }: { num: string }) {
  return <>
    <SectionHead num={num} kicker="The surviving books" title={<>Before any list, <em>the books</em></>}
      lead="Long before anyone wrote down a list, writings were copied by hand. A codex shows which writings were bound together; on its own it does not show which a community counted as canonical." />
    <div className="cn-strip-row cn-strip-shelf">{CN.pictured.map((p) => <button key={p.q} type="button" className="cn-strip-item" data-picture={p.q}>
      <PictureImg p={p} /><span><small>{p.date}</small><b>{p.name}</b>{p.holder}</span></button>)}</div>
    <p className="cn-caption">Pictures: public domain, from Wikimedia Commons; each is credited when opened.</p>
  </>;
}

const ART: Record<string, ReactNode> = {
  Quoted: <path d="M8 10c-2 0-3 1.5-3 3.5S6 17 8 17s3-1.5 3-3.5c0-3-2-6-5-7M19 10c-2 0-3 1.5-3 3.5s1 3.5 3 3.5 3-1.5 3-3.5c0-3-2-6-5-7" />,
  "Public reading": <path d="M5 9.5 12 6l7 3.5M7 8.5V20M17 8.5V20M9 13h6M10 16h4" />,
  Copied: <><path d="M12 6.5c-2-1.6-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z" /><path d="M12 6.5V20M6.5 9h3M6.5 12h3M14.5 9h3M14.5 12h3" /></>,
  Recommended: <><path d="M7 4h10l2 2v14H5V6z" /><path d="M9 10h6M9 13h6M9 16h3" /><path d="M16 15.5l1.2 1.2 2.3-2.6" /></>,
  Canonical: <><path d="M7 4h10l2 2v14H5V6z" /><path d="M8.5 9.5l1 1 1.8-2M13 9.5h3M8.5 13.5l1 1 1.8-2M13 13.5h3M8.5 17.5l1 1 1.8-2M13 17.5h3" /></>,
};

/** "Five claims that are not interchangeable": each kind of evidence with its drawing, and what it can establish. */
export function Evidence({ num }: { num: string }) {
  const [kind, setKind] = useState(0);
  const k = D.evidenceKinds[kind];
  return <>
    <SectionHead num={num} kicker="Read the evidence" title={<>Five claims that are <em>not interchangeable</em></>}
      lead="Here, canon means a recognized collection of scriptural books. Select a kind of evidence to see what it can establish." />
    <div className="ce-row" role="group" aria-label="Kinds of evidence">{D.evidenceKinds.map((x, i) => <button key={x.id} type="button" className="ce-kind" aria-pressed={i === kind} onClick={() => setKind(i)}>
      <span className="ce-art"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ART[x.id] ?? ART.Copied}</svg></span>
      <small>0{i + 1}</small><b>{x.id}</b></button>)}</div>
    <div className="ce-say" aria-live="polite"><p className="kicker">What does this establish?</p><h3>{k.example}</h3><p>{k.meaning}</p><Cite ids={k.sourceIds} />
      <small>These are kinds of evidence, not a five-step ladder every book climbed.</small></div>
  </>;
}

const BOOKS = [["Hermas", "Shepherd of Hermas"], ["Esther", "Esther"], ["Revelation", "Revelation"]] as const;

/** "Follow a writing. Watch the claim change.": the records that speak to one writing, in date order, as a path of stops. */
export function Trail({ num }: { num: string }) {
  const [book, setBook] = useState<string>("Hermas");
  return <>
    <SectionHead num={num} kicker="Follow a writing" title={<>Follow a writing. <em>Watch the claim change.</em></>}
      lead="The writing stays the same; the kind and reach of the evidence change. Open any stop to inspect its full record." />
    <div className="ct-sort" role="radiogroup" aria-label="Follow a writing">{BOOKS.map(([id, label]) =>
      <button key={id} type="button" role="radio" aria-checked={id === book} onClick={() => setBook(id)}>{label}</button>)}</div>
    <p className="ct-note" aria-live="polite">{CN.trailNotes[book]}</p>
    <ol className="ct-path">{records.filter((r) => r.books?.[book]).map((r, i) => <li key={r.id} style={{ "--tone": tone(r.id), "--i": i } as CSSProperties}>
      <button type="button" data-open={r.id}><span className="ct-dot" aria-hidden="true"></span><span className="ct-when"><small>{r.date}</small><b>{name(r.id)}</b></span>
        <p>{r.books?.[book]}</p><span className="ct-go" aria-hidden="true">↗</span><span className="sr-only">Inspect record and sources</span></button></li>)}</ol>
    <p className="cn-caption">Only records relevant to this trail are shown. Silence in another selected record is not counted as rejection.</p>
  </>;
}
