import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { getContributorShelf, loadAcquiredCatalogue, workUrl, languageCodes, languageLabel, sourceLabel, type AcquiredCatalogue as Catalogue, type AcquiredContributor, type AcquiredWork } from "./acquired";
import { FACETS, NO_FILTERS, NO_PROFILE, SORTS, matches, options, order, preacherFacts, scholarFacts, shelfRows, stats,
  type Facet, type FacetOption, type Filters, type ProfileFacts, type ShelfRow, type Sort } from "./acquired-facets";
import { usePeopleData, useScholarsData } from "./data";
import { SectionHead } from "./Frame";
import "./acquired.css";
import { WindowedRows } from "@/components/WindowedRows";
import { formatDate, formatNumber, plural } from "@/lib/site-format";

// Its own text node after the count: the collector skips a text with ";".
const OVERLAP_NOTE = "Editions and formats can overlap; this is not a count of distinct books.";
// Every work and every contributor, drawn a window of rows at a time as the page (or drawer) scrolls: no page buttons
// (owner's scroll rule, 2026-11-17).
const workKey = (w: AcquiredWork) => w.id;
const rowKey = (row: ShelfRow) => row.contributor.id;
const FACET_TITLES: Record<Facet, string> = { origin: "Place of origin", tradition: "Tradition", century: "Century", shelf: "Shelf" };
const ROLES: [string, string][] = [["author", "Author"], ["editor", "Editor"], ["translator", "Translator"]];
const tone = (value?: string) => (value ? { "--tone": value } as CSSProperties : undefined);

/** The catalogue, read once the section nears the screen (within 300px): on /teachers/works it sits below the
 *  collections, and its 8,477 contributors are 230 KB to download (owner, 2026-11-19). */
function useAcquiredCatalogue() {
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [data, setData] = useState<Catalogue | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const element = box.current;
    if (near || !element) return;
    if (!("IntersectionObserver" in window)) { setNear(true); return; }
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); setNear(true); } }, { rootMargin: "300px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [near]);
  useEffect(() => {
    if (!near) return;
    const abort = new AbortController();
    loadAcquiredCatalogue(abort.signal).then(setData).catch(error => { if (!abort.signal.aborted) setError(String(error.message)); });
    return () => abort.abort();
  }, [near]);
  return { box, data, error };
}

export function ContributorWorks({ contributor, onOpenWork }: { contributor: Pick<AcquiredContributor, "id">; onOpenWork?: (work: AcquiredWork, origin: HTMLElement) => void }) {
  const [rows, setRows] = useState<AcquiredWork[]>([]), [query, setQuery] = useState(""), [error, setError] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    setRows([]); setError("");
    getContributorShelf(contributor.id,abort.signal).then(data => { if (!abort.signal.aborted) setRows(data); }).catch(error => { if (!abort.signal.aborted) setError(error.message); });
    return () => abort.abort();
  }, [contributor.id]);
  const found = useMemo(() => rows.filter(w => `${w.title} ${w.source} ${languageCodes(w.language).join(" ")} ${languageLabel(w.language)}`.toLowerCase().includes(query.toLowerCase())), [rows, query]);
  return <div className="acq-works">
    <label>Find a work<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Title, source or language" /></label>
    <p className="acq-caption">{`${formatNumber(found.length)} text representations.`}{" "}{OVERLAP_NOTE}</p>
    {error && <p role="alert">{error}</p>}
    <WindowedRows as="ul" items={found} itemKey={workKey} estimate={70} dataVersion={`${contributor.id}|${query}|${rows.length}`} renderItem={(w, row) => <li key={w.id} data-row={row}>{onOpenWork ? <button type="button" onClick={e=>onOpenWork(w,e.currentTarget)}><strong>{w.title}</strong><span>{languageLabel(w.language)} · {sourceLabel(w.source)}</span><small>{w.localReadable ? "Read local copy" : w.availability === "on-site-text" ? "Read on this site" : "Catalogue only · no held reading copy"}</small></button> : <Link to={workUrl(w.id)}><strong>{w.title}</strong><span>{languageLabel(w.language)} · {sourceLabel(w.source)}</span><small>{w.localReadable ? "Read local copy" : w.availability === "on-site-text" ? "Read on this site" : "Catalogue only · no held reading copy"}</small></Link>}</li>} />
  </div>;
}

function ShelfCard({ row, index }: { row: ShelfRow; index: number }) {
  const [open, setOpen] = useState(false);
  const c = row.contributor;
  return <details className="acq-shelf" onToggle={e => setOpen(e.currentTarget.open)} data-row={index} style={tone(row.toneVar)}>
    <summary>
      <span className="acq-shelf-top">
        <strong>{c.name}</strong>
        <span className="acq-shelf-badge">{row.shelf === NO_PROFILE ? "No profile yet" : c.readable ? `${formatNumber(c.readable)} readable` : "Catalogue only"}</span>
      </span>
      <span className="acq-shelf-meta">{[row.life, row.origin].filter(Boolean).join(" · ")}</span>
      <span className="acq-shelf-tags"><span>{row.traditionLabel}</span><span>{c.roles.join(", ")}</span></span>
      <span className="acq-shelf-counts"><b>{formatNumber(c.records)}</b> {plural(c.records, "held text", "held texts")}</span>
    </summary>
    <p className="acq-caption">{c.traditions.length ? `Recorded tradition: ${c.traditions.join(", ")}.` : "Faith and tradition not recorded."} {c.profileId ? "A documented profile is also in the main biographical catalogue." : "Biography not yet recorded."}</p>
    {c.sourceLifeDates?.length ? <p className="acq-caption">{`Source life-date labels: ${c.sourceLifeDates.join("; ")}. These are transcribed identity evidence, not a reviewed biography.`}</p> : null}
    {open && <ContributorWorks contributor={c} />}
  </details>;
}

function Spread({ title, rows, total }: { title: string; rows: { label: string; count: number }[]; total: number }) {
  const shown = rows.slice(0, 6);
  return <div className="acq-spread">
    <h4>{title}</h4>
    <ul>{shown.map(entry => <li key={entry.label}>
      <span>{entry.label}</span>
      <i aria-hidden="true"><b style={{ width: `${total ? Math.max(1, (entry.count / total) * 100) : 0}%` }} /></i>
      <em>{formatNumber(entry.count)}</em>
    </li>)}</ul>
    {rows.length > shown.length && <p className="acq-caption">{`and ${formatNumber(rows.length - shown.length)} more.`}</p>}
  </div>;
}

interface BodyProps { side?: "preachers" | "scholars"; authorId?: string | null; facts: Map<string, ProfileFacts> }

function Shelves({ side, authorId, facts }: BodyProps) {
  const { box, data, error } = useAcquiredCatalogue();
  const [query, setQuery] = useState(""), [role, setRole] = useState(""), [sort, setSort] = useState<Sort>("held");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const viewport = useRef<HTMLDivElement>(null);
  const shelves = useMemo(() => data?.contributors.filter(c => (!side || c.side === side) && (!authorId || c.id === authorId)) ?? [], [data, side, authorId]);
  const rows = useMemo(() => shelfRows(shelves, facts), [shelves, facts]);
  const words = useMemo(() => query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean), [query]);
  const visible = useMemo(() => order(rows.filter(row => matches(row, words, filters, role)), sort), [rows, words, filters, role, sort]);
  const figures = useMemo(() => (data ? stats(rows, data) : null), [rows, data]);
  const active = Boolean(query.trim() || role || Object.values(filters).some(values => values.length));
  const contributorLabel = side === "preachers" ? "authors and assemblies" : side === "scholars" ? "authors, editors and translators" : "contributors";
  useEffect(() => { viewport.current?.scrollTo({ top: 0 }); }, [query, filters, role, sort]);
  const toggle = (key: Facet, value: string) => setFilters(previous => ({ ...previous, [key]: previous[key].includes(value) ? previous[key].filter(v => v !== value) : [...previous[key], value] }));
  const clear = () => { setQuery(""); setRole(""); setFilters(NO_FILTERS); };

  const facet = (key: Facet) => {
    const opts: FacetOption[] = options(rows, key);
    if (opts.length < 2) return null;
    return <div className="acq-facet" data-facet={key}>
      <h3>{FACET_TITLES[key]}</h3>
      <div className="acq-options">{opts.map(option => <button key={option.value} type="button" aria-pressed={filters[key].includes(option.value)} data-value={option.value} onClick={() => toggle(key, option.value)} style={tone(option.tone)}>
        {option.tone && <i aria-hidden="true" />}<span>{option.label}</span><em>{formatNumber(rows.filter(row => row[key] === option.value && matches(row, words, filters, role, key)).length)}</em>
      </button>)}</div>
    </div>;
  };

  const introduction = data
    ? `Explore the acquired texts of ${formatNumber(shelves.length)} ${contributorLabel}. Filter by where a person came from, their tradition and their century, then open a shelf to browse editions and read available texts here.`
    : "Open a contributor's shelf to browse acquired editions and read available texts here.";

  return <div ref={box} className="acq-catalogue">
    <SectionHead num={side === "preachers" ? "09" : "08"} kicker="Acquired library" title={<>The texts we hold, <em>by contributor</em></>} line={introduction} />
    {error && <p role="alert">{error}</p>}
    {!data && !error && <p role="status">Loading acquired catalogue…</p>}
    {figures && <>
      <div className="acq-figures">
        <div><b>{formatNumber(figures.heldTextRecords)}</b><span>held text records</span></div>
        <div><b>{formatNumber(figures.onSiteTexts)}</b><span>readable on this site</span></div>
        <div><b>{formatNumber(figures.workRecordCount)}</b><span>work records</span></div>
        <div><b>{formatNumber(figures.contributors)}</b><span>{contributorLabel}</span></div>
        <div><b>{formatNumber(figures.profiled)}</b><span>with a documented profile</span></div>
        <div><b>{formatNumber(figures.unprofiled)}</b><span>still without one</span></div>
      </div>
      <p className="acq-caption">{OVERLAP_NOTE}{figures.unknownAuthorRecords ? ` ${formatNumber(figures.unknownAuthorRecords)} held records name no author and are not on any shelf below.` : ""}</p>
      <div className="acq-spreads">
        <Spread title="Held texts by tradition" rows={figures.traditions} total={figures.heldTextRecords} />
        <Spread title="Held texts by place of origin" rows={figures.origins} total={figures.heldTextRecords} />
        <Spread title="Largest shelves" rows={figures.largest} total={figures.heldTextRecords} />
      </div>
    </>}
    {data && <div className="acq-layout">
      <aside className="acq-filters" aria-label="Filter the contributors">
        <div className="acq-filter-head"><span>Filter</span>{active && <button type="button" onClick={clear}>Clear all</button>}</div>
        <label className="acq-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Find a contributor" placeholder="Name or recorded tradition" value={query} onChange={e => setQuery(e.target.value)} /></label>
        <div className="acq-facet" data-facet="role">
          <h3>Role</h3>
          <div className="acq-options">{ROLES.filter(([value]) => rows.some(row => row.contributor.roles.includes(value))).map(([value, label]) => <button key={value} type="button" aria-pressed={role === value} onClick={() => setRole(current => (current === value ? "" : value))}>
            <span>{label}</span><em>{formatNumber(rows.filter(row => row.contributor.roles.includes(value)).length)}</em>
          </button>)}</div>
        </div>
        {FACETS.map(key => <div key={key}>{facet(key)}</div>)}
      </aside>
      <div className="acq-results">
        <div className="acq-toolbar">
          <p className="acq-result-count" aria-live="polite"><strong>{formatNumber(visible.length)}</strong>{` of ${plural(rows.length, "{n} shelf", "{n} shelves")} · updated ${formatDate(new Date(data.updatedAt))}`}</p>
          <div className="acq-sort" role="radiogroup" aria-label="Sort contributors"><span>Sort</span>{SORTS.map(([key, label]) => <button key={key} type="button" role="radio" aria-checked={sort === key} onClick={() => setSort(key)}>{label}</button>)}</div>
        </div>
        <div className="acq-scroll slim-scroll" ref={viewport} role="region" aria-label="Contributor shelves" tabIndex={0}>
          <WindowedRows className="acq-contributors" items={visible} itemKey={rowKey} estimate={150} dataVersion={`${side}|${authorId}|${query}|${role}|${sort}|${JSON.stringify(filters)}|${rows.length}`} renderItem={(row, index) => <ShelfCard key={row.contributor.id} row={row} index={index} />} />
          {!visible.length && <div className="acq-empty"><p>No contributor matches these filters.</p><button type="button" onClick={clear}>Clear the filters</button></div>}
        </div>
      </div>
    </div>}
  </div>;
}

const usePreacherFacts = () => { const { data } = usePeopleData(); return useMemo(() => (data ? preacherFacts(data.people) : new Map<string, ProfileFacts>()), [data]); };
const useScholarFacts = () => { const { data } = useScholarsData(); return useMemo(() => (data ? scholarFacts(data.scholars, data.faiths) : new Map<string, ProfileFacts>()), [data]); };

// Each side loads only the profile file it needs: people.json is far larger than scholars.json, so the Scholars page
// never pulls it, and the whole-library page (no side) joins both.
function PreachersShelves(props: Omit<BodyProps, "facts">) { return <Shelves {...props} facts={usePreacherFacts()} />; }
function ScholarsShelves(props: Omit<BodyProps, "facts">) { return <Shelves {...props} facts={useScholarFacts()} />; }
function AllShelves(props: Omit<BodyProps, "facts">) {
  const people = usePreacherFacts(), scholars = useScholarFacts();
  const facts = useMemo(() => new Map([...people, ...scholars]), [people, scholars]);
  return <Shelves {...props} facts={facts} />;
}

export function AcquiredCatalogue({ side, authorId }: { side?: "preachers" | "scholars"; authorId?: string | null }) {
  if (side === "preachers") return <PreachersShelves side={side} authorId={authorId} />;
  if (side === "scholars") return <ScholarsShelves side={side} authorId={authorId} />;
  return <AllShelves side={side} authorId={authorId} />;
}
