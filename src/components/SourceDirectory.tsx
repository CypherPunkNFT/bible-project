import { ArrowDown, ArrowUpRight, BookOpen, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CorpusDashboard, AcquisitionLinks } from "./sources/CorpusDashboard";
import type { Directory } from "./sources/types";

const foundational = [
  ["eBible.org", "Scripture editions", "The source editions behind the reader, with their own language, book coverage and verse numbering.", "https://ebible.org/"],
  ["OpenBible.info", "Cross-references", "Reader-voted passage connections, seeded from the Treasury of Scripture Knowledge. A connection invites examination in context.", "https://www.openbible.info/labs/cross-references/"],
  ["OpenBible.info geocoding", "Biblical places", "Geographical identifications used in the atlas. Ancient locations can be uncertain or disputed.", "https://www.openbible.info/geo/"],
  ["STEP Bible · TIPNR", "People & proper names", "Named people, family relationships and Scripture references used in the people and prophets collections.", "https://github.com/STEPBible/STEPBible-Data/tree/master/Proper%20Nouns"],
  ["A. T. Robertson", "Gospel harmony · 1922", "The numbered events and references behind the harmony. An editorial ordering of the accounts, rather than a fifth Gospel.", "https://www.gutenberg.org/ebooks/36264"],
  ["R. A. Torrey", "The New Topical Text Book", "623 topics with their points and passage references in Topics, and the background to the study resources and the Names of God collection.", "https://ccel.org/ccel/torrey/ttt"],
  ["Orville J. Nave", "Nave’s Topical Bible", "Points and passage references for 4,461 topics of their own in Topics (people, places, customs and doctrines), and Nave’s notes beside Torrey’s on 270 more.", "https://ccel.org/ccel/nave/bible"],
  ["M. G. Easton", "Illustrated Bible Dictionary", "The short articles (“In brief”) on 2,671 topic pages, with their passage references, and reference facts elsewhere; electronic-edition rights distinguished from the original book.", "https://ccel.org/ccel/easton/ebd2"],
  ["OpenStreetMap contributors", "Atlas map", "Land, water, rivers and borders of the atlas, from OpenStreetMap data (ODbL) packaged by Protomaps; modern roads and towns are left out.", "https://www.openstreetmap.org/copyright"],
  ["NASA & Natural Earth", "Atlas preview imagery & outlines", "Blue Marble imagery and public-domain map outlines used in atlas previews.", "https://earthobservatory.nasa.gov/features/BlueMarble"],
];
const research = [
  ["Spurgeon’s published sermons", "spurgeon"], ["Reformation & Puritan preaching", "puritan-sermons"],
  ["Historic preaching", "historic-preaching"], ["Modern preaching", "modern-preaching"],
  ["Scripture coverage & gaps", "sermon-coverage"], ["Commentaries & biblical theology", "scripture-studies"],
  ["Doctrine & systematic theology", "doctrinal-studies"], ["Confessions & catechisms", "confessional-standards"],
  ["Christianity & Islam", "islam-studies"], ["Christian life & pastoral care", "pastoral-care"],
  ["Church, preaching & missions", "ministry-resources"], ["History, biographies & letters", "historical-lives"],
  ["Guided study paths", "study-paths"], ["Text availability & edition audit", "text-backlog"],
  ["Historical text corpora", "historical-text-corpora"], ["Text extraction & OCR decisions", "ocr-completion"],
  ["Ready-text completion", "ready-text-completion"], ["Acquisition gap batch", "text-gap-batch"],
];
const repo = "https://github.com/CypherPunkNFT/bible-project/blob/main/";
const PAGE_SIZE = 12;

export function SourceDirectory({ scriptureCount }: { scriptureCount: number }) {
  const [directory, setDirectory] = useState<Directory | null>(null);
  const [failed, setFailed] = useState(false);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [holdings, setHoldings] = useState("all");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/content/sources/directory.json", { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error("Source directory unavailable");
      return response.json() as Promise<Directory>;
    }).then(setDirectory).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (directory && window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
  }, [directory]);
  if (!directory) return <section className="py-12"><h1 className="font-serif text-4xl">Sources & references</h1><p className="mt-4 text-muted" role="status">{failed ? "The directory could not load. Reload to try again; the Scripture editions remain available below." : "Opening the source directory…"}</p></section>;
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const matches = directory.entries.filter(entry => (category === "all" || entry.categories.includes(category)) && (holdings === "all" || (holdings === "held" ? entry.held : !entry.held)) && terms.every(term => `${entry.title} ${entry.author} ${entry.kind} ${entry.links.map(link => (link.name || "") + " " + link.url).join(" ")}`.toLocaleLowerCase().includes(term)));
  const shown = matches.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const choose = (id: string) => { setCategory(id); setPage(0); };
  return <>
    <header className="relative border-b border-line pb-10 pt-12 sm:pb-14 sm:pt-16">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Sources & references</p>
      <div className="mt-5 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
        <div><h1 className="max-w-3xl font-serif text-5xl leading-[1.08] tracking-tight sm:text-6xl">Scripture at the centre.<br /><em className="font-normal text-accent">Sources in the open.</em></h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">Every translation has a history. Every commentary has an author. Every connection deserves a source. This is the reference desk behind Bible Project: the Scriptures we read, the voices we consult, and the evidence we return to.</p></div>
        <div className="border-l border-accent/40 pl-6"><BookOpen className="mb-4 h-7 w-7 text-accent" aria-hidden /><p className="font-serif text-xl leading-relaxed">Read the passage. Follow the reference. Weigh the interpretation.</p><p className="mt-3 text-sm leading-relaxed text-muted">Scripture is the foundation; sermons, histories and theological works are witnesses to how it has been understood. Listing a source identifies its contribution—it does not give every author or claim the same authority.</p></div>
      </div>
      <div className="mt-9 flex flex-wrap gap-x-8 gap-y-3 text-sm"><a href="#scriptures" className="hover:text-accent"><strong className="text-accent">{scriptureCount}</strong> scriptures <ArrowDown className="inline h-3 w-3" /></a><a href="#collections" className="hover:text-accent"><strong className="text-accent">8</strong> library collections</a><a href="#bibliography" className="hover:text-accent"><strong className="text-accent">{directory.entries.length.toLocaleString()}</strong> reference records</a><a href="#repositories" className="hover:text-accent">Libraries & ministries</a></div>
    </header>

    <nav aria-label="Source directory" className="my-7 flex flex-wrap gap-2 text-sm">
      {[["scriptures", "Scriptures"], ["collections", "Collections"], ["foundations", "Study & atlas"], ["bibliography", "Bibliography"], ["research", "Research guides"], ["repositories", "Libraries & ministries"]].map(([id, label]) => <a key={id} href={`#${id}`} className="rounded-full border border-line px-4 py-2 hover:border-accent hover:text-accent">{label}</a>)}
    </nav>

    <CorpusDashboard directory={directory} />

    <section id="foundations" className="scroll-mt-24 py-8"><h2 className="font-serif text-3xl">Behind the reader, study tables & atlas.</h2><div className="mt-6 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">{foundational.map(([name, kind, description, url]) => <article key={name} className="border-t border-line py-5"><p className="text-[11px] uppercase tracking-widest text-accent">{kind}</p><h3 className="mt-2 font-serif text-xl"><a href={url} className="hover:underline">{name} <ArrowUpRight className="inline h-3.5 w-3.5" aria-hidden /></a></h3><p className="mt-2 text-sm leading-relaxed text-muted">{description}</p></article>)}</div><p className="text-sm text-muted">The Gospel portraits, reading-chart groupings and approved Names of God selection also include original editorial work by this project. <a href={`${repo}SOURCES.md`} className="text-accent underline">Detailed credits, editions & source ledger</a></p></section>

    <section id="bibliography" className="scroll-mt-24 py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3"><h2 className="font-serif text-3xl">The bibliography.</h2><span className="text-sm text-muted">{matches.length.toLocaleString()} matching records</span></div>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">The complete reconciled work catalogue, verified acquisition records and published study citations. Search every author, title and acquisition source here, or browse authors within a collection above. Acquired means a source file was verified on disk at the snapshot date; catalogue-only records retain their reading links. Missing attribution is labelled explicitly.</p>
      <label className="mt-5 flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3"><Search className="h-4 w-4 shrink-0 text-muted" aria-hidden /><span className="sr-only">Search references</span><input value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} placeholder="Find an author, title, topic word or source…" className="min-w-0 flex-1 bg-transparent outline-none" /></label>
      <div role="group" aria-label="Reference collection" className="my-4 flex flex-wrap gap-2">{[{ id: "all", label: "All collections" }, ...directory.collections].map(c => <button key={c.id} type="button" aria-pressed={category === c.id} onClick={() => choose(c.id)} className={cn("rounded-full border px-3 py-1.5 text-xs", category === c.id ? "border-accent bg-accent text-page" : "border-line hover:bg-surface-2")}>{c.label}</button>)}</div>
      <div role="group" aria-label="Reference holdings" className="mb-4 flex flex-wrap gap-2">{[["all", "All records"], ["held", "Acquired files"], ["catalog", "Catalogue & citations"]].map(([id, label]) => <button key={id} type="button" aria-pressed={holdings === id} onClick={() => { setHoldings(id); setPage(0); }} className={cn("rounded-full border px-3 py-1.5 text-xs", holdings === id ? "border-accent text-accent" : "border-line text-muted")}>{label}</button>)}</div>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface"><div className="divide-y divide-line">{shown.map(entry => <article key={entry.id} className="px-5 py-4"><div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] uppercase tracking-wider text-muted"><span>{entry.kind}</span><span>· {entry.status}</span></div><h3 className="mt-1 break-words font-serif text-lg">{entry.title}</h3>{entry.author && <p className="mt-1 text-sm text-accent">{entry.author}</p>}<p className="mt-1 text-xs text-muted">{entry.role}</p><AcquisitionLinks entry={entry} /></article>)}</div>{!shown.length && <p className="p-8 text-muted">No references match. Try another word or select All collections.</p>}</div>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm" aria-live="polite"><button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="rounded-full border border-line px-4 py-2 disabled:opacity-30">Previous</button><span className="text-muted">{matches.length ? page * PAGE_SIZE + 1 : 0}–{Math.min((page + 1) * PAGE_SIZE, matches.length)} of {matches.length.toLocaleString()}</span><button disabled={(page + 1) * PAGE_SIZE >= matches.length} onClick={() => setPage(p => p + 1)} className="rounded-full border border-line px-4 py-2 disabled:opacity-30">Next</button></div>
    </section>

    <section id="research" className="scroll-mt-24 py-8"><h2 className="font-serif text-3xl">Follow the research.</h2><p className="mt-2 text-muted">Collection reports record the scope, editions, findings and remaining gaps behind each strand of research.</p><div className="mt-5 grid gap-x-8 sm:grid-cols-2">{research.map(([label, folder]) => <a key={folder} href={`${repo}content/library/reports/${folder}/REPORT.md`} className="flex items-center justify-between gap-4 border-b border-line py-4 text-sm hover:text-accent">{label}<ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden /></a>)}</div><a href={`${repo}content/library/BACKLOG.md`} className="mt-5 inline-block text-sm text-accent underline">Full collection scope & outstanding research</a></section>

    <section id="repositories" className="scroll-mt-24 py-8"><h2 className="font-serif text-3xl">Libraries, archives & ministries.</h2><p className="mt-2 text-muted">The institutions and source hosts in our research registry. Some supply editions; others help identify works or point to the original publisher.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{directory.sources.map(source => <a key={source.id} href={source.url} className="rounded-xl border border-line p-4 hover:bg-surface"><span className="font-serif text-lg">{source.name}</span><span className="mt-2 block text-xs capitalize text-muted">{source.role.replace(/-/g, " ")} <ArrowUpRight className="inline h-3 w-3" aria-hidden /></span></a>)}</div></section>

    <aside className="my-8 rounded-2xl border border-accent/30 bg-surface p-6"><h2 className="font-serif text-2xl">An open reference desk, an honest record.</h2><p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted">Historical texts, modern editions, translations and digital files can carry different permissions. A source link does not grant permission to republish its contents. Our library has a substantial Reformed and Protestant emphasis; comparative sources are identified by their role. Cataloguing, acquiring, reviewing and publishing are distinct steps. This directory joins the project’s work and edition catalogues, acquisition manifests, inventories and on-disk provenance. Work IDs, asset IDs and exact source URLs connect records; matching titles alone do not merge editions. Metadata and evidence files are distinguished from reading texts. Source dates and unresolved attribution stay visible.</p></aside>
  </>;
}
