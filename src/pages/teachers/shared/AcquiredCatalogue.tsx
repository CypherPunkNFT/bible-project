import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getContributorShelf, loadAcquiredCatalogue, workUrl, languageCodes, languageLabel, sourceLabel, type AcquiredCatalogue as Catalogue, type AcquiredContributor, type AcquiredWork } from "./acquired";
import { SectionHead } from "./Frame";
import "./acquired.css";
import { WindowedRows } from "@/components/WindowedRows";
import { formatDate, formatNumber, plural } from "@/lib/site-format";

// Its own text node after the count: the collector skips a text with ";".
const OVERLAP_NOTE = "Editions and formats can overlap; this is not a count of distinct books.";
// Every work and every contributor, drawn a window of rows at a time as the page (or drawer) scrolls: no page buttons
// (owner's scroll rule, 2026-11-17).
const workKey = (w: AcquiredWork) => w.id;
const contributorKey = (c: AcquiredContributor) => c.id;

/** The catalogue, read once the section nears the screen (within 300px): on /teachers/works it sits below the
 *  collections, and its 8,477 contributors are 230 KB to download (owner, 2026-11-19). */
function useAcquiredCatalogue() {
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [data, setData] = useState<Catalogue | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const element = box.current;
    if (near || !element) return;
    if (!("IntersectionObserver" in window)) { setNear(true); return; }
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); setNear(true); } }, { rootMargin: "300px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [near]);
  useEffect(() => {
    if (!near) return;
    const abort = new AbortController();
    loadAcquiredCatalogue(abort.signal).then(setData).catch(error => { if (!abort.signal.aborted) setError(String(error.message)); });
    return () => abort.abort();
  }, [near]);
  return { box, data, error };
}

export function ContributorWorks({ contributor, onOpenWork }: { contributor: Pick<AcquiredContributor, "id">; onOpenWork?: (work: AcquiredWork, origin: HTMLElement) => void }) {
  const [rows, setRows] = useState<AcquiredWork[]>([]), [query, setQuery] = useState(""), [error, setError] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    setRows([]); setError("");
    getContributorShelf(contributor.id,abort.signal).then(data => { if (!abort.signal.aborted) setRows(data); }).catch(error => { if (!abort.signal.aborted) setError(error.message); });
    return () => abort.abort();
  }, [contributor.id]);
  const found = useMemo(() => rows.filter(w => `${w.title} ${w.source} ${languageCodes(w.language).join(" ")} ${languageLabel(w.language)}`.toLowerCase().includes(query.toLowerCase())), [rows, query]);
  return <div className="acq-works">
    <label>Find a work<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Title, source or language" /></label>
    <p className="acq-caption">{`${formatNumber(found.length)} text representations.`}{" "}{OVERLAP_NOTE}</p>
    {error && <p role="alert">{error}</p>}
    <WindowedRows as="ul" items={found} itemKey={workKey} estimate={70} dataVersion={`${contributor.id}|${query}|${rows.length}`} renderItem={(w, row) => <li key={w.id} data-row={row}>{onOpenWork ? <button type="button" onClick={e=>onOpenWork(w,e.currentTarget)}><strong>{w.title}</strong><span>{languageLabel(w.language)} · {sourceLabel(w.source)}</span><small>{w.localReadable ? "Read local copy" : w.availability === "on-site-text" ? "Read on this site" : "Catalogue only · no held reading copy"}</small></button> : <Link to={workUrl(w.id)}><strong>{w.title}</strong><span>{languageLabel(w.language)} · {sourceLabel(w.source)}</span><small>{w.localReadable ? "Read local copy" : w.availability === "on-site-text" ? "Read on this site" : "Catalogue only · no held reading copy"}</small></Link>}</li>} />
  </div>;
}

function ContributorCard({ contributor: c, row }: { contributor: AcquiredContributor; row: number }) {
  const [open, setOpen] = useState(false);
  return <details onToggle={e => setOpen(e.currentTarget.open)} data-row={row}><summary><strong>{c.name}</strong><span>{c.roles.join(", ")}{" · "}{plural(c.records, "{n} held", "{n} held")}{" · "}{plural(c.readable, "{n} readable here", "{n} readable here")}</span></summary><p className="acq-caption">{c.traditions.length ? `Recorded tradition: ${c.traditions.join(", ")}.` : "Faith and tradition not recorded."} {c.profileId ? "A documented profile is also in the main biographical catalogue." : "Biography not yet recorded."}</p>{c.sourceLifeDates?.length ? <p className="acq-caption">{`Source life-date labels: ${c.sourceLifeDates.join("; ")}. These are transcribed identity evidence, not a reviewed biography.`}</p> : null}{open && <ContributorWorks contributor={c} />}</details>;
}

export function AcquiredCatalogue({ side, authorId }: { side?: "preachers" | "scholars"; authorId?: string | null }) {
  const { box, data, error } = useAcquiredCatalogue();
  const [query, setQuery] = useState(""), [role, setRole] = useState("");
  const shelves = useMemo(() => data?.contributors.filter(c => (!side || c.side === side) && (!authorId || c.id === authorId)) ?? [], [data, side, authorId]);
  const contributors = useMemo(() => shelves.filter(c => (!role || c.roles.includes(role)) && `${c.name} ${c.traditions.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [shelves, role, query]);
  const contributorLabel = side === "preachers" ? "authors and assemblies" : "authors, editors and translators";
  const introduction = data
    ? `Explore the acquired texts of ${formatNumber(shelves.length)} ${contributorLabel}. Open a shelf to browse editions and read available texts here.`
    : "Open a contributor's shelf to browse acquired editions and read available texts here.";
  return <div ref={box} className="acq-catalogue">
    <SectionHead num={side === "preachers" ? "09" : "08"} kicker="Acquired library" title={<>The texts we hold, <em>by contributor</em></>} line={introduction} />
    <div className="acq-controls"><label>Find a contributor<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Name or recorded tradition" /></label><label>Role<select value={role} onChange={e => setRole(e.target.value)}><option value="">All roles</option><option value="author">Author</option><option value="editor">Editor</option><option value="translator">Translator</option></select></label></div>
    {error && <p role="alert">{error}</p>}
    {!data && !error && <p role="status">Loading acquired catalogue…</p>}
    {data && <p className="acq-caption">{query || role ? `${formatNumber(contributors.length)} of ${plural(shelves.length, "{n} contributor", "{n} contributors")} match · Updated ${formatDate(new Date(data.updatedAt))}.` : `Updated ${formatDate(new Date(data.updatedAt))}.`}</p>}
    {data && !contributors.length && <p>No contributors match these filters.</p>}
    <WindowedRows className="acq-contributors" items={contributors} itemKey={contributorKey} estimate={110} dataVersion={`${side}|${authorId}|${query}|${role}|${shelves.length}`} renderItem={(c, row) => <ContributorCard key={c.id} contributor={c} row={row} />} />
  </div>;
}
