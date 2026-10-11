// Subject discovery generated from the complete packaged library, with paged shelves.
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowRight, Search } from "lucide-react";
import type { Field } from "@/data/teachers/pages-types";
import libraryUrl from "../../../../content/teachers/field-shelves.json?url";
import featured from "../../../../content/teachers/field-featured.json";
import { SectionHead } from "../shared/Frame";
import { getAcquired } from "../shared/acquired";
import { faithOf, toneOf, yearsOf } from "./built/labels";
import { Mark } from "./marks/Mark";
import { useScholars } from "./context";
import { FieldWorks } from "./FieldWorks";
import { FIELD_COLLECTIONS, type FieldEntry, type FieldLibrary } from "./field-library";
import "./Fields.css";

const SIZE = 40;
const descriptions: Record<Field, string> = {
  history: "Ancient histories, the early church and the world of the Bible.",
  texts: "Languages, manuscripts, translation and the biblical canon.",
  places: "Digs, geography and the landscapes behind the text.",
  reference: "Dictionaries, concordances, commentaries and study companions.",
  theology: "Christian doctrine, philosophy and the defense of the faith.",
};

export function Fields() {
  const { data, openProfile, filterCatalogue } = useScholars();
  const [library, setLibrary] = useState<FieldLibrary | null>(null), [error, setError] = useState("");
  const [choice, setChoice] = useState<{ key: Field; open: boolean }>({ key: "theology", open: true });
  const [query, setQuery] = useState(""), [collection, setCollection] = useState("");
  const [page, setPage] = useState(0), [expanded, setExpanded] = useState<string | null>(null);
  const [sort, setSort] = useState("featured");
  useEffect(() => {
    const abort = new AbortController();
    getAcquired<FieldLibrary>(libraryUrl, abort.signal).then(setLibrary).catch(e => { if (!abort.signal.aborted) setError(e.message); });
    return () => abort.abort();
  }, []);
  const groups = useMemo(() => (Object.entries(data.fields) as [Field, string][]).map(([key, label]) => {
    const people = (library?.entries ?? []).filter(p => p.fields[key]);
    // Editorial introductions are independent of record volume and shelf sorting.
    const picks = featured[key].flatMap(([id, caption]) => {
      const person = people.find(p => p.id === id);
      return person ? [{ person, caption }] : [];
    });
    const rank = new Map(picks.map((p, i) => [p.person.id, i]));
    people.sort((a, b) => sort === "az" ? a.name.localeCompare(b.name) :
      (sort === "featured" ? (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity) : 0) ||
      b.records - a.records || a.name.localeCompare(b.name));
    return { key, label, people, picks };
  }), [data.fields, library, sort]);
  const columns = groups.map(g => g.key === choice.key ? "3.4fr" : "1fr").join(" ");
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matches = (p: FieldEntry) => (!collection || p.collections.includes(collection)) && words.every(word =>
    [p.name, ...p.aliases, ...p.roles, ...p.traditions, ...Object.values(p.fields).map(f => f?.example?.title)].join(" ").toLocaleLowerCase().includes(word));
  function reset() { setPage(0); setExpanded(null); }
  function choose(key: Field) {
    const narrow = window.matchMedia("(max-width: 900px)").matches;
    setChoice(c => ({ key, open: !(c.key === key && c.open && narrow) }));
    setQuery(""); reset();
  }
  function movePage(next: number, field: Field) {
    setPage(next); setExpanded(null);
    document.querySelector(`#fld-list-${field} .fld-people`)?.scrollTo({ top: 0 });
  }
  function personRow(p: FieldEntry, field: Field) {
    const scholar = data.scholars.find(s => s.id === p.profileId), open = expanded === p.id;
    const example = p.fields[field]?.example;
    const content = <><Mark scholar={{ name: p.name, field }} size={34} /><span>
      <b>{p.name}</b>
      <small>{scholar ? `${yearsOf(scholar)} · ${faithOf(data, scholar)}` : p.roles.join(" · ")}</small>
      <em>{example?.title ?? scholar?.line}</em>
      <span className="fld-person-action">{scholar ? "Open profile" : `${p.records.toLocaleString()} held ${p.records === 1 ? "record" : "records"} · ${open ? "Close works" : "Browse works"}`}<ArrowRight size={11} aria-hidden="true" /></span>
    </span></>;
    return <li key={p.id} data-person={p.id}>
      <button type="button" aria-label={scholar ? `Open the profile of ${p.name}` : `Browse held works by ${p.name}`} aria-expanded={scholar ? undefined : open}
        onClick={e => scholar ? openProfile(scholar.id, e.currentTarget) : setExpanded(open ? null : p.id)}>{content}</button>
      {scholar && p.records > 0 && <button type="button" className="fld-held" aria-expanded={open} onClick={() => setExpanded(open ? null : p.id)}>{p.records.toLocaleString()} held records · {open ? "Close works" : "Browse works"}</button>}
      {open && <><p className="fld-credit">{p.traditions.length ? `Recorded tradition: ${p.traditions.join(", ")}.` : "Faith and tradition not recorded."} {p.aliases.length > 1 && `Source names: ${p.aliases.join("; ")}.`}</p><FieldWorks entry={p} /></>}
    </li>;
  }
  return <>
    <SectionHead num="04" kicker="Fields" title={<>Five ways to <em>study the Bible</em></>}
      line={library ? <>{library.entries.length.toLocaleString()} authors and contributors, drawn from {library.coverage.scannedRecords.toLocaleString()} library records. Browse their held works by subject or collection, including CCEL and the Latin Fathers.</> : "Opening the library's subject index…"} />
    {error && <p role="alert">The subject index could not be loaded. {error}</p>}
    <div className="fld-grid" style={{ "--cols": columns } as CSSProperties}>
      {groups.map(g => {
        const selected = choice.open && choice.key === g.key;
        const visible = g.people.filter(matches), currentPage = Math.min(page, Math.max(0, Math.ceil(visible.length / SIZE) - 1));
        return <article key={g.key} className={`fld-card${selected ? " fld-sel" : ""}`} data-field={g.key} style={{ "--tone": `var(${toneOf(g.key)})` } as CSSProperties}>
          <button type="button" className="fld-head" aria-label={`${g.label}: browse all ${g.people.length.toLocaleString()} contributors`} aria-expanded={selected} aria-controls={`fld-list-${g.key}`} onClick={() => choose(g.key)}>
            <span className="fld-count">{library ? g.people.length.toLocaleString() : "…"} contributors</span><h3>{g.label}</h3>
            <span className="fld-span">{descriptions[g.key]}</span>
            <span className="fld-avatars" aria-hidden="true">{g.picks.map(({ person, caption }) => <span className="fld-featured" key={person.id} title={person.name}>
              <Mark scholar={{ name: person.name, field: g.key }} size={48} /><span>{caption}</span>
            </span>)}</span>
            <span className="fld-more">Browse all {library ? g.people.length.toLocaleString() : "…"}</span>
          </button>
          <div className="fld-body" id={`fld-list-${g.key}`} hidden={!selected}>
            <div className="fld-body-in">
              <label className="fld-search"><Search size={14} aria-hidden="true" /><input type="search" aria-label={`Search ${g.label}`} placeholder="Find a name or work" value={selected ? query : ""} onChange={e => { setQuery(e.target.value); reset(); }} /></label>
              <div className="fld-controls"><select aria-label={`Collection in ${g.label}`} value={collection} onChange={e => { setCollection(e.target.value); reset(); }}><option value="">All collections</option>{FIELD_COLLECTIONS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><select aria-label={`Sort ${g.label}`} value={sort} onChange={e => { setSort(e.target.value); reset(); }}><option value="featured">Featured first</option><option value="held">Most held</option><option value="az">A–Z</option></select></div>
              <p className="fld-results" role="status">{visible.length.toLocaleString()} of {g.people.length.toLocaleString()} contributors{(query || collection) && <button type="button" onClick={() => { setQuery(""); setCollection(""); reset(); }}>Clear</button>}</p>
              <ul className="fld-people" key={`${g.key}-${query}-${collection}-${sort}-${currentPage}`} tabIndex={0} aria-label={`${g.label} authors and contributors`}>
                {selected && visible.slice(currentPage * SIZE, (currentPage + 1) * SIZE).map(p => personRow(p, g.key))}
                {!library && !error && <li className="fld-empty">Loading the full subject index…</li>}
                {library && !visible.length && <li className="fld-empty">No names or works match. Try another search or collection.</li>}
              </ul>
              {visible.length > SIZE && <nav className="fld-pages" aria-label={`${g.label} contributor pages`}><button type="button" disabled={currentPage === 0} onClick={() => movePage(currentPage - 1, g.key)}>Previous</button><span>{currentPage * SIZE + 1}–{Math.min((currentPage + 1) * SIZE, visible.length)} / {visible.length.toLocaleString()}</span><button type="button" disabled={(currentPage + 1) * SIZE >= visible.length} onClick={() => movePage(currentPage + 1, g.key)}>Next</button></nav>}
              <button type="button" className="fld-cat" onClick={() => filterCatalogue({ field: [g.key] })}>Profiles in the catalogue <ArrowRight size={14} /></button>
            </div>
          </div>
        </article>;
      })}
    </div>
    <p className="fld-library-note">Fields follow the subjects of held works and can overlap. Authors, editors and named collections retain their source credits. <a href="#acquired">Browse every acquired contributor <ArrowRight size={12} aria-hidden="true" /></a></p>
    {library && <p className="fld-coverage">{data.scholars.length} documented profiles · {library.coverage.collections.ccel} CCEL contributors · {library.coverage.collections['latin-fathers']} Latin Fathers authors and editors. {library.coverage.withoutSubjectMatch.toLocaleString()} other source names remain in the full library without a field assignment.</p>}
  </>;
}
