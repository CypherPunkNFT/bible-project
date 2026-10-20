// The last three sections (approved mock-up D: js/compare.js, practice.js, sources.js): two traditions side by side, ten
// questions on how far a piece of evidence can take you, and every source with what was actually read.
import { Fragment, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SectionHead } from "@/pages/study/manuscripts/parts";
import { CN, D } from "./model";
import { Cite } from "./parts";

const T = D.traditions;
const COUNTS = [["Samuel, Kings, Chronicles, Ezra–Nehemiah", "4 → 8"], ["The Twelve Prophets", "1 → 12"], ["Other books", "19 → 19"], ["Total in these counting conventions", "24 → 39"]] as const;
type Tradition = (typeof T)[number];

function Picker({ side, label, t, onPick }: { side: string; label: string; t: Tradition; onPick: (id: string) => void }) {
  return <div className="cc-pick"><label htmlFor={`cc-${side}`}>{label}</label>
    <select id={`cc-${side}`} data-side={side} value={t.id} onChange={(e) => onPick(e.target.value)}>{T.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
    <p className="cc-context">{t.context}</p><p>{t.scope}</p><details><summary>Scope &amp; naming</summary><p>{t.note}</p></details><Cite ids={t.sourceIds} /></div>;
}

/** "Compare collections without a default Bible": two named sources, their scope, the selected writings as a table. */
export function Compare({ num }: { num: string }) {
  const [left, setLeft] = useState("catholic"), [right, setRight] = useState("reformed");
  const a = T.find((t) => t.id === left) ?? T[0], b = T.find((t) => t.id === right) ?? T[0];
  return <>
    <SectionHead num={num} kicker="Compare traditions" title={<>Compare collections <em>without a default Bible</em></>}
      lead="Choose two named sources. These are selected writings, not exhaustive inventories. Read each source’s scope before comparing its entries." />
    <div className="cc-body"><div className="cc-pickers"><Picker side="left" label="First collection" t={a} onPick={setLeft} /><Picker side="right" label="Second collection" t={b} onPick={setRight} /></div>
      {a.id === b.id && <p className="cc-same" role="status">You are viewing the same source on both sides. Choose a different source to compare.</p>}
      <div className="cc-table-wrap" tabIndex={0} role="region" aria-label="Selected writings comparison; scroll horizontally on small screens"><table className="cc-table"><caption>Selected writings · {a.name} and {b.name}</caption>
        <thead><tr><th scope="col">Writing / collection</th><th scope="col">{a.name}</th><th scope="col">{b.name}</th></tr></thead>
        <tbody>{D.comparisonRows.map((row, i) => <tr key={row}><th scope="row">{row}</th><td>{a.states[i]}</td><td>{b.states[i]}</td></tr>)}</tbody></table></div>
      <p className="cn-caption">“Not specified” and “not individually named” describe this source’s limits, not a church’s rejection. “Greek portions” refers to material in Greek forms of Esther and Daniel beyond their Hebrew/Aramaic forms. No color marks one collection as correct.</p></div>
    <details className="cc-counts"><summary>Why 24 and 39 can describe the same set of writings</summary><p>Jewish and many Protestant editions group these writings differently. This arithmetic explains the count; it does not erase differences of order, interpretation or textual tradition.</p>
      <div className="cc-count-grid">{COUNTS.map(([what, n]) => <Fragment key={what}><span>{what}</span><strong>{n}</strong></Fragment>)}</div><Cite ids={["jewish", "westminster"]} /></details>
  </>;
}

/** "How far can this evidence take you?": the questions one at a time; choosing a conclusion says whether the source supports it. */
export function Practice({ num }: { num: string }) {
  const [question, setQuestion] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const q = CN.questions[question], last = question === CN.questions.length - 1;
  const next = () => {
    setQuestion((question + 1) % CN.questions.length); setAnswer(null);
    requestAnimationFrame(() => card.current?.querySelector<HTMLElement>("[data-a]")?.focus({ preventScroll: true }));
  };
  return <div className="cq"><div><p className="kicker"><span className="ms-num">{num}</span><span className="ms-dot" aria-hidden="true">·</span>Try the historical reasoning</p>
    <h2>How far can <em>this evidence take you?</em></h2><p>Choose the conclusion the source supports.</p></div>
    <div className="cq-card" ref={card}><p className="kicker">Question {question + 1} of {CN.questions.length}</p><h3>{q.prompt}</h3>
      <div className="cq-answers" role="group" aria-label="Choose a conclusion">{q.answers.map((text, i) => <button key={text} type="button" data-a={i} aria-pressed={answer === i}
        className={answer !== null && i === q.correct ? "cq-right" : ""} onClick={() => setAnswer(i)}><span>{"ABC"[i]}</span>{text}</button>)}</div>
      <div className="cq-feedback" aria-live="polite">{answer !== null && <><strong>{answer === q.correct ? "That is the supported conclusion." : "That goes beyond what this evidence establishes."}</strong>
        <p>{q.why}</p><Cite ids={q.ids} /><button type="button" className="cn-link cq-next" onClick={next}>{last ? "Try the first question again" : "Next question"} →</button></>}</div></div>
  </div>;
}

/** "Keep the sources in the conversation": every source, the scholarship guide, what remains open, the closing question. */
export function Sources({ num }: { num: string }) {
  return <>
    <SectionHead num={num} kicker="Keep the sources" title={<>Keep the sources <em>in the conversation</em></>} lead="The links beside each record lead to the evidence. This directory records what was actually consulted." />
    <details className="cs-list"><summary>Sources &amp; access notes · {D.sources.length} records</summary><div className="cs-grid">{D.sources.map((s) =>
      <div key={s.id}><a href={s.url} target="_blank" rel="noopener">{s.title}<span aria-hidden="true"> ↗</span></a><p>{s.access}.</p></div>)}</div></details>
    <div className="cs-guide"><h3>Follow the arguments, not just the bibliography.</h3>{D.scholarshipGuide.map((w) => <div key={w.question} className="cs-row"><h4>{w.question}</h4>
      <div><strong>{w.work}</strong><p>{w.contribution}</p><small>{w.access}</small><Cite ids={w.sourceIds} /></div></div>)}
      <div className="cs-open"><h4>What remains open</h4><p>{D.investigations.jewish.limits}</p><p>{D.expansionLimits.join(" ")}</p></div></div>
    <p className="cn-caption">Manuscript pictures are public-domain photographs from Wikimedia Commons, credited where shown; the diagrams are our own. Expanded research checked 14 October 2026.</p>
    <footer className="cn-end"><p>Ask of every list:<br /><em>Whose collection? When? For what use?</em></p><Link to="/study/academic?area=texts">Return to Academic studies →</Link></footer>
  </>;
}
