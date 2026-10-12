import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAcquired, recordUrl, workUrl, type AcquiredWork } from '../shared/acquired';
import type { FieldEntry, FieldWork } from './field-library';

// Reuse existing contributor shards; never fetch or expose private text to build the list.
export function FieldWorks({ entry }: { entry: FieldEntry }) {
  const [works, setWorks] = useState<FieldWork[]>(entry.supplements);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [query, setQuery] = useState(''), [page, setPage] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    async function load() {
      try {
        const urls = [...new Set(await Promise.all(entry.contributorIds.map(id => recordUrl(id, 'contributors'))))];
        const shards = await Promise.all(urls.map(url => getAcquired<Record<string, AcquiredWork[]>>(url, abort.signal)));
        const rows = new Map<string, FieldWork>(entry.supplements.map(w => [w.id, w]));
        for (const shard of shards) for (const id of entry.contributorIds) for (const w of shard[id] ?? []) rows.set(w.id, w);
        if (!abort.signal.aborted) setWorks([...rows.values()].sort((a, b) => a.title.localeCompare(b.title)));
      } catch (e) { if (!abort.signal.aborted) setError((e as Error).message); }
      finally { if (!abort.signal.aborted) setLoading(false); }
    }
    void load();
    return () => abort.abort();
  }, [entry]);
  const found = useMemo(() => works.filter(w => `${w.title} ${w.source}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [works, query]);
  return <div className="fld-works">
    <label>Find a held work<input type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} /></label>
    {loading && <p role="status">Loading works…</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && <p>{found.length.toLocaleString()} recorded editions and text copies</p>}
    <ul>{found.slice(page * 10, (page + 1) * 10).map(w => <li key={w.id}><Link to={workUrl(w.id)}>{w.title}<small>{w.availability === 'on-site-text' ? 'Read on this site' : 'Held in the library'} · {w.source}</small></Link></li>)}</ul>
    {!loading && !found.length && <p>No works match this search.</p>}
    {found.length > 10 && <nav aria-label={`${entry.name} work pages`}><button type="button" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button><span>{page + 1} / {Math.ceil(found.length / 10)}</span><button type="button" disabled={(page + 1) * 10 >= found.length} onClick={() => setPage(p => p + 1)}>Next</button></nav>}
  </div>;
}
