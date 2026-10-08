// 01 · The catalogue: a facet panel (search, used on this site, field, era, faith, each with live counts), a sort
// control, a live count and one card per scholar. Its filters ARE the page's shared `filters` (By the numbers and the
// other sections set them too); it sets them only through filterCatalogue(…, { scroll: false }) and publishes the
// on-screen order with setShownIds, which the profile's previous / next follow. Clicking a card opens the profile,
// grown out of the card. Approved mock-up: design/scholars-directions/scholars/catalogue.js.
import { useEffect, useMemo, useRef, useState } from "react";
import { SectionHead } from "../shared/Frame";
import { useScholars } from "./context";
import { CardGrid } from "./catalogue/CardGrid";
import { Facets } from "./catalogue/Facets";
import { buildHaystack, normaliseQuery, passes, SORTS, sortScholars, toggled, type FacetKey, type SortKey } from "./catalogue/filtering";
import "./Catalogue.css";

export function Catalogue() {
  const { data, filters, filterCatalogue, setShownIds, openProfile } = useScholars();
  const [sort, setSort] = useState<SortKey>("year");
  const haystack = useMemo(() => buildHaystack(data), [data]);
  const visible = useMemo(() => sortScholars(data.scholars.filter((s) => passes(s, filters, haystack)), sort).map((s) => s.id), [data, filters, haystack, sort]);
  useEffect(() => setShownIds(visible), [visible, setShownIds]);

  // The search box types freely; the filter follows 140 ms after the last key. A search set from elsewhere shows here.
  const [text, setText] = useState(filters.q);
  const latest = useRef(filters);
  latest.current = filters;
  const typed = useRef(text);
  typed.current = text;
  useEffect(() => { if (normaliseQuery(typed.current) !== filters.q) setText(filters.q); }, [filters.q]);
  useEffect(() => {
    const q = normaliseQuery(text);
    if (q === latest.current.q) return;
    const wait = window.setTimeout(() => filterCatalogue({ ...latest.current, q }, { scroll: false }), 140);
    return () => window.clearTimeout(wait);
  }, [text, filterCatalogue]);

  const set = (next: typeof filters) => filterCatalogue(next, { scroll: false });
  const clear = () => { setText(""); set({ field: [], era: [], faith: [], used: false, q: "" }); };
  const total = data.scholars.length;
  return <>
    <SectionHead num="01" kicker="The catalogue" title={<>Every scholar, <em>one card each</em></>}
      line="Narrow by field, era or faith, or show only the ones this site uses. Click a card to open the full profile." />
    <div className="cat-layout">
      <Facets data={data} filters={filters} haystack={haystack} text={text} onText={setText}
        onToggle={(key: FacetKey, value: string) => set(toggled(filters, key, value))} onUsed={() => set({ ...filters, used: !filters.used })} onClear={clear} />
      <div className="cat-results">
        <div className="cat-bar"><p className="cat-count" aria-live="polite"><b>{visible.length}</b> of {total} scholars</p>
          <div className="cat-sort" role="radiogroup" aria-label="Sort by"><span className="cat-sort-l">Sort</span>
            {SORTS.map(({ key, label }) => <button key={key} type="button" role="radio" data-sort={key} aria-checked={key === sort} onClick={() => setSort(key)}>{label}</button>)}</div></div>
        <CardGrid data={data} visible={visible} onOpen={openProfile} />
        <div className="cat-empty" hidden={visible.length > 0}><p>No scholar matches all of these.</p>
          <button type="button" className="cat-clear" onClick={clear}>Clear the filters</button></div>
      </div>
    </div>
  </>;
}
