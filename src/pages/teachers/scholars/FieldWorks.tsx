import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAcquired, recordUrl, workUrl, type AcquiredWork } from '../shared/acquired';
import type { FieldEntry, FieldWork } from './field-library';

// Reuse existing contributor shards; never fetch or expose private text to build the list.
export function FieldWorks({ entry }: { entry: FieldEntry }) {
  const [works, setWorks] = useState<FieldWork[]>(entry.supplements);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [query, setQuery] = useState(''), [loaded, setLoaded] = useState(20);
  const scroll = useRef<HTMLUListElement>(null);
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
  useEffect(() => {
    const root = scroll.current;
    if (!root || loaded >= found.length) return;
    let frame = 0, queued = false;
    const check = () => {
      frame = 0;
      const travel = root.scrollHeight - root.clientHeight;
      if (!queued && (travel <= 1 || root.scrollTop >= travel * .4)) {
        queued = true;
        startTransition(() => setLoaded(n => Math.min(n + 20, found.length)));
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(check); };
    root.addEventListener('scroll', schedule, { passive: true });
    const resize = new ResizeObserver(schedule); resize.observe(root);
    return () => { root.removeEventListener('scroll', schedule); resize.disconnect(); cancelAnimationFrame(frame); };
  }, [found, loaded]);
  return <div className="fld-works">
    <label>Find a held work<input type="search" value={query} onChange={e => { setQuery(e.target.value); setLoaded(20); scroll.current?.scrollTo({ top: 0 }); }} /></label>
    {loading && <p role="status">Loading works…</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && <p>{found.length.toLocaleString()} recorded editions and text copies</p>}
    <ul ref={scroll} className="fld-works-scroll" aria-label={`${entry.name} held works`} tabIndex={0}>{found.slice(0, loaded).map(w => <li key={w.id}><Link to={workUrl(w.id)}>{w.title}<small>{w.availability === 'on-site-text' ? 'Read on this site' : 'Held in the library'} · {w.source}</small></Link></li>)}</ul>
    {!loading && !found.length && <p>No works match this search.</p>}
  </div>;
}
