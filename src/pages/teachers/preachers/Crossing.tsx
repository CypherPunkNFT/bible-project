// 05 · Did their lives cross? (approved mock-up: design/authors-directions/teachers/crossing.js): pick any two teachers;
// their lives line up on one timeline, cut into the places they lived; the years both were alive are shaded and any city
// they shared is outlined. Suggestion chips offer real pairs who lived in the same city at the same time.
import { useMemo, useRef, useState, type CSSProperties } from "react";
import { SectionHead } from "../shared/Frame";
import { usePreachers } from "./context";
import { CrossingChart, CrossingSentence } from "./crossing/CrossingChart";
import { FIRST_PAIR, byCentury, suggestions } from "./crossing/model";
import { toneVar, useWidth } from "./lives/common";
import "./Crossing.css";

type Side = "a" | "b";

function SwapIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 4 3 8l4 4" /><path d="M3 8h14" /><path d="m17 20 4-4-4-4" /><path d="M21 16H7" />
  </svg>;
}

export function Crossing() {
  const { data, openProfile } = usePreachers();
  const people = data.people;
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const groups = useMemo(() => byCentury(people), [people]);
  const suggested = useMemo(() => suggestions(people), [people]);
  const [pair, setPair] = useState(FIRST_PAIR);
  const host = useRef<HTMLDivElement>(null);
  const width = useWidth(host);
  const p = byId.get(pair.a), q = byId.get(pair.b);
  if (!p || !q) throw new Error(`Crossing: the pair ${pair.a} and ${pair.b} is not in the people data`);
  const link = data.links.find((l) => (l.from === p.id && l.to === q.id) || (l.from === q.id && l.to === p.id));

  const picker = (side: Side, label: string) => {
    const other = side === "a" ? pair.b : pair.a;
    return <label className="xing-picker" style={{ "--tone": toneVar(side === "a" ? p : q) } as CSSProperties}>
      <i className="xing-dot" />
      <select aria-label={label} value={pair[side]} onChange={(e) => setPair({ ...pair, [side]: e.target.value })}>
        {groups.map(([century, list]) => <optgroup key={century} label={`Born in the ${century}s`}>
          {list.map((x) => <option key={x.id} value={x.id} disabled={x.id === other}>{x.name}</option>)}
        </optgroup>)}
      </select>
    </label>;
  };

  return <>
    <SectionHead num="05" kicker="Two lives side by side" title={<>Did their lives <em>cross?</em></>}
      line="Choose any two teachers. Their lives line up on one timeline, cut into the places they lived; the years both were alive are shaded, and any city they shared at the same time is outlined." />
    <div className="xing-pick">
      {picker("a", "First teacher")}
      <span className="xing-and">and</span>
      {picker("b", "Second teacher")}
      <button type="button" className="xing-swap" aria-label="Swap the two teachers" title="Swap" onClick={() => setPair({ a: pair.b, b: pair.a })}><SwapIcon /></button>
    </div>
    <div className="xing-suggest">
      <span className="xing-lab">They shared a city:</span>
      {suggested.map((x) => <button key={`${x.a.id}|${x.b.id}`} type="button" className="xing-chip" aria-pressed={x.a.id === pair.a && x.b.id === pair.b}
        onClick={() => setPair({ a: x.a.id, b: x.b.id })}>{x.a.short} &amp; {x.b.short}<small>{x.place}</small></button>)}
    </div>
    <div className="xing-card">
      <p className="xing-say" aria-live="polite"><CrossingSentence p={p} q={q} link={link} /></p>
      <div className="xing-host" ref={host}>
        {width > 0 && <CrossingChart key={`${p.id}|${q.id}`} p={p} q={q} width={width} onOpen={openProfile} />}
      </div>
    </div>
  </>;
}
