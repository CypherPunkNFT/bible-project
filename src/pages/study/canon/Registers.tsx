// "The same writings. Different boundaries." (approved mock-up D: js/registers.js): three writers (Athanasius, Augustine,
// Jerome) as three leaves side by side. Choose a writing and its line lights up on every leaf; open a line for the
// passage, its excerpt and its limits.
import { useRef, useState } from "react";
import { SectionHead } from "@/pages/study/manuscripts/parts";
import { byId, CN, D } from "./model";
import { Cite } from "./parts";

const B = D.investigations.boundaries;
const kindOf = (label: string) => (label === "Canonical" ? "canon" : /^(Instruction|Edifying)/.test(label) ? "instruction" : "silence");
const RECORD = ["athanasius", "augustine", "jerome"];

export function Registers({ num }: { num: string }) {
  const [writing, setWriting] = useState(0);
  const [witness, setWitness] = useState<number | null>(null);
  const panel = useRef<HTMLDivElement>(null), leaves = useRef<HTMLDivElement>(null);
  const inspect = (i: number, j: number) => {
    setWriting(j); setWitness(i);
    requestAnimationFrame(() => panel.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  };
  const close = () => {
    const from = witness;
    setWitness(null);
    requestAnimationFrame(() => leaves.current?.querySelector<HTMLElement>(`.cr-entry[data-i="${from}"][data-j="${writing}"]`)?.focus({ preventScroll: true }));
  };
  const w = witness === null ? null : B.witnesses[witness];
  return <>
    <SectionHead num={num} kicker="Begin with a comparison · AD 367–c. 400" title={<>The same writings. <em>Different boundaries.</em></>} lead="Three selected passages. No universal baseline." />
    <div className="cr-controls"><div><span className="kicker">Follow a writing</span><div className="ct-sort" role="group" aria-label="Compare ancient judgments">
      {B.books.map((b, i) => <button key={b} type="button" role="radio" aria-checked={i === writing} onClick={() => setWriting(i)}>{b}</button>)}</div></div>
      <button type="button" className="cr-reset" onClick={() => { setWriting(0); setWitness(null); }}>Reset view ↺</button></div>
    <div className="cr-legend" aria-label="Diagram key"><span><i className="cr-mark canon"></i>Canonical</span><span><i className="cr-mark instruction"></i>Instruction / edifying reading</span><span><i className="cr-mark silence"></i>Not enumerated / not addressed</span></div>
    <div className="cr-leaves" ref={leaves}>{B.witnesses.map((p, i) => <article key={p.name} className="cr-leaf"><header><p className="cr-no"><span>Selected witness</span><span>{"ABC"[i]}</span></p><h3>{p.name}</h3><p className="cr-date">{p.date}</p></header>
      <div className="cr-entries">{p.states.map((s, j) => <button key={B.books[j]} type="button" className={`cr-entry${j === writing ? " match" : ""}`} data-i={i} data-j={j}
        aria-expanded={witness === i && writing === j} aria-label={`${p.name}: ${B.books[j]}. ${s.label}. Inspect passage`} onClick={() => inspect(i, j)}>
        <i className={`cr-mark ${kindOf(s.label)}`}></i><span><b>{B.books[j]}</b><small>{s.label}</small></span><span className="cr-down" aria-hidden="true">↓</span></button>)}</div>
      <footer>{p.passage}</footer></article>)}</div>
    <p className="cr-caption"><span>Schematic registers · not manuscript facsimiles or complete book lists.</span><span>Each mark represents one writing or named pair in a selected passage.</span></p>
    <div className="cr-finding"><span className="kicker">Read across</span><p aria-live="polite">{CN.findings[writing]}</p></div>
    <div className="cr-inspect" ref={panel} hidden={!w} onKeyDown={(e) => { if (e.key === "Escape") setWitness(null); }}>{w && witness !== null && <>
      <header><div><p className="kicker">{w.date} · {w.passage}</p><h3>{w.name} / {B.books[writing]}</h3></div><button type="button" className="cr-close" aria-label="Close source inspection" onClick={close}>×</button></header>
      <div className="cr-grid"><div><p className="kicker">What this passage establishes</p><p>{w.states[writing].text}</p><blockquote>“{w.excerpt}”</blockquote><small>{w.translation} · excerpt from this passage's general criterion</small></div>
        <div><p className="kicker">Read within its limits</p><p>{w.principle} {byId.get(RECORD[witness])?.limit ?? ""}</p><Cite ids={w.sourceIds} />
          <button type="button" className="cn-link" data-open={RECORD[witness]}>Open the full record →</button></div></div>
    </>}</div>
    <Cite ids={["athanasius", "augustine", "jerome-solomon"]} />
    <p className="cr-bridge">{B.insight}</p>
  </>;
}
