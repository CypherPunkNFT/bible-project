import { startTransition, useEffect, useRef, useState } from "react";
import { LayoutGrid, Table2 } from "lucide-react";
import { ScholarSectionHead as SectionHead } from "./SectionHead";
import { useScholars } from "./context";
import { Card } from "./catalogue/Card";
import { Facets } from "./catalogue/Facets";
import { normaliseQuery, toggled, type FacetKey } from "./catalogue/filtering";
import { ALL_LIBRARY, type LibrarySort } from "./catalogue/library";
import { LibraryCard } from "./catalogue/LibraryCard";
import { FieldWorks } from "./FieldWorks";
import { ContributorTable } from './catalogue/ContributorTable';
import { PopulationCoverage } from './catalogue/PopulationCoverage';
import { POPULATION_BASE } from './population';
import './catalogue/population.css';
import "./Catalogue.css";
import "./Fields.css";

const BATCH_SIZE = 48;
const SORTS: [LibrarySort, string][] = [['featured', 'Featured'], ['az', 'A–Z'], ['year', 'Birth year'], ['held', 'Most associated'], ['named', 'Most named']];
const EMPTY: never[] = [];
const noop = () => {};
export function Catalogue() {
  const { data, library, libraryError, cataloguePeople:visible, catalogueOptions:options, setCatalogueOptions:setOptions, catalogueSort:sort, setCatalogueSort:setSort, filters, filterCatalogue, openProfile } = useScholars();
  const people = library ?? EMPTY;
  const [view,setView]=useState<'table'|'cards'>('cards');
  const [loaded, setLoaded] = useState(BATCH_SIZE), [shelf, setShelf] = useState<string | null>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const slice = visible.slice(0, loaded);
  useEffect(() => { setLoaded(BATCH_SIZE); setShelf(visible.length===1 && (filters.q===visible[0].id || filters.q===visible[0].name.toLocaleLowerCase())?visible[0].id:null); scroll.current?.scrollTo({ top: 0 }); }, [filters, options, sort, visible]);
  useEffect(() => {
    const root = scroll.current;
    if (!root || loaded >= visible.length) return;
    let frame = 0, queued = false;
    const check = () => {
      frame = 0;
      const travel = root.scrollHeight - root.clientHeight;
      // Prepare the next batch at 40% of the currently rendered scroll range.
      // Appending retains existing cards, focus, open shelves and scroll position.
      if (!queued && (travel <= 1 || root.scrollTop >= travel * .4)) {
        queued = true;
        startTransition(() => setLoaded(n => Math.min(n + BATCH_SIZE, visible.length)));
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(check); };
    root.addEventListener('scroll', schedule, { passive: true });
    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    return () => { root.removeEventListener('scroll', schedule); resize.disconnect(); cancelAnimationFrame(frame); };
  }, [loaded, visible]);
  useEffect(() => {
    if (!shelf || !scroll.current) return;
    const opened = scroll.current.querySelector<HTMLElement>('.cat-shelf');
    if (opened) {
      scroll.current.scrollTop += opened.getBoundingClientRect().top - scroll.current.getBoundingClientRect().top;
      opened.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    }
  }, [shelf]);
  const [text, setText] = useState(filters.q);
  const typed = useRef(text); typed.current = text;
  useEffect(() => { if (normaliseQuery(typed.current) !== filters.q) setText(filters.q); }, [filters.q]);
  const set = (next: typeof filters) => filterCatalogue(next, { scroll: false });
  const search = (value: string) => { setText(value); set({ ...filters, q: normaliseQuery(value) }); };
  const clear = () => { setText(''); setOptions(ALL_LIBRARY); set({ field: [], era: [], faith: [], used: false, q: '' }); };
  return <>
    <span id="acquired" /><span id="fields" />
    <SectionHead section="catalogue" kicker="The catalogue" title={<>Every contributor, <em>one place</em></>}
      line={<>Explore authors, translators and their works across the full library. Open a documented profile or browse a contributor’s works.</>} />
    <p className="cat-coverage">{data.scholars.length} documented scholar profiles{library && <> · {library.length.toLocaleString()} contributor entries</>}<a className="cat-download" href={`${POPULATION_BASE}/scholars-library-export.zip`} download>Download complete catalogue</a></p>
    {libraryError && <p role="alert">The full library could not load: {libraryError}. Reload to try again.</p>}
    <div className="cat-layout">
      <Facets view={view} data={data} filters={filters} people={people} options={options} onOptions={setOptions} text={text} onText={search}
        onToggle={(key: FacetKey, value: string) => set(toggled(filters, key, value))} onUsed={() => set({ ...filters, used: !filters.used })} onClear={clear} />
      <div className="cat-results">
        <div className="cat-bar"><p className="cat-count" aria-live="polite"><b>{library ? visible.length.toLocaleString() : '…'}</b> of {library ? library.length.toLocaleString() : '…'} contributors</p>
          <div className="cat-tools"><button type="button" className="cat-view-toggle" aria-label={view==='cards'?'Open full contributor table':'Return to catalogue cards'} aria-pressed={view==='table'} onClick={()=>{setView(view==='cards'?'table':'cards');scroll.current?.scrollTo({top:0,left:0});}}>{view==='cards'?<Table2 size={14} aria-hidden="true"/>:<LayoutGrid size={14} aria-hidden="true"/>}{view==='cards'?'Full table':'Card view'}</button>
          {view === 'table' ? <label className="cat-sort-select">Sort<select aria-label="Sort contributors" value={sort} onChange={e => setSort(e.target.value as LibrarySort)}>{SORTS.map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label> : <div className="cat-sort" role="radiogroup" aria-label="Sort by"><span className="cat-sort-l">Sort</span>{SORTS.map(([key,label]) => <button key={key} type="button" role="radio" data-sort={key} aria-checked={key === sort} onClick={() => setSort(key)}>{label}</button>)}</div>}</div></div>
        <div ref={scroll} className="cat-scroll slim-scroll" data-view={view} role="region" aria-label="Scholar and contributor results" tabIndex={0}>
          {!library && !libraryError && <p role="status">Loading every contributor…</p>}
          {view==='table'?<div className="pop-table-wrap"><ContributorTable people={slice} data={data} expanded={shelf} onExpand={setShelf} onOpen={openProfile}/></div>:<div className="cat-grid">{slice.map(p => shelf === p.id ? <article className="cat-shelf" key={p.id} data-id={p.id}>
            <div className="cat-shelf-heading"><h3>{p.name}</h3><button type="button" onClick={() => setShelf(null)}>Close works</button></div>
            <p>{p.roles.join(' · ')} · {p.records.toLocaleString()} associated records. Source records, editions and reading copies may overlap.</p>
            <p>{p.traditions.length ? `Recorded tradition: ${p.traditions.join(', ')}.` : 'Faith and tradition not recorded.'}</p>
            {p.sourceLifeDates.length > 0 && <p>Source date labels: {p.sourceLifeDates.join('; ')}.</p>}
            <FieldWorks key={p.id} entry={p} />
          </article> : p.scholar ? <Card key={p.id} data={data} s={p.scholar} order={0} onOpen={openProfile} cardRef={noop} /> : <LibraryCard key={p.id} person={p} data={data} onOpen={() => setShelf(p.id)} />)}</div>}
          {loaded<visible.length&&<button type="button" className="pop-load" onClick={()=>setLoaded(n=>Math.min(n+BATCH_SIZE,visible.length))}>Show more contributors ({Math.min(loaded,visible.length).toLocaleString()} of {visible.length.toLocaleString()})</button>}
          {library && !visible.length && <div className="cat-empty"><p>No contributor matches these filters.</p><button type="button" className="cat-clear" onClick={clear}>Clear the filters</button></div>}
        </div>
      </div>
    </div>
    {view==='table'&&<details className="cat-data-panel"><summary>Source coverage and unattributed works</summary><PopulationCoverage/></details>}
  </>;
}
