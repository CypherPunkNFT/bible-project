import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { ScholarSectionHead as SectionHead } from "./SectionHead";
import { useScholars } from "./context";
import { Card } from "./catalogue/Card";
import { Facets } from "./catalogue/Facets";
import { normaliseQuery, toggled, type FacetKey } from "./catalogue/filtering";
import { ALL_LIBRARY, matchesLibrary, orderLibrary, type LibrarySort } from "./catalogue/library";
import { LibraryCard } from "./catalogue/LibraryCard";
import { Evidence } from "./catalogue/Evidence";
import { FieldWorks } from "./FieldWorks";
import "./Catalogue.css";
import "./Fields.css";

const BATCH_SIZE = 48;
const SORTS: [LibrarySort, string][] = [['featured', 'Featured'], ['az', 'A–Z'], ['year', 'Year'], ['held', 'Most held'], ['named', 'Most named']];
const EMPTY: never[] = [];
const noop = () => {};
export function Catalogue() {
  const { data, library, libraryError, catalogueResetToken, filters, filterCatalogue, setShownIds, openProfile } = useScholars();
  const people = library ?? EMPTY;
  const [sort, setSort] = useState<LibrarySort>('featured'), [options, setOptions] = useState(ALL_LIBRARY);
  const [loaded, setLoaded] = useState(BATCH_SIZE), [shelf, setShelf] = useState<string | null>(null);
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => { setOptions(ALL_LIBRARY); }, [catalogueResetToken]);
  const visible = useMemo(() => orderLibrary(people.filter(p => matchesLibrary(p, filters, options)), sort), [people, filters, options, sort]);
  const slice = visible.slice(0, loaded);
  useEffect(() => setShownIds(visible.flatMap(p => p.scholar ? [p.scholar.id] : [])), [visible, setShownIds]);
  useEffect(() => { setLoaded(BATCH_SIZE); setShelf(null); scroll.current?.scrollTo({ top: 0 }); }, [filters, options, sort]);
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
      line={<>The currently catalogued contributors, including CCEL and the Latin Fathers. Open a documented profile or browse a contributor’s held works. Work subjects can overlap; unclassified names and unknown dates are included. Acquired holdings are still being reconciled.</>} />
    <p className="cat-coverage">{data.scholars.length} documented scholar profiles{library && <> · {library.length.toLocaleString()} catalogue entries · {library.filter(p => !Object.keys(p.fields).length).length.toLocaleString()} without an assigned field</>}. Authors, editors, translators and named collections retain their source credits. Year sorts by known birth or activity dates, with unknowns last.</p>
    {libraryError && <p role="alert">The full library could not load: {libraryError}. Reload to try again.</p>}
    <div className="cat-layout">
      <Facets data={data} filters={filters} people={people} options={options} onOptions={setOptions} text={text} onText={search}
        onToggle={(key: FacetKey, value: string) => set(toggled(filters, key, value))} onUsed={() => set({ ...filters, used: !filters.used })} onClear={clear} />
      <div className="cat-results">
        <div className="cat-bar"><p className="cat-count" aria-live="polite"><b>{library ? visible.length.toLocaleString() : '…'}</b> of {library ? library.length.toLocaleString() : '…'} contributors</p>
          <div className="cat-sort" role="radiogroup" aria-label="Sort by"><span className="cat-sort-l">Sort</span>{SORTS.map(([key,label]) => <button key={key} type="button" role="radio" data-sort={key} aria-checked={key === sort} onClick={() => setSort(key)}>{label}</button>)}</div></div>
        <div ref={scroll} className="cat-scroll" role="region" aria-label="Scholar and contributor cards" tabIndex={0}>
          {!library && !libraryError && <p role="status">Loading every contributor…</p>}
          <div className="cat-grid">{slice.map(p => shelf === p.id ? <article className="cat-shelf" key={p.id} data-id={p.id}>
            <div className="cat-shelf-heading"><h3>{p.name}</h3><button type="button" onClick={() => setShelf(null)}>Close works</button></div>
            <p>{p.roles.join(' · ')} · {p.records.toLocaleString()} held records. Editions and formats may overlap.</p>
            <p>{p.traditions.length ? `Recorded tradition: ${p.traditions.join(', ')}.` : 'Faith and tradition not recorded.'}</p>
            <Evidence person={p} />
            <FieldWorks key={p.id} entry={p} />
          </article> : p.scholar ? <div key={p.id} className="cat-profile-wrap">
            <Card data={data} s={p.scholar} order={0} onOpen={openProfile} cardRef={noop} />
            <div className="cat-profile-actions"><span>Documented profile</span><button type="button" onClick={() => setShelf(p.id)} aria-label={`Browse held works by ${p.name}`}>{p.records.toLocaleString()} held · Browse works</button></div>
          </div> : <LibraryCard key={p.id} person={p} data={data} onOpen={() => setShelf(p.id)} />)}</div>
          {library && !visible.length && <div className="cat-empty"><p>No contributor matches these filters.</p><button type="button" className="cat-clear" onClick={clear}>Clear the filters</button></div>}
        </div>
      </div>
    </div>
  </>;
}
