import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FocusEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useRowWindow } from "@/lib/useRowWindow";
import { ACQUIRED_BASE, getAcquired, languageLabel, sourceLabel, workUrl, type AcquiredWork } from "./acquired";

// The library's front page list (/teachers/works, "Browse by collection"). One long list drawn a window of rows at a
// time (owner, 2026-10-29): the rows on screen plus 50 above and 50 below, released further out and drawn again on the
// way back (src/lib/useRowWindow.ts). Rows arrive a collection file (500 rows, owner 2026-10-29) at a time; the next
// file is fetched by itself as the reader nears the end of what has arrived, with a small loading line meanwhile. No
// page buttons. The rows per file are part of the folder name (<view>-500/), so a page still running an older build
// keeps reading the folder it knows and never mistakes a 500-row file for the last of 1,000-row ones.
interface Collection { id: string; source: string; records: number; readable: number; anonymous: number }
type Row = AcquiredWork & { authors: string[] };
interface Loaded { key: string; rows: Row[]; nextFile: number; done: boolean }

const FILE_ROWS = 500; // scripts/pack-teacher-library.py COLLECTION_ROWS
const ROW_ESTIMATE = 72;
const NOTHING: Loaded = { key: "", rows: [], nextFile: 0, done: true };

export function CollectionBrowser() {
  const [search, setSearch] = useSearchParams();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [error, setError] = useState("");
  const selected = collections.find(c => c.id === search.get("collection"));
  const view = search.get("view") === "all" ? "all" : "readable";
  const count = selected ? view === "readable" ? selected.readable : selected.records : 0;
  const listKey = selected ? `${selected.id}/${view}` : "";
  const [loaded, setLoaded] = useState<Loaded>(NOTHING);
  const [fetching, setFetching] = useState<string | null>(null), [moreError, setMoreError] = useState<{ key: string; message: string } | null>(null);
  const request = useRef<AbortController | null>(null), seen = useRef(new Set<string>());
  const list = loaded.key === listKey ? loaded : NOTHING;

  function change(key: string, value: string) {
    const next = new URLSearchParams(search); next.set(key, value);
    next.delete("page");
    setSearch(next, { preventScrollReset: true });
  }
  // Addresses from the paged list carried ?page=; the list now starts at the top, so drop it.
  useEffect(() => {
    if (!search.has("page")) return;
    const next = new URLSearchParams(search); next.delete("page");
    setSearch(next, { replace: true, preventScrollReset: true });
  }, [search, setSearch]);
  useEffect(() => {
    const abort = new AbortController();
    getAcquired<Collection[]>(`${ACQUIRED_BASE}/collections/index.json`, abort.signal).then(data => { if (!abort.signal.aborted) setCollections(data); }).catch(e => { if (!abort.signal.aborted) setError(e.message); });
    return () => abort.abort();
  }, []);
  // A new collection or view starts a new list.
  useEffect(() => {
    request.current?.abort(); request.current = null; seen.current = new Set();
    setFetching(null); setMoreError(null);
    setLoaded(listKey ? { key: listKey, rows: [], nextFile: 0, done: !count } : NOTHING);
  }, [listKey, count]);
  useEffect(() => () => request.current?.abort(), []);

  const loadNext = useCallback(() => {
    if (!selected || list.done || fetching === listKey || request.current) return;
    const key = listKey, file = list.nextFile, abort = new AbortController();
    request.current = abort; setFetching(key); setMoreError(null);
    getAcquired<unknown>(`${ACQUIRED_BASE}/collections/${selected.id}/${view}-${FILE_ROWS}/${file}.json`, abort.signal).then(data => {
      if (abort.signal.aborted) return;
      if (!Array.isArray(data)) throw new Error(`The collection file ${file + 1} is not a list of works.`);
      const fresh = (data as Row[]).filter(w => typeof w?.id === "string" && typeof w.title === "string" && !seen.current.has(w.id));
      fresh.forEach(w => seen.current.add(w.id));
      setLoaded(prev => {
        if (prev.key !== key || prev.nextFile !== file) return prev;
        const rows = fresh.length ? [...prev.rows, ...fresh.map(w => ({ ...w, authors: Array.isArray(w.authors) ? w.authors : [] }))] : prev.rows;
        // A short or empty file is the last one, whatever the index promised; never ask for the same file twice.
        return { key, rows, nextFile: file + 1, done: data.length < FILE_ROWS || rows.length >= count || (file + 1) * FILE_ROWS >= count };
      });
    }).catch(e => {
      if (!abort.signal.aborted) setMoreError({ key, message: e instanceof Error ? e.message : String(e) });
    }).finally(() => {
      if (request.current === abort) { request.current = null; setFetching(null); }
    });
  }, [selected, view, listKey, list.done, list.nextFile, fetching, count]);

  const [container, setContainer] = useState<HTMLUListElement | null>(null);
  const rows = list.rows;
  const rowOf = useMemo(() => new Map(rows.map((w, i) => [w.id, i])), [rows]);
  const rowKey = useCallback((i: number) => rows[i].id, [rows]);
  const rowOfAnchor = useCallback((id: string) => rowOf.get(id), [rowOf]);
  const { start, end, before, after, offsetOf } = useRowWindow({ rowCount: rows.length, rowKey, anchorKey: rowKey, rowOfAnchor, estimate: ROW_ESTIMATE, gap: 0, scroller: "window", container, dataVersion: listKey });
  const failed = moreError?.key === listKey ? moreError.message : "";
  // Within 50 rows of the end of what has arrived (the drawn window reaches it): fetch the next file.
  useEffect(() => { if (listKey && !list.done && !failed && (!rows.length || end >= rows.length - 1)) loadNext(); }, [listKey, list.done, failed, rows.length, end, loadNext]);

  // The row holding focus stays drawn, in its place, when the window moves away from it.
  const [focused, setFocused] = useState<string | null>(null);
  const onFocus = (e: FocusEvent<HTMLUListElement>) => setFocused((e.target as Element).closest("li[data-id]")?.getAttribute("data-id") ?? null);
  const onBlur = (e: FocusEvent<HTMLUListElement>) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(null); };
  const focusedRow = focused ? rowOf.get(focused) : undefined;
  const pinned = focusedRow !== undefined && (focusedRow < start || focusedRow > end) ? focusedRow : undefined;
  const row = (i: number, pin: boolean) => {
    const w = rows[i], style: CSSProperties | undefined = pin ? { position: "absolute", top: offsetOf(i), left: 0, right: 0 } : undefined;
    return <li key={w.id} data-id={w.id} data-row={i} data-pinned={pin ? "" : undefined} style={style} aria-posinset={i + 1} aria-setsize={count}>
      <Link to={workUrl(w.id)}><strong>{w.title}</strong><span>{w.authors.join("; ") || "Author not individually recorded"} · {languageLabel(w.language)}</span><small>{w.availability === "on-site-text" ? "Read on this site" : "Public text pending"}</small></Link>
    </li>;
  };
  // One flat list of keyed children, so a row moving between the drawn window and its pinned place keeps its element.
  const drawn = Array.from({ length: Math.max(0, end - start + 1) }, (_, k) => start + k);
  if (pinned !== undefined) { if (pinned < start) drawn.unshift(pinned); else drawn.push(pinned); }
  const firstLoad = !!listKey && !rows.length && fetching === listKey;

  return <section className="acq-collections"><h2>Browse by collection</h2><p>Explore texts, inscriptions and datasets, including records without a named author.</p>
    <div className="acq-controls"><label>Collection<select value={selected?.id ?? ""} onChange={e => change("collection", e.target.value)}><option value="">Choose a collection</option>{collections.map(c => <option key={c.id} value={c.id}>{sourceLabel(c.source)} · {c.records.toLocaleString()} records</option>)}</select></label><label>Reading availability<select value={view} onChange={e => change("view", e.target.value)}><option value="readable">Read on this site</option><option value="all">All catalogue records</option></select></label></div>
    {error && <p role="alert">{error}</p>}{firstLoad && <p role="status">Loading collection…</p>}
    {selected && <p className="acq-caption">{count.toLocaleString()} {view === "readable" ? "readable texts" : "catalogue records"}. {selected.anonymous.toLocaleString()} records in this collection have no named author. Editions and formats can overlap.</p>}
    {selected && !count && <p>No texts in this collection are cleared for public reading yet. Select all catalogue records to inspect the holdings.</p>}
    <div className="acq-works"><ul ref={setContainer} className="acq-collection-rows" role="list" style={{ paddingTop: before, paddingBottom: after }} onFocus={onFocus} onBlur={onBlur}>
      {drawn.map(i => row(i, i === pinned))}
    </ul></div>
    {!!rows.length && fetching === listKey && <p className="acq-more" role="status"><span className="acq-spinner" aria-hidden="true" />Loading more works…</p>}
    {failed && <p className="acq-more" role="alert">{failed} <button type="button" onClick={() => setMoreError(null)}>Try again</button></p>}
  </section>;
}
