// The close reading for each case (mock-up js/close-readings.js): the Galatians apparatus decoded part by part (a leader
// line runs from the chosen part to its note), the Romans argument weighed under three questions, and the Mark endings
// read at the join.
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { apparatus, endings, lenses } from "./evidence";
import { Cite } from "./parts";
import { Rich } from "./Rich";

export function Apparatus() {
  const [part, setPart] = useState(0);
  const [leader, setLeader] = useState<{ w: number; h: number; x1: number; y1: number; x2: number; y2: number } | null>(null);
  const stage = useRef<HTMLDivElement>(null), note = useRef<HTMLDivElement>(null);
  const measure = useCallback(() => {
    const box = stage.current?.getBoundingClientRect(), btn = stage.current?.querySelector(`[data-part="${part}"]`)?.getBoundingClientRect();
    const n = note.current?.getBoundingClientRect();
    if (!box?.width || !btn || !n) return;
    const next = { w: box.width, h: box.height, x1: btn.left + btn.width / 2 - box.left, y1: btn.bottom - box.top + 4, x2: n.left - box.left + 14, y2: n.top - box.top + 2 };
    setLeader((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, [part]);
  useLayoutEffect(() => {
    measure();
    if (!stage.current) return;
    const observer = new ResizeObserver(measure);
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, [measure]);
  const p = apparatus.parts[part];
  return <div className="cr cr-app">
    <p className="kicker">Read the apparatus · Galatians 1:3</p><h3>A small line <em>with several jobs.</em></h3><p className="cr-lead"><Rich text={apparatus.lead} /></p>
    <div className="cr-app-stage" ref={stage}>
      <div className="cr-app-line" role="group" aria-label="Decode the Galatians apparatus">{apparatus.parts.map((x, i) =>
        <button key={x.text} type="button" data-part={i} aria-pressed={i === part} onClick={() => setPart(i)}><sup>{i + 1}</sup><span lang={x.greek ? "grc" : undefined}>{x.text}</span></button>)}</div>
      <svg className="cr-leader" aria-hidden="true" viewBox={leader ? `0 0 ${leader.w} ${leader.h}` : undefined}>{leader && <>
        <path d={`M${leader.x1} ${leader.y1}V${(leader.y1 + leader.y2) / 2}H${leader.x2}V${leader.y2}`} />
        <circle cx={leader.x1} cy={leader.y1} r="2.5" /><circle cx={leader.x2} cy={leader.y2} r="2.5" /></>}</svg>
      <div className="cr-app-note" aria-live="polite" ref={note}><span className="cr-n">0{part + 1}</span><div><b>{p.title}</b><p>{p.note}</p></div></div>
    </div>
    <p className="cr-limit">{apparatus.limit}</p><Cite ids={apparatus.links} />
  </div>;
}

export function Lenses() {
  const [lens, setLens] = useState(0);
  const l = lenses.items[lens];
  return <div className="cr cr-lens">
    <p className="kicker">Follow the argument · Romans 5:1</p><h3>Three questions. <em>No automatic winner.</em></h3><p className="cr-lead">{lenses.lead}</p>
    <div className="ct-sort cr-lens-pick" role="group" aria-label="Examine editorial criteria">{lenses.items.map((x, i) =>
      <button key={x.title} type="button" aria-pressed={i === lens} onClick={() => setLens(i)}>{x.title}</button>)}</div>
    {/* Keyed by the question, so the pans' words fade in again each time, as the mock-up's re-added class did. */}
    <div className="cr-scale is-in" aria-live="polite" key={lens}>
      <svg className="cr-beam" viewBox="0 0 400 40" aria-hidden="true"><path d="M200 38V8M40 14h320" /><circle cx="200" cy="8" r="3" /><path d="M40 14v14M360 14v14" strokeDasharray="2 3" /></svg>
      <div className="cr-pan"><b lang="grc">ἔχωμεν</b><small>Let us have peace</small><p data-side="left">{l.left}</p></div>
      <div className="cr-pan"><b lang="grc">ἔχομεν</b><small>We have peace</small><p data-side="right">{l.right}</p></div>
      <p className="cr-take">{l.takeaway}</p>
    </div>
    <p className="cr-limit">{lenses.limit}</p><Cite ids={lenses.links} />
  </div>;
}

export function Endings() {
  const [ending, setEnding] = useState("stop");
  const x = endings.items.find((i) => i.id === ending) ?? endings.items[0];
  return <div className="cr cr-join">
    <p className="kicker">Read the join · Mark 16</p><h3>What kind of ending <em>does each text create?</em></h3><p className="cr-lead">{endings.lead}</p>
    <div className="ct-sort cr-end-pick" role="group" aria-label="Read different endings">{endings.items.map((i) =>
      <button key={i.id} type="button" aria-pressed={i.id === ending} onClick={() => setEnding(i.id)}>{i.title}</button>)}</div>
    <div className="cr-verses" aria-live="polite">
      <div className="cr-v"><span>16:7</span><p>{endings.v7}</p></div>
      <div className="cr-v"><span>16:8</span><p>{endings.v8}</p></div>
      <div className="cr-v cr-cont" data-end={ending}><span>{x.tag}</span><p key={ending}>{x.text}</p></div>
    </div>
    <div className="cr-comment" role="status"><b>{x.head}</b><p>{x.comment}</p></div><Cite ids={endings.links} />
    <details className="sr-more cr-ancients"><summary>Earlier than the surviving codices: Irenaeus and Eusebius</summary>
      {endings.ancients.map((a) => <div key={a.who} className="cr-voice"><b>{a.who}</b><p><Rich text={a.text} /></p><Cite ids={a.links} /></div>)}
      <p>{endings.versions}</p><Cite ids={endings.versionLinks} />
    </details>
  </div>;
}
