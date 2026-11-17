import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutGrid, Table2 } from "lucide-react";
import { Link } from 'react-router-dom';
import { ScholarSectionHead as SectionHead } from "./SectionHead";
import { useScholars } from "./context";
import { Facets } from "./catalogue/Facets";
import { normaliseQuery, toggled, type FacetKey } from "./catalogue/filtering";
import { ALL_LIBRARY, type LibrarySort } from "./catalogue/library";
import { VirtualCards } from "./catalogue/VirtualCards";
import { ContributorTable } from './catalogue/ContributorTable';
import { PopulationCoverage } from './catalogue/PopulationCoverage';
import { POPULATION_BASE } from './population';
import { onExportLinkClick } from './catalogue/export-download';
import './catalogue/population.css';
import "./Catalogue.css";
import "./Fields.css";
import { formatNumber, plural } from "@/lib/site-format";

const SORTS: [LibrarySort, string][] = [['featured', 'Featured'], ['az', 'A–Z'], ['year', 'Birth year'], ['held', 'Most associated'], ['named', 'Most named']];
const EMPTY: never[] = [];
export function Catalogue() {
  const { data, library, libraryError, profile, cataloguePeople:visible, catalogueOptions:options, setCatalogueOptions:setOptions, catalogueSort:sort, setCatalogueSort:setSort, filters, filterCatalogue, openProfile } = useScholars();
  const people = library ?? EMPTY;
  const [view,setView]=useState<'table'|'cards'>('cards'); const [exportError, setExportError] = useState('');
  const [shelf, setShelf] = useState<string | null>(null);
  const scroll = useRef<HTMLDivElement | null>(null), [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const scrollRef = useCallback((el: HTMLDivElement | null) => { scroll.current = el; setScroller(el); }, []);
  useEffect(() => { setShelf(visible.length===1 && (filters.q===visible[0].id || filters.q===visible[0].name.toLocaleLowerCase())?visible[0].id:null); scroll.current?.scrollTo({ top: 0 }); }, [filters, options, sort, visible]);
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
    <p className="cat-coverage">{library ? `${formatNumber(data.scholars.length)} documented scholar profiles · ${formatNumber(library.length)} contributor entries` : `${formatNumber(data.scholars.length)} documented scholar profiles`}<Link className="cat-download" to="/analysis">Full-page list</Link><a className="cat-download" href={`${POPULATION_BASE}/scholars-library-export.zip`} download onClick={e => onExportLinkClick(e, setExportError)}>Download complete catalogue</a>{exportError && <span role="alert"> {exportError}</span>}</p>
    {libraryError && <p role="alert">{`The full library could not load: ${libraryError}. Reload to try again.`}</p>}
    <div className="cat-layout">
      <Facets view={view} data={data} filters={filters} people={people} options={options} onOptions={setOptions} text={text} onText={search}
        onToggle={(key: FacetKey, value: string) => set(toggled(filters, key, value))} onUsed={() => set({ ...filters, used: !filters.used })} onClear={clear} />
      <div className="cat-results">
        <div className="cat-bar"><p className="cat-count" aria-live="polite"><b>{library ? formatNumber(visible.length) : '…'}</b>{` of ${library ? plural(library.length, "{n} contributor", "{n} contributors") : '… contributors'}`}</p>
          <div className="cat-tools"><button type="button" className="cat-view-toggle" aria-label={view==='cards'?'Open full contributor table':'Return to catalogue cards'} aria-pressed={view==='table'} onClick={()=>{setView(view==='cards'?'table':'cards');scroll.current?.scrollTo({top:0,left:0});}}>{view==='cards'?<Table2 size={14} aria-hidden="true"/>:<LayoutGrid size={14} aria-hidden="true"/>}{view==='cards'?'Full table':'Card view'}</button>
          {view === 'table' ? <label className="cat-sort-select">Sort<select aria-label="Sort contributors" value={sort} onChange={e => setSort(e.target.value as LibrarySort)}>{SORTS.map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label> : <div className="cat-sort" role="radiogroup" aria-label="Sort by"><span className="cat-sort-l">Sort</span>{SORTS.map(([key,label]) => <button key={key} type="button" role="radio" data-sort={key} aria-checked={key === sort} onClick={() => setSort(key)}>{label}</button>)}</div>}</div></div>
        <div ref={scrollRef} className="cat-scroll slim-scroll" data-view={view} role="region" aria-label="Scholar and contributor results" tabIndex={0}>
          {!library && !libraryError && <p role="status">Loading every contributor…</p>}
          {/* Both views draw a window of rows over the whole list (owner's scroll rule, 2026-11-17: no "Show more"). */}
          {view==='table'?<div className="pop-table-wrap"><ContributorTable people={visible} data={data} expanded={shelf} onExpand={setShelf} onOpen={openProfile} scroller={scroller ?? undefined}/></div>:<VirtualCards people={visible} data={data} shelf={shelf} onShelf={setShelf} onOpen={openProfile} scroller={scroller} profileOrigin={profile?.origin ?? null} />}
          {library && !visible.length && <div className="cat-empty"><p>No contributor matches these filters.</p><button type="button" className="cat-clear" onClick={clear}>Clear the filters</button></div>}
        </div>
      </div>
    </div>
    {view==='table'&&<details className="cat-data-panel"><summary>Source coverage and unattributed works</summary><PopulationCoverage/></details>}
  </>;
}
