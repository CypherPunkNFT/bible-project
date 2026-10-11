// Five fields, with documented profiles and selected writers from the larger acquired library.
// Additional names link to the identified work supporting their placement, without inventing biographies.
import { useMemo, useState, type CSSProperties } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import type { Field, Scholar } from "@/data/teachers/pages-types";
import shelves from "../../../../content/teachers/field-shelves.json";
import { SectionHead } from "../shared/Frame";
import { workUrl } from "../shared/acquired";
import { faithOf, toneOf, yearsOf } from "./built/labels";
import { Mark } from "./marks/Mark";
import { useScholars } from "./context";
import "./Fields.css";

type Shelf = typeof shelves.entries[number];
interface Person { id: string; name: string; field: Field; scholar?: Scholar; shelf?: Shelf }
interface Group { key: Field; label: string; people: Person[] }
const descriptions: Record<Field, string> = {
  history: "Ancient histories, the early church and the world of the Bible.",
  texts: "Languages, manuscripts, translation and the biblical canon.",
  places: "Digs, geography and the landscapes behind the text.",
  reference: "Dictionaries, concordances, commentaries and study companions.",
  theology: "Christian doctrine, philosophy and the defense of the faith.",
};

export function Fields() {
  const { data, openProfile, filterCatalogue } = useScholars();
  const groups = useMemo<Group[]>(() => (Object.entries(data.fields) as [Field, string][]).map(([key, label]) => ({
    key, label, people: [
      ...data.scholars.filter(s => s.field === key).map(scholar => ({ id: scholar.id, name: scholar.name, field: key, scholar })),
      ...shelves.entries.filter(s => s.field === key).map(shelf => ({ id: shelf.id, name: shelf.name, field: key, shelf })),
    ],
  })), [data]);
  const total = groups.reduce((n, g) => n + g.people.length, 0);
  const [choice, setChoice] = useState<{ key: Field; open: boolean }>({ key: "texts", open: true });
  const [query, setQuery] = useState("");
  const columns = groups.map(g => g.key === choice.key ? "3.4fr" : "1fr").join(" ");
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matches = (p: Person) => words.every(word => [p.name, p.scholar?.line, ...(p.scholar?.works.map(w => w[0]) ?? []), p.shelf?.work.title].join(" ").toLocaleLowerCase().includes(word));

  function choose(key: Field) {
    const narrow = window.matchMedia("(max-width: 900px)").matches;
    setChoice(c => ({ key, open: !(c.key === key && c.open && narrow) }));
    setQuery("");
  }

  function personRow(p: Person) {
    const content = <><Mark scholar={p} size={34} /><span>
      <b>{p.name}</b>
      <small>{p.scholar ? `${yearsOf(p.scholar)} · ${faithOf(data, p.scholar)}` : `${p.shelf!.role} · Faith not recorded here`}</small>
      <em>{p.scholar?.line ?? p.shelf!.work.title}</em>
      <span className="fld-person-action">{p.scholar ? "Open profile" : "Explore this work"}<ArrowRight size={11} aria-hidden="true" /></span>
    </span></>;
    return <li key={p.id} data-person={p.id}>{p.scholar
      ? <button type="button" onClick={e => openProfile(p.id, e.currentTarget)} aria-label={`Open the profile of ${p.name}`}>{content}</button>
      : <Link to={workUrl(p.shelf!.work.id)} aria-label={`Explore ${p.shelf!.work.title} by ${p.name}`}>{content}</Link>}
    </li>;
  }

  return <>
    <SectionHead num="04" kicker="Fields" title={<>Five ways to <em>study the Bible</em></>}
      line={<>{total} scholars and writers across five fields. Meet the people behind the books, open their profiles, and explore more of the works in our library.</>} />
    <div className="fld-grid" style={{ "--cols": columns } as CSSProperties}>
      {groups.map(g => {
        const selected = choice.open && choice.key === g.key;
        const visible = g.people.filter(matches), profiles = visible.filter(p => p.scholar), additional = visible.filter(p => p.shelf);
        return <article key={g.key} className={`fld-card${selected ? " fld-sel" : ""}`} data-field={g.key} style={{ "--tone": `var(${toneOf(g.key)})` } as CSSProperties}>
          <button type="button" className="fld-head" aria-expanded={selected} aria-controls={`fld-list-${g.key}`} onClick={() => choose(g.key)}>
            <span className="fld-count">{g.people.length} scholars &amp; writers</span>
            <h3>{g.label}</h3>
            <span className="fld-span">{descriptions[g.key]}</span>
            <span className="fld-avatars" aria-hidden="true">{g.people.map(p => <Mark key={p.id} scholar={p} size={28} />)}</span>
            <span className="fld-open" aria-hidden="true"><ArrowRight size={16} /></span>
          </button>
          <div className="fld-body" id={`fld-list-${g.key}`} hidden={!selected}>
            <div className="fld-body-in">
              <label className="fld-search"><Search size={14} aria-hidden="true" /><input type="search" aria-label={`Search ${g.label}`} placeholder="Find a name or work" value={selected ? query : ""} onChange={e => setQuery(e.target.value)} /></label>
              {query && selected && <p className="fld-results" role="status">{visible.length} of {g.people.length} match <button type="button" onClick={() => setQuery("")}>Clear</button></p>}
              <ul className="fld-people" tabIndex={0} aria-label={`${g.label} scholars and writers`}>
                {profiles.length > 0 && <li className="fld-group-label">Profiles <span>{profiles.length}</span></li>}
                {profiles.map(personRow)}
                {additional.length > 0 && <li className="fld-group-label">More from the library <span>{additional.length}</span></li>}
                {additional.map(personRow)}
                {!visible.length && <li className="fld-empty">No names or works match. Try a different search.</li>}
              </ul>
              <button type="button" className="fld-cat" onClick={() => filterCatalogue({ field: [g.key] })}>Profiles in the catalogue <ArrowRight size={14} /></button>
            </div>
          </div>
        </article>;
      })}
    </div>
    <p className="fld-library-note">{data.scholars.length} profiles and {shelves.entries.length} additional writers and editors from the library. <a href="#acquired">Browse the full acquired library <ArrowRight size={12} aria-hidden="true" /></a></p>
  </>;
}
