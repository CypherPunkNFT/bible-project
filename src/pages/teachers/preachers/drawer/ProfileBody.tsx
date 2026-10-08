// One teacher's profile inside the drawer: who they were, where they lived, what they are known for, what the library
// holds, the Bible books it covers, and the people they are documented as knowing (ported from the mock-up's drawer.js).
import { ArrowRight } from "lucide-react";
import { useState, type PointerEvent } from "react";
import type { PeopleData, Person } from "@/data/teachers/pages-types";
import { familyOf, formatNumber, lifeLabel } from "../../shared/people";
import { cssVars, initials, linksOf, toneOf } from "./helpers";
import { LifeRing, LifeStrip, PlaceMap } from "./Places";
import { BookStrip, FromLibrary, GenreBar, KnownWorks } from "./Works";

interface ProfileBodyProps { data: PeopleData; person: Person; onOpen: (id: string) => void }

export function ProfileBody({ data, person, onOpen }: ProfileBodyProps) {
  const [lit, setLit] = useState<number | null>(null);
  const links = linksOf(data, person.id), sermons = person.genres.sermon ?? 0;
  // The life strip and the map point at each other.
  const onPointerOver = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target instanceof Element ? event.target.closest("[data-place]") : null;
    const next = target ? Number(target.getAttribute("data-place")) : null;
    if (next !== lit) setLit(next);
  };
  return <div className="drw-inner" style={cssVars({ "--tone": toneOf(person) })} onPointerOver={onPointerOver}>
    <header className="drw-top">
      <LifeRing person={person} size={76} />
      <div><p className="kicker">{familyOf(person).label}</p><h2>{person.name}</h2><p className="drw-years">{lifeLabel(person)}{person.died ? "" : " · living"}</p></div>
    </header>
    <p className="drw-line">{person.line}</p>
    <p className="drw-ring-note">The ring runs from 1500 to today; the coloured arc is {person.short}&apos;s lifetime.</p>
    <dl className="drw-figs">
      <div><dt>Works in the library</dt><dd>{formatNumber(person.works)}</dd></div>
      <div><dt>Sermons</dt><dd>{formatNumber(sermons)}</dd></div>
      <div><dt>Places</dt><dd>{new Set(person.places.map((x) => x[0])).size}</dd></div>
      <div><dt>Links</dt><dd>{links.length}</dd></div>
    </dl>
    <section><h3>Where {person.short} lived</h3><PlaceMap data={data} person={person} lit={lit} /><LifeStrip person={person} lit={lit} /></section>
    <section><h3>Best known for</h3><KnownWorks person={person} /></section>
    <section><h3>What the library holds</h3><GenreBar person={person} /></section>
    <section>
      <h3>Their works, Bible book by book</h3>
      <p className="drw-note drw-lead">Works in the library whose main text is in each of the 66 books.</p>
      <BookStrip data={data} person={person} />
    </section>
    <FromLibrary person={person} />
    <section>
      <h3>Who they knew</h3>
      {links.length ? <ul className="drw-links">
        {links.map((l, i) => <li key={`${l.other.id}-${i}`}>
          <button type="button" onClick={() => onOpen(l.other.id)} style={cssVars({ "--tone": toneOf(l.other) })}>
            <span className="drw-mono">{initials(l.other)}</span>
            <span className="drw-who"><b>{l.other.name}</b><small>{l.note}</small></span>
            <ArrowRight size={15} strokeWidth={1.5} aria-hidden />
          </button>
        </li>)}
      </ul> : <p className="drw-empty">No documented links to the other {data.people.length - 1} yet.</p>}
    </section>
  </div>;
}
