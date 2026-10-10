// The face of the Preachers & authors page (ported from design/authors-directions/teachers/landing.js): a headline, a
// short welcome, a search, the figures, every teacher as a mark on one arc of time, the family legend, jump links to
// the sections, and three best-known works to start reading.
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useMemo, useState, type MouseEvent } from "react";
import type { Person } from "@/data/teachers/pages-types";
import { FAMILIES, familyOf } from "../shared/people";
import { usePreachers } from "./context";
import { cssVars, prefersReducedMotion, toneOf } from "./drawer/helpers";
import { ArcBand } from "./landing/ArcBand";
import { JUMPS, countWord, figuresOf, readsOf, searchPeople } from "./landing/content";
import { LandingSearch } from "./landing/LandingSearch";
import { RadiatingBible } from "./landing/RadiatingBible";
import "./landing.css";

function jumpTo(event: MouseEvent<HTMLAnchorElement>, id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  window.history.replaceState(window.history.state, "", `#${id}`);
}

function StartReading({ people, onOpen }: { people: Person[]; onOpen: (id: string, origin: Element) => void }) {
  const reads = useMemo(() => readsOf(people), [people]);
  if (!reads.length) return null;
  return <div className="lnd-reads">
    <div className="lnd-reads-head"><p className="kicker">Start reading</p><p>{countWord(reads.length)} of their best-known works, ready to open.</p></div>
    <div className="lnd-read-grid">
      {reads.map(({ person, work }) => <article key={person.id} className="lnd-read" style={cssVars({ "--tone": toneOf(person) })}>
        <span className="lnd-read-year">{work.y}</span>
        <h3><a href={work.u} target="_blank" rel="noreferrer">{work.t}</a></h3>
        <div className="lnd-read-foot">
          <button type="button" onClick={(event) => onOpen(person.id, event.currentTarget)}><i />{person.name}</button>
          <span className="lnd-read-go">Read<ArrowUpRight size={15} strokeWidth={1.5} aria-hidden /></span>
        </div>
      </article>)}
    </div>
  </div>;
}

export function Landing() {
  const { data, openProfile } = usePreachers();
  const people = data.people;
  const [query, setQuery] = useState("");
  const [hotId, setHotId] = useState<string | null>(null);
  const hits = useMemo(() => searchPeople(people, query), [people, query]);
  const matchIds = useMemo(() => new Set(hits.map((h) => h.person.id)), [hits]);
  const figures = useMemo(() => figuresOf(people), [people]);
  const first = useMemo(() => people.reduce((a, b) => (b.born < a.born ? b : a)), [people]);
  const families = FAMILIES.filter((f) => people.some((p) => familyOf(p).key === f.key));
  const open = (id: string, origin: Element) => openProfile(id, origin);

  return <div className="lnd">
    <div className="lnd-top">
      <div className="lnd-copy">
        <p className="kicker lnd-kicker">Teachers in the library</p>
        <h1 className="lnd-title">Five Centuries of<br /><em>biblical teachers</em></h1>
        <p className="lnd-lead">{countWord(people.length)} pastors, preachers and missionaries, from {first.name} in {first.places[first.places.length - 1][0]} to teachers still living today.
          {" "}Their sermons and books are in the library. Find one you know, or meet someone new.</p>
      </div>
      <RadiatingBible />
      <div className="lnd-tools">
        <LandingSearch query={query} onQuery={setQuery} hits={hits} onHot={setHotId} onOpen={open} />
        <dl className="lnd-figs">
          {figures.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd><small>{f.note}</small></div>)}
        </dl>
      </div>
    </div>
    <ArcBand people={people} hotId={hotId} onHot={setHotId} matchIds={matchIds} filtering={Boolean(query.trim())} onOpen={open} />
    <div className="lnd-under">
      <ul className="lnd-legend">
        {families.map((f) => <li key={f.key}><i style={{ background: `var(${f.tone})` }} />{f.label}</li>)}
      </ul>
      <nav className="lnd-jump" aria-label="On this page">
        {JUMPS.map(([id, label]) => <a key={id} href={`#${id}`} onClick={(event) => jumpTo(event, id)}>{label}<ArrowRight size={14} strokeWidth={1.5} aria-hidden /></a>)}
      </nav>
    </div>
    <StartReading people={people} onOpen={open} />
  </div>;
}
