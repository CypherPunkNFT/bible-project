import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ACQUIRED_BASE, getAcquired, languageLabel, sourceLabel, workUrl, type AcquiredWork } from "./acquired";

interface Collection { id: string; source: string; records: number; readable: number; anonymous: number }
export function CollectionBrowser() {
  const [search, setSearch] = useSearchParams();
  const [collections, setCollections] = useState<Collection[]>([]), [rows, setRows] = useState<(AcquiredWork & { authors: string[] })[]>([]);
  const [error, setError] = useState(""), [loading, setLoading] = useState(false);
  const selected = collections.find(c => c.id === search.get("collection"));
  const view = search.get("view") === "all" ? "all" : "readable";
  const count = selected ? view === "readable" ? selected.readable : selected.records : 0;
  const pages = Math.ceil(count / 200);
  const requestedPage = Number(search.get("page") ?? 0);
  const page = Number.isSafeInteger(requestedPage) ? Math.max(0, Math.min(Math.max(0, pages - 1), requestedPage)) : 0;
  function change(key: string, value: string) {
    const next = new URLSearchParams(search); next.set(key, value);
    if (key !== "page") next.delete("page");
    setSearch(next, { preventScrollReset: true });
  }
  useEffect(() => {
    const abort = new AbortController();
    getAcquired<Collection[]>(`${ACQUIRED_BASE}/collections/index.json`, abort.signal).then(data => { if (!abort.signal.aborted) setCollections(data); }).catch(e => { if (!abort.signal.aborted) setError(e.message); });
    return () => abort.abort();
  }, []);
  useEffect(() => {
    const abort = new AbortController(); setRows([]); setError(""); setLoading(false);
    if (selected && count) {
      setLoading(true);
      getAcquired<(AcquiredWork & { authors: string[] })[]>(`${ACQUIRED_BASE}/collections/${selected.id}/${view}/${page}.json`, abort.signal).then(data => { if (!abort.signal.aborted) setRows(data); }).catch(e => { if (!abort.signal.aborted) setError(e.message); }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    }
    return () => abort.abort();
  }, [selected, count, view, page]);
  return <section className="acq-collections"><h2>Browse by collection</h2><p>Explore texts, inscriptions and datasets, including records without a named author.</p>
    <div className="acq-controls"><label>Collection<select value={selected?.id ?? ""} onChange={e => change("collection", e.target.value)}><option value="">Choose a collection</option>{collections.map(c => <option key={c.id} value={c.id}>{sourceLabel(c.source)} · {c.records.toLocaleString()} records</option>)}</select></label><label>Reading availability<select value={view} onChange={e => change("view", e.target.value)}><option value="readable">Read on this site</option><option value="all">All catalogue records</option></select></label></div>
    {error && <p role="alert">{error}</p>}{loading && <p role="status">Loading collection…</p>}
    {selected && <p className="acq-caption">{count.toLocaleString()} {view === "readable" ? "readable texts" : "catalogue records"}. {selected.anonymous.toLocaleString()} records in this collection have no named author. Editions and formats can overlap.</p>}
    {selected && !count && <p>No texts in this collection are cleared for public reading yet. Select all catalogue records to inspect the holdings.</p>}
    <div className="acq-works"><ul>{rows.map(w => <li key={w.id}><Link to={workUrl(w.id)}><strong>{w.title}</strong><span>{w.authors.join("; ") || "Author not individually recorded"} · {languageLabel(w.language)}</span><small>{w.availability === "on-site-text" ? "Read on this site" : "Public text pending"}</small></Link></li>)}</ul></div>
    {pages > 1 && <nav className="acq-pagination" aria-label="Collection pages"><button disabled={!page || loading} onClick={() => change("page", String(page - 1))}>Previous</button><label>Page <select aria-label="Collection page" value={page} onChange={e => change("page", e.target.value)}>{Array.from({length: pages}, (_, i) => <option key={i} value={i}>{i + 1} / {pages}</option>)}</select></label><button disabled={page + 1 === pages || loading} onClick={() => change("page", String(page + 1))}>Next</button></nav>}
  </section>;
}
