import { memo, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAcquired } from './teachers/shared/acquired';
import { preloadScholarLibrary } from './teachers/scholars/catalogue/useLibrary';
import { POPULATION_BASE, type PopulationEntry, type PopulationSnapshot } from './teachers/scholars/population';
import './analysis.css';

/** The page reads only names, aliases, dates and work counts: the build's analysis.json (scripts/split-scholar-index.mjs),
 *  1.9 MB instead of the 13 MB list. Dev mode has only the full list. */
type AnalysisList = Pick<PopulationSnapshot, 'entries'>;
/** Cards added per frame: all 9,106 in one go held the page for ~0.2 s; 1,000 a frame keeps each step short (2026-10-21). */
const CARDS_PER_FRAME = 1000;
const loadAnalysisList = () => getAcquired<AnalysisList>(`${POPULATION_BASE}/analysis.json`).catch((): Promise<AnalysisList> => preloadScholarLibrary());

function years(person: PopulationEntry): string {
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
const byText = new Intl.Collator().compare;

/** One frame's worth of cards. Memoised, so adding the next batch does not re-render every card already shown. */
const CardBatch = memo(function CardBatch({ people }: { people: PopulationEntry[] }) {
  return <>{people.map(p => <li className="analysis-card" key={p.id} data-contributor-id={p.id}>
    <h2 title={p.name}>{p.name}</h2>
    <div className="analysis-card-meta"><span title={p.facts.dates.sourceConflict ? 'Profile dates shown; conflicting source labels remain in the catalogue.' : undefined}>{years(p)}</span>
      <span><b>{p.counts.workGroups.toLocaleString()}</b> {p.counts.workGroups === 1 ? 'work record' : 'work records'}</span></div>
  </li>)}</>;
});

export default function AnalysisPage() {
  const [snapshot, setSnapshot] = useState<AnalysisList | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('name');
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  useEffect(() => {
    document.title = 'Analysis · The catalogue · Bible Guide';
    let live = true;
    loadAnalysisList().then(value => { if (live) setSnapshot(value); })
      .catch(reason => { if (live) setError(reason.message); });
    return () => { live = false; document.title = 'Bible Guide'; };
  }, []);
  const entries = useMemo(() => {
    const matches = (snapshot?.entries ?? []).filter(p => !deferredQuery ||
      [p.name, ...p.aliases, ...p.verifiedAliases].some(name => name.toLocaleLowerCase().includes(deferredQuery)));
    const birth = (p: PopulationEntry) => ['documented-profile', 'source-supported'].includes(p.facts.dates.status) ? p.facts.dates.born ?? Infinity : Infinity;
    return matches.sort((a, b) => {
      const difference = sort === 'works' ? b.counts.workGroups - a.counts.workGroups : sort === 'year' ? birth(a) - birth(b) : 0;
      return difference || byText(a.name, b.name) || byText(a.id, b.id);
    });
  }, [snapshot, deferredQuery, sort]);

  const batches = useMemo(() => Array.from({ length: Math.ceil(entries.length / CARDS_PER_FRAME) }, (_, i) => entries.slice(i * CARDS_PER_FRAME, (i + 1) * CARDS_PER_FRAME)), [entries]);
  const [shown, setShown] = useState(CARDS_PER_FRAME);
  useEffect(() => setShown(CARDS_PER_FRAME), [entries]);
  useEffect(() => {
    if (shown >= entries.length) return;
    const frame = requestAnimationFrame(() => setShown(n => n + CARDS_PER_FRAME));
    return () => cancelAnimationFrame(frame);
  }, [shown, entries.length]);

  return <div className="analysis-page">
    <header className="analysis-heading">
      <div><Link className="analysis-back" to="/teachers/scholars#catalogue">Scholars / Catalogue</Link>
        <h1>Every contributor, <em>one place.</em></h1></div>
      <p className="analysis-total">{snapshot ? snapshot.entries.length.toLocaleString() : '…'} <span>contributors</span></p>
    </header>
    <div className="analysis-toolbar">
      <input type="search" aria-label="Find a contributor" placeholder="Find a name…" value={query} onChange={e => setQuery(e.target.value)} />
      <label>Sort <select aria-label="Sort contributors" value={sort} onChange={e => setSort(e.target.value)}>
        <option value="name">Name A–Z</option><option value="year">Birth year</option><option value="works">Work records</option>
      </select></label>
      <p aria-live="polite">{snapshot ? `${entries.length.toLocaleString()} of ${snapshot.entries.length.toLocaleString()}` : 'Loading catalogue…'}</p>
    </div>
    <p className="analysis-count-note">Work records may include editions and chapters. Counts are provisional. * Conflicting source dates.</p>
    {error && <p role="alert">The catalogue could not load. <button type="button" onClick={() => window.location.reload()}>Try again</button></p>}
    {!snapshot && !error && <p role="status" className="analysis-status">Loading every contributor…</p>}
    {snapshot && !entries.length && <p className="analysis-status">No matching names. <button type="button" onClick={() => setQuery('')}>Clear search</button></p>}
    <ul className="analysis-grid" aria-label="All contributors">
      {batches.slice(0, Math.ceil(shown / CARDS_PER_FRAME)).map((people, i) => <CardBatch key={i} people={people} />)}
    </ul>
  </div>;
}
