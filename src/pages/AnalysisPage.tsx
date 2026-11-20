import { memo, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { WindowedRows } from '@/components/WindowedRows';
import { getAcquired } from './teachers/shared/acquired';
import { preloadScholarLibrary } from './teachers/scholars/catalogue/useLibrary';
import { POPULATION_BASE, type PopulationEntry } from './teachers/scholars/population';
import { analysisRow, loadSplitAnalysis, type AnalysisRow } from './teachers/scholars/population-split';
import './analysis.css';
import { formatNumber, plural, textCollator } from "@/lib/site-format";

/** The page reads only names, aliases, dates and work counts: the scholars split's analysis layer
 *  (scripts/split-data/datasets.ts, about 170 KB compressed). Where the split is missing (an older release) it reads the
 *  build's analysis.json (scripts/split-scholar-index.mjs), then the whole list. */
const loadAnalysisList = (): Promise<AnalysisRow[]> => loadSplitAnalysis().catch((error: unknown) => {
  console.warn('Analysis: the split list could not be read; reading analysis.json.', error);
  return getAcquired<{ entries: PopulationEntry[] }>(`${POPULATION_BASE}/analysis.json`)
    .catch(() => preloadScholarLibrary())
    .then(({ entries }) => entries.map(analysisRow));
});
/** A card's height before one is measured: two lines of name and the meta line (analysis.css, min-height 88px). */
const CARD_ESTIMATE = 88;
const keyOf = (person: AnalysisRow) => String(person.place);

function years(person: AnalysisRow): string {
  const d = person.facts.dates;
  if (d.status === 'conflicting') return 'Dates disputed';
  if (d.status === 'needs-review') return 'Dates unverified';
  const year = (n: number) => n < 0 ? `${Math.abs(n)} BCE` : String(n);
  const circa = d.approximate ? 'c. ' : '';
  const conflict = d.sourceConflict ? ' *' : '';
  if (d.born != null) return `${circa}${year(d.born)}${d.died != null ? `–${year(d.died)}` : ' born'}${conflict}`;
  if (d.floruit != null) return `fl. ${circa}${year(d.floruit)}`;
  if (d.died != null) return `d. ${circa}${year(d.died)}`;
  return 'Year unknown';
}

/** The same order as localeCompare, from one collator instead of one per comparison. */
const byText = textCollator().compare;

/** One card; memoised, so scrolling draws only the rows that come into the window. */
const Card = memo(function Card({ person: p, row }: { person: AnalysisRow; row: number }) {
  return <li className="analysis-card" data-row={row} data-contributor-id={p.id}>
    <h2 title={p.name}>{p.name}</h2>
    <div className="analysis-card-meta"><span title={p.facts.dates.sourceConflict ? 'Profile dates shown; conflicting source labels remain in the catalogue.' : undefined}>{years(p)}</span>
      <span><b>{formatNumber(p.counts.workGroups)}</b> {plural(p.counts.workGroups, "work record", "work records")}</span></div>
  </li>;
});

export default function AnalysisPage() {
  const [list, setList] = useState<AnalysisRow[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('name');
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  useEffect(() => {
    document.title = 'Analysis · The catalogue · Bible Guide';
    let live = true;
    loadAnalysisList().then(value => { if (live) setList(value); })
      .catch(reason => { if (live) setError(reason.message); });
    return () => { live = false; document.title = 'Bible Guide'; };
  }, []);
  const entries = useMemo(() => {
    const matches = (list ?? []).filter(p => !deferredQuery ||
      [p.name, ...p.aliases, ...p.verifiedAliases].some(name => name.toLocaleLowerCase().includes(deferredQuery)));
    const birth = (p: AnalysisRow) => ['documented-profile', 'source-supported'].includes(p.facts.dates.status) ? p.facts.dates.born ?? Infinity : Infinity;
    return matches.sort((a, b) => {
      const difference = sort === 'works' ? b.counts.workGroups - a.counts.workGroups : sort === 'year' ? birth(a) - birth(b) : 0;
      return difference || byText(a.name, b.name) || a.place - b.place;
    });
  }, [list, deferredQuery, sort]);

  return <div className="analysis-page">
    <header className="analysis-heading">
      <div><Link className="analysis-back" to="/teachers/scholars#catalogue">Scholars / Catalogue</Link>
        <h1>Every contributor, <em>one place.</em></h1></div>
      <p className="analysis-total">{list ? formatNumber(list.length) : '…'} <span>contributors</span></p>
    </header>
    <div className="analysis-toolbar">
      <input type="search" aria-label="Find a contributor" placeholder="Find a name…" value={query} onChange={e => setQuery(e.target.value)} />
      <label>Sort <select aria-label="Sort contributors" value={sort} onChange={e => setSort(e.target.value)}>
        <option value="name">Name A–Z</option><option value="year">Birth year</option><option value="works">Work records</option>
      </select></label>
      <p aria-live="polite">{list ? `${formatNumber(entries.length)} of ${formatNumber(list.length)}` : 'Loading catalogue…'}</p>
    </div>
    <p className="analysis-count-note">Work records may include editions and chapters. Counts are provisional. * Conflicting source dates.</p>
    {error && <p role="alert">The catalogue could not load. <button type="button" onClick={() => window.location.reload()}>Try again</button></p>}
    {!list && !error && <p role="status" className="analysis-status">Loading every contributor…</p>}
    {list && !entries.length && <p className="analysis-status">No matching names. <button type="button" onClick={() => setQuery('')}>Clear search</button></p>}
    {/* A window of rows: those on screen and 50 above and below, drawn as the reader scrolls (all 9,111 cards at once were
        ~100,000 elements, and scrolling to the end took over four minutes on a phone profile, 2026-11-19). */}
    <WindowedRows as="ul" className="analysis-grid" aria-label="All contributors" items={entries} itemKey={keyOf} estimate={CARD_ESTIMATE}
      dataVersion={`${deferredQuery}|${sort}|${list?.length ?? 0}`} renderItem={(person, row) => <Card key={keyOf(person)} person={person} row={row} />} />
  </div>;
}
