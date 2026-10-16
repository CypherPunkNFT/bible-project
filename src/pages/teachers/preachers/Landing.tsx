// The face of the Preachers & authors page (ported from design/authors-directions/teachers/landing.js): a headline, a
// short welcome, a search, the figures, every teacher as a mark on one arc of time, the family legend, jump links to
// the sections, and five curated works to start reading.
import { ArrowRight } from "lucide-react";
import { useMemo, useState, type MouseEvent } from "react";
import { usePreachers } from "./context";
import { prefersReducedMotion, toneOf } from "./drawer/helpers";
import { ArcBand } from "./landing/ArcBand";
import { JUMPS, countWord, figuresOf, searchPeople } from "./landing/content";
import { LandingSearch } from "./landing/LandingSearch";
import { RadiatingBible } from "./landing/RadiatingBible";
import { StartReading } from "../shared/StartReading";
import "./landing.css";

function jumpTo(event: MouseEvent<HTMLAnchorElement>, id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  window.history.replaceState(window.history.state, "", `#${id}`);
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
  const open = (id: string, origin: Element) => openProfile(id, origin);

  return <div className="lnd">
    <div className="lnd-top">
      <div className="lnd-copy">
        <p className="kicker lnd-kicker">Teachers in the library</p>
        <h1 className="lnd-title">Five Centuries of<br /><em>biblical teachers</em></h1>
        <p className="lnd-lead">{countWord(people.length)} pastors, preachers and missionaries, from {first.name} in {first.places[first.places.length - 1][0]} to teachers still living today.
          {" "}Their sermons and books are in the library. Find one you know, or meet someone new.</p>
        <nav className="lnd-jump" aria-label="On this page">
          {JUMPS.map(([id, label]) => <a key={id} href={`#${id}`} onClick={(event) => jumpTo(event, id)}>{label}<ArrowRight size={14} strokeWidth={1.5} aria-hidden /></a>)}
        </nav>
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
    <StartReading side="preachers" onOpen={open} toneFor={id => {const person = people.find(p => p.id === id); return person ? toneOf(person) : 'var(--muted)';}} />
  </div>;
}
