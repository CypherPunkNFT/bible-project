// Section 05 (mock-up D's gaps(), from direction C's four kinds of evidence): the broken edge of P46 first, then three
// tests on real cases, an unfinished copy (GA 304), a lost leaf (P45) and related copies (the invented copying model with
// its paths always shown). Pieces from js/evidence-widgets.js.
import { useState } from "react";
import { copying, ga304, heads, kinds, quiz, type KindId } from "./evidence";
import { inkLines } from "./ink";
import { Restoration } from "./BrokenEdge";
import { Cite, Head, RecButton } from "./parts";
import { Rich } from "./Rich";

/** GA 304 as a page: the biblical extract, then (revealed) commentary, blank space and an erased verse. */
function Ga304Art() {
  return <svg className="g3-art" viewBox="0 0 300 360" aria-hidden="true">
    <path className="g3-leaf" d="M24 14 Q150 6 276 16 V346 Q150 338 24 348Z" />
    <g className="g3-zone g3-z0"><text className="g3-label" x="44" y="40">BIBLICAL TEXT · MARK 16:1–8</text>{inkLines(44, 56, 212, 6, 10, 1)}<text className="g3-greek" x="44" y="128" lang="grc">ἐφοβοῦντο γάρ</text></g>
    <g className="g3-zone g3-z1"><text className="g3-label" x="44" y="158">COMMENTARY FOLLOWS · A SCHOLIUM</text>{inkLines(56, 172, 200, 6, 8, 4, "3 1.5 2 1.5")}<circle className="g3-dot" cx="150" cy="226" r="2" /></g>
    <g className="g3-zone g3-z2"><text className="g3-label" x="44" y="252">BLANK SPACE REMAINS</text><rect className="g3-blank" x="44" y="260" width="212" height="30" rx="2" /></g>
    <g className="g3-zone g3-z3"><text className="g3-label" x="44" y="310">A CLOSING VERSE, ADDED AND ERASED</text><path className="g3-erased" d="M60 324h180" /><path className="g3-erase-mark" d="M56 318l188 12M56 330l188-12" /></g>
  </svg>;
}
function Ga304() {
  const [shown, setShown] = useState(false);
  return <>
    <h3><Rich text={ga304.title} /></h3>
    <div className={`g3 is-loop${shown ? " is-revealed" : ""}`}>
      <div className="g3-stage"><p className="kicker">Sequence diagram · not to scale</p><Ga304Art /></div>
      <div className="g3-copy"><p className="g3-meta">{ga304.meta}</p><p><Rich text={ga304.lead} /></p>
        <button type="button" className="pm-action" aria-pressed={shown} onClick={() => setShown(!shown)}>{shown ? "Hide" : "Reveal"} the surrounding evidence <span aria-hidden="true">→</span></button>
        <div className="g3-find" aria-live="polite">{shown
          ? <><b>Houghton’s reassessment, 2023</b><p>{ga304.finding}</p><p><strong>Still unknown:</strong> {ga304.unknown}</p></>
          : <p>{ga304.before}</p>}</div>
        <Cite ids={ga304.links} /><RecButton rec={ga304.rec} label="Open the record for GA 304" /><small className="pm-note"><Rich text={ga304.credit} /></small>
      </div>
    </div>
  </>;
}

function Quiz() {
  const [answer, setAnswer] = useState<number | null>(null);
  const right = answer === quiz.right;
  return <div className="qz">
    <div><p className="kicker">Try the distinction</p><h3><Rich text={quiz.title} /></h3><p>{quiz.lead}</p></div>
    <div><div className="qz-options" role="group" aria-label="What does P45 establish?">{quiz.options.map((t, i) =>
      <button key={t} type="button" aria-pressed={answer === i} onClick={() => setAnswer(i)}><span>{"ABC"[i]}</span>{t}</button>)}</div>
      <div className="qz-say" role="status">{answer !== null && <>
        <b className={right ? "is-right" : undefined}>{right ? quiz.yes : quiz.no}</b><p>{quiz.explain}</p>
        <Cite ids={quiz.links} /><RecButton rec="Q697885" label="Open the record for P45" /></>}</div></div>
  </div>;
}

const XS = [38, 81, 124, 167, 210, 253, 296, 339, 430, 484];
/** The copying model with its paths always shown: the line beneath says what the paths show. */
function RelatedCopies() {
  const [heading, text] = copying.shown;
  return <div className="cp is-traced">
    <div className="cp-copy"><h3><Rich text={copying.title} /></h3><p>{copying.lead}</p><Cite ids={copying.links} /></div>
    <div className="cp-model"><p className="kicker">{copying.tag}</p>
      <svg viewBox="0 0 560 235" role="img" aria-label={copying.label}>
        <g className="cp-paths"><path className="cp-top" d="M280 30L188 87M280 30L455 87" />
          {XS.slice(0, 8).map((x) => <path key={x} className="cp-a" d={`M188 100L${x} 172`} />)}{XS.slice(8).map((x) => <path key={x} className="cp-b" d={`M455 100L${x} 172`} />)}
          <circle cx="280" cy="28" r="17" /><text x="280" y="34">?</text><circle cx="188" cy="93" r="19" /><text x="188" y="99">A</text><circle cx="455" cy="93" r="19" /><text x="455" y="99">B</text></g>
        {XS.map((x, i) => <g key={x} className={i < 8 ? "cp-copy-a" : "cp-copy-b"}><rect x={x - 15} y="172" width="30" height="40" rx="2" /><text x={x} y="198">{i < 8 ? "A" : "B"}</text></g>)}
      </svg>
      <div className="cp-say" role="status"><b>{heading}</b><p>{text}</p></div></div>
  </div>;
}

const ICONS: Record<KindId, JSX.Element> = {
  restore: <><path d="M4 18l4-12 6-1 2 4-3 9z" /><path d="M16 9h4M17 13h3M16 17h4" strokeDasharray="1.5 2" /></>,
  unfinished: <><path d="M5 3h14v18H5z" /><path d="M8 7h8M8 10h8M8 13h4" /><path d="M8 17h8" strokeDasharray="1.5 2" /></>,
  lost: <><path d="M5 3h14v18H5z" strokeDasharray="2 2.5" /><path d="M9 9l6 6M15 9l-6 6" /></>,
  related: <><circle cx="12" cy="5" r="2.5" /><circle cx="6" cy="19" r="2" /><circle cx="12" cy="19" r="2" /><circle cx="18" cy="19" r="2" /><path d="M12 7.5v9.5M11 7l-4 10M13 7l4 10" /></>,
};
const STAGE: Record<KindId, () => JSX.Element> = { restore: Restoration, unfinished: Ga304, lost: Quiz, related: RelatedCopies };

export function Kinds({ num }: { num: string }) {
  const [kind, setKind] = useState<KindId>("restore");
  const Stage = STAGE[kind];
  return <>
    <Head num={num} kicker={heads.gaps.kicker} title={heads.gaps.title} lead={heads.gaps.lead} />
    <div className="c-kinds" role="group" aria-label="Kinds of evidence">{kinds.map((k) =>
      <button key={k.id} type="button" data-kind={k.id} aria-pressed={k.id === kind} onClick={() => setKind(k.id)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[k.id]}</svg><b>{k.title}</b><small>{k.line}</small></button>)}</div>
    {/* Keyed by the kind, so each test fades in as it opens. */}
    <div className="c-kind-stage" aria-live="polite" key={kind}><Stage /></div>
  </>;
}
