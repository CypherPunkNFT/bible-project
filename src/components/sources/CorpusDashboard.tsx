import { ArrowUpRight, ChevronDown, Search } from "lucide-react";
import { useState } from "react";
import type { Directory, SourceEntry } from "./types";

const date = (value: string) => new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
const colors = ["#69c7bb", "#d69c79", "#a99bd6", "#d48faf", "#96b784", "#d7b569", "#83aed5", "#cf9191", "#9badaf"];

export function AcquisitionLinks({ entry }: { entry: SourceEntry }) {
  return <div className="mt-3 space-y-2">{entry.links.length ? entry.links.map(link => <div key={link.url} className="text-xs leading-relaxed text-muted">
    <span>{link.held ? "Acquired from " : "Listed at "}</span><a href={link.url} target="_blank" rel="noopener noreferrer" className="break-words text-accent underline underline-offset-4">{link.name || new URL(link.url).hostname.replace(/^www\./, "")} <ArrowUpRight className="inline h-3 w-3" aria-hidden /><span className="sr-only"> — {entry.title}</span></a>
    {link.format && <span> · {link.format}</span>}{link.acquired && <span> · {link.acquired}</span>}
    {link.edition && <span className="mt-1 block">{link.edition}</span>}
  </div>) : <p className="text-xs text-muted">Acquisition source not recorded.</p>}</div>;
}

function Author({ name, entries }: { name: string; entries: SourceEntry[] }) {
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(20);
  return <details onToggle={e => setOpen(e.currentTarget.open)} className="border-t border-line">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4"><span className="font-serif text-lg">{name}</span><span className="shrink-0 text-xs text-muted">{entries.length.toLocaleString()} records <ChevronDown className="ml-2 inline h-3 w-3" aria-hidden /></span></summary>
    {open && <div className="pb-4 pl-3 sm:pl-5"><div className="divide-y divide-line">{entries.slice(0, limit).map(entry => <article key={entry.id} className="py-4"><p className="text-[10px] uppercase tracking-wider text-muted">{entry.kind} · {entry.status}</p><h4 className="mt-1 break-words font-serif text-lg">{entry.title}</h4><AcquisitionLinks entry={entry} /></article>)}</div>{entries.length > limit && <button type="button" onClick={() => setLimit(n => n + 20)} className="mt-3 rounded-full border border-line px-4 py-2 text-xs text-accent">Show more works ({entries.length - limit} remaining)</button>}</div>}
  </details>;
}

function Collection({ collection, entries, index }: { collection: Directory["collections"][number]; entries: SourceEntry[]; index: number }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [limit, setLimit] = useState(25);
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const matching = open ? entries.filter(e => (status === "all" || (status === "held" ? e.held : !e.held)) && terms.every(t => `${e.author} ${e.title} ${e.links.map(l => l.name + " " + l.url).join(" ")}`.toLocaleLowerCase().includes(t))) : [];
  const groups = new Map<string, SourceEntry[]>();
  for (const entry of matching) { const name = entry.author || "Author not recorded"; if (!groups.has(name)) groups.set(name, []); groups.get(name)!.push(entry); }
  const authors = [...groups].sort((a, b) => a[0].localeCompare(b[0]));
  return <details onToggle={e => setOpen(e.currentTarget.open)} className="overflow-hidden rounded-2xl border border-line bg-surface" style={{ borderTop: `2px solid ${colors[index]}` }}>
    <summary className="cursor-pointer list-none p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.2em] text-muted">{index < 8 ? `Collection ${String(index + 1).padStart(2, "0")}` : "Reconciliation queue"}</p><h3 className="mt-2 font-serif text-2xl">{collection.label}</h3></div><ChevronDown className="mt-2 h-4 w-4 shrink-0 text-accent" aria-hidden /></div><p className="mt-2 text-sm leading-relaxed text-muted">{collection.definition}</p><p className="mt-4 text-xs text-accent">Browse {new Set(entries.map(e => e.author)).size.toLocaleString()} author groups · {entries.length.toLocaleString()} records</p></summary>
    {open && <div className="border-t border-line px-5 pb-5 sm:px-6"><div className="my-5 flex flex-wrap gap-3"><label className="flex min-w-0 flex-[2_1_220px] items-center gap-2 rounded-lg border border-line px-3 py-2"><Search className="h-4 w-4 shrink-0 text-muted" aria-hidden /><span className="sr-only">Search {collection.label}</span><input value={query} onChange={e => { setQuery(e.target.value); setLimit(25); }} placeholder="Author, title or acquisition source…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label><label className="min-w-0 flex-[1_1_130px]"><span className="sr-only">Holdings in {collection.label}</span><select value={status} onChange={e => { setStatus(e.target.value); setLimit(25); }} className="w-full rounded-lg border border-line bg-page px-3 py-2 text-sm"><option value="all">All records</option><option value="held">Acquired files</option><option value="catalog">Catalogue & citations</option></select></label></div>
      <p role="status" className="mb-3 text-xs text-muted">{matching.length.toLocaleString()} records · {authors.length.toLocaleString()} author groups{!matching.length && " — try another search or filter."}</p>
      {authors.slice(0, limit).map(([name, works]) => <Author key={`${name}-${query}-${status}`} name={name} entries={works} />)}
      {authors.length > limit && <button type="button" onClick={() => setLimit(n => n + 25)} className="mt-4 rounded-full border border-line px-4 py-2 text-xs text-accent">Show more authors ({authors.length - limit} remaining)</button>}
    </div>}
  </details>;
}

export function CorpusDashboard({ directory }: { directory: Directory }) {
  const c = directory.corpus;
  const progress = c.embedding.total ? 100 * c.embedding.indexed / c.embedding.total : 0;
  const [allSources, setAllSources] = useState(false);
  const sources = [...c.sources].sort((a, b) => b.bytes - a.bytes);
  const intake = directory.intakeSnapshot;
  const stats = [[c.files.toLocaleString(), "Held library files", "Includes text, metadata and supporting files"], [(c.bytes / 1e9).toFixed(2) + " GB", "Library storage", "Separate from Scripture and search storage"], [c.coverage.counts.chunks.toLocaleString(), "Searchable passages", "Extracted text split into searchable passages"],
    ...(intake ? [[intake.textReady.toLocaleString(), "Text extracted & searchable", "Text-bearing files represented in the published corpus"], [intake.pendingText.toLocaleString(), "Text candidates awaiting intake", "Later files awaiting extraction and corpus incorporation"], [intake.supportFiles.toLocaleString(), "Metadata & supporting files", "Recorded separately from reading texts"]] : [[c.verifiedFiles.toLocaleString(), "Acquired files verified", "Files matched to bibliography evidence"]])];
  return <section id="collections" className="scroll-mt-24 py-8">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">The corpus · collection dashboard</p><h2 className="mt-3 font-serif text-4xl">The library behind the reading.</h2><p className="mt-3 max-w-3xl leading-relaxed text-muted">Follow a collection into its authors and works, then back to the source from which each file was acquired. Books, sermons, chapters and reference witnesses retain their own identities.</p>
    <p className="mt-5 border-b border-line pb-4 text-xs leading-relaxed text-muted">Holdings measured {date(c.measured_at)} · Bibliography reconciled {date(c.bibliographyUpdatedAt)} · Dated snapshots, not live counters.</p>
    <div className="my-7 grid overflow-hidden rounded-2xl border border-line bg-surface sm:grid-cols-2 xl:grid-cols-3">{stats.map(([value, label, note]) => <div key={label} className="border-b border-line p-5 last:border-b-0 sm:border-r"><p className="text-xs text-muted">{label}</p><p className="my-3 font-serif text-3xl text-accent">{value}</p><p className="text-xs leading-relaxed text-muted">{note}</p></div>)}</div>
    {intake && <p className="mb-7 text-xs leading-relaxed text-muted">Held, extracted and embedded describe different stages. File counts include sermons and articles as well as books. {intake.duplicates.toLocaleString()} duplicate representations reuse existing text; {intake.textGaps} recorded text gaps remain. The bibliography below covers its dated catalogue snapshot.</p>}
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]"><div className="min-w-0 space-y-4">{directory.collections.map((collection, index) => <Collection key={collection.id} collection={collection} index={index} entries={directory.entries.filter(e => e.categories.includes(collection.id))} />)}</div>
      <aside className="min-w-0 space-y-5" aria-label="Corpus measurements">
        <div className="rounded-2xl border border-line bg-surface p-5"><p className="text-[10px] uppercase tracking-widest text-accent">Semantic search</p><h3 className="mt-2 font-serif text-xl">Embedding coverage</h3><p className="my-4 font-serif text-4xl">{progress.toFixed(1)}<span className="text-xl text-muted">%</span></p><div role="progressbar" aria-label="Embedded passages" aria-valuenow={c.embedding.indexed} aria-valuemin={0} aria-valuemax={c.embedding.total} className="h-2 w-full overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div><p className="mt-3 text-xs text-muted">{c.embedding.indexed.toLocaleString()} / {c.embedding.total.toLocaleString()} passages</p><p className="mt-3 text-xs leading-relaxed text-muted">Worker reported {c.embedding.state} at {date(c.embedding.updated_at)}. Later acquisitions require another import and verification.</p></div>
        <div className="rounded-2xl border border-line p-5"><h3 className="font-serif text-xl">Source holdings</h3><p className="mt-2 text-xs leading-relaxed text-muted">Share of library bytes, including metadata. These bars show volume, not completion.</p><div className="mt-4 space-y-5">{sources.slice(0, allSources ? undefined : 5).map(source => <div key={source.name}><div className="flex justify-between gap-3 text-xs"><span className="capitalize">{source.name}</span><span className="shrink-0 text-muted">{(source.bytes / 1e6).toFixed(1)} MB</span></div><div className="mt-2 h-1 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-accent" style={{ width: `${100 * source.bytes / c.bytes}%` }} /></div><p className="mt-1 text-[10px] text-muted">{source.files.toLocaleString()} files · {(100 * source.bytes / c.bytes).toFixed(1)}%</p></div>)}</div><button type="button" onClick={() => setAllSources(v => !v)} className="mt-5 text-xs text-accent underline">{allSources ? "Show fewer sources" : `View all ${sources.length} source folders`}</button></div>
        <details className="rounded-2xl border border-line p-5"><summary className="cursor-pointer font-serif text-xl">Formats & search coverage</summary><div className="mt-4 divide-y divide-line">{Object.entries(c.formats).sort((a, b) => b[1] - a[1]).map(([format, count]) => <p key={format} className="flex justify-between py-2 text-xs"><span>{format.replace(/^\./, "").toUpperCase()}</span><span className="text-muted">{count.toLocaleString()}</span></p>)}</div><p className="mt-4 text-xs leading-relaxed text-muted">{c.coverage.counts.documents.toLocaleString()} indexed documents; {c.coverage.counts.verses.toLocaleString()} retained verse records; {c.coverage.editions} editions in {c.coverage.languages} languages. Search snapshot built {date(c.coverage.built_at)}.</p></details>
        <div className="rounded-2xl border border-accent/30 p-5"><h3 className="font-serif text-xl">An honest catalogue</h3><p className="mt-3 text-xs leading-relaxed text-muted">A record may describe a whole book, an edition, a sermon or a component. Formats are kept with their source. A catalogue link is not proof of a downloaded text.</p><p className="mt-3 text-xs leading-relaxed text-muted">{c.incompleteIdentity.toLocaleString()} acquired records still have incomplete title or author attribution. They remain visible, along with material awaiting collection assignment.</p><a href="#research" className="mt-4 inline-block text-xs text-accent underline">Read the collection reports</a></div>
      </aside></div>
  </section>;
}
