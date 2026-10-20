// The prologue and the three chapters (mock-up js/dir-b.js prologue() and chapter(), as D uses them). A chapter: its giant
// numeral, a sky above and a landscape below, the heading with the strip of copies and the list of scenes on the left,
// and on the right a stage that slides sideways between the scenes: the readings at the desk (threads kept clear of the
// lettering), the close reading, and "How an editor reasons". The stage keeps the height of its tallest scene, so moving
// between scenes never changes the chapter's height.
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "../manuscripts/parts";
import { caseById, chapters, heads, intro, layers } from "./evidence";
import { Apparatus, Endings, Lenses } from "./CloseReadings";
import { Desk } from "./Desk";
import { Land, Sky } from "./Landscapes";
import { Head, Reasoning } from "./parts";
import { Rich } from "./Rich";
import { Strip } from "./Strip";

const LAYER_ART = [
  <><path d="M14 50l10-40 30-4 14 12-4 30z" /><path d="M22 20h30M20 28h34M19 36h26" opacity=".5" /></>,
  <><path d="M10 12h60v40H10z" /><path d="M18 22h20M42 22l2 6M18 32h14M36 32h4M44 32h12M18 42h26" opacity=".6" /></>,
  <><path d="M10 12h60v40H10z" /><path d="M18 22h44M18 30h44M18 38h30" /><path d="M18 46h24" strokeDasharray="2 2" opacity=".6" /></>,
];
/** Prologue: the three layers of evidence in one quiet row. */
export function Prologue({ num }: { num: string }) {
  return <>
    <Head num={num} kicker={heads.prologue.kicker} title={heads.prologue.title} lead={intro} />
    <ol className="bp-layers">{layers.map(([t, d], i) => <li key={t}><svg viewBox="0 0 80 60" aria-hidden="true">{LAYER_ART[i]}</svg>
      <span>0{i + 1}</span><b>{t}</b><small>{d}</small></li>)}</ol>
  </>;
}

const CLOSE = { galatians: Apparatus, romans: Lenses, mark: Endings };

/** The sideways stage: one scene in view; the rest hidden from reading and from the keyboard. */
function Stage({ at, scenes }: { at: number; scenes: ReactNode[] }) {
  const stage = useRef<HTMLDivElement>(null), track = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const els = [...(track.current?.children ?? [])] as HTMLElement[];
    els.forEach((el, i) => { el.inert = i !== at; });
  }, [at]);
  useLayoutEffect(() => {
    const els = [...(track.current?.children ?? [])] as HTMLElement[];
    const fit = () => { if (stage.current) stage.current.style.height = `${Math.max(...els.map((el) => el.scrollHeight))}px`; };
    const observer = new ResizeObserver(fit);
    if (track.current) observer.observe(track.current);
    els.forEach((el) => observer.observe(el));
    fit();
    return () => observer.disconnect();
  }, []);
  return <div className="bc-stage" ref={stage}><div className="bc-track" ref={track} style={{ transform: `translateX(${-at * 100}%)` }}>
    {scenes.map((scene, i) => <div key={i} className="bc-scene" data-i={i} aria-hidden={i !== at}>{scene}</div>)}
  </div></div>;
}

export function Chapter({ num, chapter }: { num: string; chapter: (typeof chapters)[number] }) {
  const c = caseById(chapter.caseId), Close = CLOSE[chapter.caseId];
  const titles = ["The readings", chapter.close, "How an editor reasons"];
  const [at, setAt] = useState(0);
  const go = (i: number) => setAt((i + titles.length) % titles.length);
  return <>
    <Sky /><span className="bc-numeral" aria-hidden="true">{chapter.num}</span>
    <div className="bc-grid">
      <div className="bc-side">
        <p className="kicker"><span className="ms-num">{num}</span><span className="ms-dot" aria-hidden="true">·</span>Chapter {chapter.num} · {chapter.kicker}</p>
        <h2><Rich text={chapter.title} /></h2><p className="bc-lead">{c.context}</p>
        <div className="bc-strip"><Strip book={chapter.book} keys={chapter.keys} /></div>
        <ol className="bc-scenes" role="group" aria-label="Scenes">{titles.map((t, i) =>
          <li key={t}><button type="button" data-scene={i} aria-pressed={i === at} onClick={() => go(i)}><span>{String(i + 1).padStart(2, "0")}</span>{t}</button></li>)}</ol>
        <div className="bc-arrows">
          <button type="button" aria-label="Previous scene" onClick={() => go(at - 1)}><Icon name="arrowLeft" size={16} /></button>
          <button type="button" aria-label="Next scene" onClick={() => go(at + 1)}><Icon name="arrowRight" size={16} /></button>
        </div>
      </div>
      <Stage at={at} scenes={[<Desk key="desk" caseId={chapter.caseId} />, <Close key="close" />, <Reasoning key="reason" caseId={chapter.caseId} />]} />
    </div>
    <Land caseId={chapter.caseId} />
  </>;
}
