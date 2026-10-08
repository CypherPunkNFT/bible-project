// 07 · Same year, different worlds (ported from design/authors-directions/teachers/sameyear.js): pick a year and see
// every teacher who was alive then, gathered by the town they were living in. The slider sits on a small chart of how
// many of them were alive in each year; ten-year steps and preset years jump straight there.
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Person } from "@/data/teachers/pages-types";
import { SectionHead } from "../shared/Frame";
import { THIS_YEAR } from "../shared/people";
import { usePreachers } from "./context";
import { cssVars, prefersReducedMotion, toneOf } from "./drawer/helpers";
import { PRESETS, START_YEAR, aliveIn, ageNote, firstBirth, groupsIn, histogramOf } from "./sameyear/years";
import "./sameyear.css";

interface YearState { year: number; animate: boolean }
interface PlaceCardProps { place: string; people: Person[]; year: number; index: number; animate: boolean; onOpen: (id: string, origin: Element) => void }

function PlaceCard({ place, people, year, index, animate, onOpen }: PlaceCardProps) {
  const ref = useRef<HTMLElement>(null);
  const entrance = useRef({ animate, index });
  // A place that appears after a step or a preset eases in; one that appears while dragging just appears.
  useLayoutEffect(() => {
    const { animate: should, index: order } = entrance.current;
    if (!should || prefersReducedMotion()) return;
    ref.current?.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }],
      { duration: 420, delay: Math.min(order, 12) * 25, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
  }, []);
  return <article ref={ref} className="yr-card">
    <header><h4>{place}</h4><span>{people.length}</span></header>
    <ul>{people.map((p) => <li key={p.id}>
      <button type="button" onClick={(event) => onOpen(p.id, event.currentTarget)}>
        <i className="yr-dot" style={cssVars({ "--tone": toneOf(p) })} /><span className="yr-who">{p.name}</span><small>{ageNote(p, year)}</small>
        {p.known.filter((k) => k.y === year).map((k) => <em key={k.t}>{year}: {k.t}</em>)}
      </button>
    </li>)}</ul>
  </article>;
}

export function SameYear() {
  const { data, openProfile } = usePreachers();
  const people = data.people;
  const first = useMemo(() => firstBirth(people), [people]);
  const histogram = useMemo(() => histogramOf(people), [people]);
  const [state, setState] = useState<YearState>({ year: START_YEAR, animate: false });
  const { year } = state;
  const groups = useMemo(() => groupsIn(people, year), [people, year]);
  const pending = useRef(0), frame = useRef(0), range = useRef<HTMLInputElement>(null);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  // The slider is left uncontrolled (so a drag is never snapped back between frames) and follows steps and presets.
  useEffect(() => { if (range.current && range.current.value !== String(year)) range.current.value = String(year); }, [year]);

  const jump = (next: number) => setState({ year: Math.max(first, Math.min(THIS_YEAR, next)), animate: true });
  // Dragging: at most one update per frame.
  const drag = (value: number) => {
    pending.current = value;
    frame.current ||= requestAnimationFrame(() => { frame.current = 0; setState({ year: pending.current, animate: false }); });
  };
  const open = (id: string, origin: Element) => openProfile(id, origin);
  const alive = aliveIn(people, year).length, now = year === THIS_YEAR;
  const notYet = people.filter((p) => p.born > year).length, gone = people.filter((p) => p.died && p.died < year).length;

  return <>
    <SectionHead num="07" kicker="Side by side" title={<>Same year, <em>different worlds</em></>}
      line="Pick a year to see which teachers were alive and where each of them was living." />
    <div className="yr">
      <div className="yr-controls">
        <div className="yr-year">
          <button type="button" onClick={() => jump(year - 10)} aria-label="Ten years earlier"><ArrowLeft size={16} strokeWidth={1.5} aria-hidden /></button>
          <output className="yr-big" aria-live="polite">{year}</output>
          <button type="button" onClick={() => jump(year + 10)} aria-label="Ten years later"><ArrowRight size={16} strokeWidth={1.5} aria-hidden /></button>
        </div>
        <p className="yr-sum"><b>{alive}</b> of the {people.length} {now ? "are" : "were"} alive, in <b>{groups.length}</b> {groups.length === 1 ? "place" : "places"}. {notYet} not yet born · {gone} {now ? "have" : "had"} died.</p>
        <div className="yr-hist">
          <svg viewBox={`0 0 ${histogram.width} 60`} preserveAspectRatio="none" aria-hidden="true"><path d={histogram.path} /></svg>
          <span className="yr-marker" style={{ left: `${((year - first) / (THIS_YEAR - first)) * 100}%` }} />
          <input type="range" min={first} max={THIS_YEAR} step={1} aria-label="Year" ref={range} defaultValue={year} onChange={(event) => drag(Number(event.target.value))} />
        </div>
        <div className="yr-axis"><span>{first}</span><span>Today</span></div>
        <p className="yr-note">Shaded: how many of the {people.length} were alive in each year (at most {histogram.max}). Places are where each person was living that year.</p>
        <div className="yr-presets">
          {PRESETS.map((y) => <button key={y} type="button" aria-pressed={y === year} onClick={() => jump(y)}>{y}<small>{aliveIn(people, y).length}</small></button>)}
        </div>
      </div>
      <div className="yr-grid">
        {groups.map((g, i) => <PlaceCard key={g.place} place={g.place} people={g.people} year={year} index={i} animate={state.animate} onOpen={open} />)}
      </div>
    </div>
  </>;
}
