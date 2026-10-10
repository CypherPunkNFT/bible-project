import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ACQUIRED_BASE, recordUrl, getAcquired, workUrl, languageLabel, sourceLabel, type AcquiredCatalogue as Catalogue, type AcquiredContributor, type AcquiredWork } from "./acquired";
import { SectionHead } from "./Frame";
import "./acquired.css";

function useAcquiredCatalogue() {
  const [data, setData] = useState<Catalogue | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    getAcquired<Catalogue>(`${ACQUIRED_BASE}/catalogue.json`, abort.signal).then(setData).catch(error => { if (!abort.signal.aborted) setError(String(error.message)); });
    return () => abort.abort();
  }, []);
  return { data, error };
}

export function AcquisitionNotice({ side }: { side: "preachers" | "scholars" }) {
  const { data } = useAcquiredCatalogue();
  if (!data) return null;
  const own = data.contributors.filter(c => c.side === side);
  return <div className="acq-notice"><p><strong>{own.length.toLocaleString()} acquired {side === "preachers" ? "authors and assemblies" : "authors and editors"}</strong><span>New holdings appear in the acquired catalogue below, including contributors whose biography is still unrecorded.</span></p><a href="#acquired">Browse their texts →</a></div>;
}

export function ContributorWorks({ contributor }: { contributor: AcquiredContributor }) {
  const [rows, setRows] = useState<AcquiredWork[]>([]), [query, setQuery] = useState(""), [page, setPage] = useState(0), [error, setError] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    setRows([]); setError(""); setPage(0);
    recordUrl(contributor.id, "contributors").then(url => getAcquired<Record<string, AcquiredWork[]>>(url, abort.signal)).then(data => { if (!abort.signal.aborted) setRows(data[contributor.id] ?? []); }).catch(error => { if (!abort.signal.aborted) setError(error.message); });
    return () => abort.abort();
  }, [contributor.id]);
  const found = useMemo(() => rows.filter(w => `${w.title} ${w.source} ${w.language}`.toLowerCase().includes(query.toLowerCase())), [rows, query]);
  return <div className="acq-works">
    <label>Find a work<input value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} placeholder="Title, source or language" /></label>
    <p className="acq-caption">{found.length.toLocaleString()} text representations. Editions and formats can overlap; this is not a count of distinct books.</p>
    {error && <p role="alert">{error}</p>}
    <ul>{found.slice(page * 20, (page + 1) * 20).map(w => <li key={w.id}><Link to={workUrl(w.id)}><strong>{w.title}</strong><span>{languageLabel(w.language)} · {sourceLabel(w.source)}</span><small>{w.availability === "on-site-text" ? "Read on this site" : "Held · public text pending"}</small></Link></li>)}</ul>
    {found.length > 20 && <nav className="acq-pagination" aria-label="Work pages"><button disabled={!page} onClick={() => setPage(p => p - 1)}>Previous</button><span>{page + 1} / {Math.ceil(found.length / 20)}</span><button disabled={(page + 1) * 20 >= found.length} onClick={() => setPage(p => p + 1)}>Next</button></nav>}
  </div>;
}

function ContributorCard({ contributor: c }: { contributor: AcquiredContributor }) {
  const [open, setOpen] = useState(false);
  return <details onToggle={e => setOpen(e.currentTarget.open)}><summary><strong>{c.name}</strong><span>{c.roles.join(", ")} · {c.records.toLocaleString()} held · {c.readable.toLocaleString()} readable here</span></summary><p className="acq-caption">{c.traditions.length ? `Recorded tradition: ${c.traditions.join(", ")}.` : "Faith and tradition not recorded."} {c.profileId ? "A documented profile is also in the main biographical catalogue." : "Biography not yet recorded."}</p>{c.sourceLifeDates?.length ? <p className="acq-caption">Source life-date labels: {c.sourceLifeDates.join("; ")}. These are transcribed identity evidence, not a reviewed biography.</p> : null}{open && <ContributorWorks contributor={c} />}</details>;
}

export function AcquiredCatalogue({ side, authorId }: { side?: "preachers" | "scholars"; authorId?: string | null }) {
  const { data, error } = useAcquiredCatalogue();
  const [query, setQuery] = useState(""), [role, setRole] = useState(""), [page, setPage] = useState(0);
  const contributors = useMemo(() => data?.contributors.filter(c => (!side || c.side === side) && (!authorId || c.id === authorId) && (!role || c.roles.includes(role)) && `${c.name} ${c.traditions.join(" ")}`.toLowerCase().includes(query.toLowerCase())) ?? [], [data, side, authorId, role, query]);
  return <div className="acq-catalogue">
    <SectionHead num={side === "preachers" ? "09" : "08"} kicker="Acquired library" title={<>The texts we hold, <em>by contributor</em></>} line="Authors and editors identified in the acquired editions. Open their shelves here; recorded biographies and traditions remain separate from holdings." />
    <div className="acq-controls"><label>Find a contributor<input value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} placeholder="Name or recorded tradition" /></label><label>Role<select value={role} onChange={e => { setRole(e.target.value); setPage(0); }}><option value="">All roles</option><option value="author">Author</option><option value="editor">Editor</option><option value="translator">Translator</option></select></label></div>
    {error && <p role="alert">{error}</p>}
    {!data && !error && <p role="status">Loading acquired catalogue…</p>}
    {data && <p className="acq-caption">{contributors.length.toLocaleString()} contributors · snapshot {new Date(data.updatedAt).toLocaleDateString()}. Unknown life dates and faith are not inferred from a text or name.</p>}
    {data && !contributors.length && <p>No contributors match these filters.</p>}
    <div className="acq-contributors">{contributors.slice(page * 24, (page + 1) * 24).map(c => <ContributorCard key={c.id} contributor={c} />)}</div>
    {contributors.length > 24 && <nav className="acq-pagination" aria-label="Contributor pages"><button disabled={!page} onClick={() => setPage(p => p - 1)}>Previous</button><span>{page + 1} / {Math.ceil(contributors.length / 24)}</span><button disabled={(page + 1) * 24 >= contributors.length} onClick={() => setPage(p => p + 1)}>Next</button></nav>}
  </div>;
}
