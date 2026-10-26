import { ArrowUpRight, Search } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SourceCatalogue } from "./sources/SourceCatalogue";
import { SourceProviders } from "./sources/SourceProviders";
import { useSourceDirectory } from "./sources/useSourceDirectory";

import { LibraryOverview, snapshotDate } from './sources/LibraryOverview';
import { matchesCatalogue, titleMatchRank, sourceView, sourceViews, type ExtraFacet, type ReviewFilter } from './sources/dashboard-model';
import './sources/dashboard.css';
import './sources/source-boards.css';
import { SourceCollections } from './sources/SourceCollections';
import { SourceReview } from './sources/SourceReview';

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
// Downloaded 2026-10-07 and listed in SOURCES.md ("Reference library"); each use is planned in REFERENCE_LIBRARY.md.
// [name, kind, planned use, licence, publisher link]
const referenceLibrary = [
  ["James Orr (ed.)", "International Standard Bible Encyclopedia · 1915", "About 9,000 scholarly articles: the in-depth article planned for person, place and topic pages.", "Public domain · CrossWire edition", "https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=ISBE"],
  ["Robert Rouse", "Theographic Bible Metadata", "People, places, events, periods and dates linked to verses: dates and events for person pages and a timeline.", "CC BY-SA 4.0 · credit and share alike", "https://github.com/robertrouse/theographic-bible-metadata"],
  ["Roswell D. Hitchcock", "Bible Names Dictionary · 1869", "The meanings of about 2,500 Bible names, for person and place pages.", "Public domain · CCEL edition", "https://ccel.org/ccel/hitchcock/bible_names"],
  ["OpenBible.info", "Topical Bible", "Modern topics with verses ranked by reader votes, beside Torrey's and Nave's headings. Verse references only.", "CC BY · credit OpenBible.info", "https://www.openbible.info/topics/"],
  ["William Smith", "Smith's Bible Dictionary · 1863/1884", "A second classic dictionary voice on person, place and topic pages.", "Public domain · CCEL edition", "https://ccel.org/ccel/smith_w/bibledict"],
  ["A. R. Fausset", "Bible Encyclopaedia and Dictionary · 1900", "A third classic dictionary voice, once its scanned text is cleaned.", "Public domain · Internet Archive scan", "https://archive.org/details/bibleencyclopedi0000arfa_c4x1"],
  ["James Strong", "Hebrew & Greek dictionaries", "Word studies keyed to the Strong's numbers in the King James text.", "Public domain · Open Scriptures edition", "https://github.com/openscriptures/strongs"],
  ["Brown, Driver & Briggs", "Hebrew and English Lexicon · 1906", "Hebrew word studies, keyed to Strong's numbers.", "Text public domain · edition CC BY 4.0, Open Scriptures", "https://github.com/openscriptures/HebrewLexicon"],
  ["Joseph Henry Thayer", "Greek-English Lexicon of the New Testament · 1889", "Greek word studies, once its scanned text is cleaned.", "Public domain · Internet Archive scan", "https://archive.org/details/thayer-lexicon"],
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

export function SourceDirectory({ scriptureCount, children }: { scriptureCount: number; children: ReactNode }) {
  const { directory, entries, failed, marker, want, facetState } = useSourceDirectory();
  // ?collection=<id>#bibliography opens the catalogue on one collection (the homepage links each collection this way).
  const [category, setCategory] = useState(() => new URLSearchParams(window.location.search).get("collection") ?? "all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [holdings, setHoldings] = useState("all");
  const location = useLocation();
  const navigate = useNavigate();
  const view = sourceView(location.hash);
  const [facets, setFacets] = useState<Partial<Record<ExtraFacet, string[]>>>({});
  const [review, setReview] = useState<ReviewFilter>('all');
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(window.location.hostname);
  useEffect(() => { if (view === 'bibliography' || view === 'quality' || view === 'collections') want(); }, [view, want]);
  const openCatalogue = (id = 'all', flag: ReviewFilter = 'all') => {
    setFacets({}); setCategory(id); setReview(flag); setHoldings(flag === 'identity' ? 'held' : 'all'); setQuery(''); setPage(0); navigate('#bibliography');
  };
  if (!directory) return <><section className="py-12"><h1 className="font-serif text-4xl">Sources & references</h1><p className="mt-4 text-muted" role="status">{failed === "summary" ? "The directory could not load. Reload to try again; the Scripture editions remain available below." : "Opening the source directory…"}</p></section>{children}</>;
  const filters = { category, holdings, review, query, facets };
  const matches = (entries ?? []).filter(entry => matchesCatalogue(entry, filters));
  if (query.trim()) matches.sort((a, b) => titleMatchRank(b, query) - titleMatchRank(a, query));
  return <div className="source-dashboard">
    <header className="source-header"><div><p className="source-eyebrow">Sources & library</p><h1>Library dashboard</h1><p>Find a source. Understand its place. See what still needs checking.</p></div><span className="source-snapshot-badge">Catalogue snapshot · {snapshotDate(directory.corpus.bibliographyUpdatedAt)}</span></header>
    <nav className="source-nav" aria-label="Library dashboard">{sourceViews.map(([id,label])=><Link key={id} to={'#'+id} aria-current={view===id?'page':undefined}>{label}</Link>)}</nav>
    {!['bibliography','collections','repositories','quality'].includes(view) && <form className="source-global-search" onSubmit={e=>{e.preventDefault(); setFacets({});setCategory('all');setHoldings('all');setReview('all');setPage(0);want();navigate('#bibliography');}}><Search size={20} aria-hidden/><label className="sr-only" htmlFor="source-search">Search the library catalogue</label><input id="source-search" value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}} placeholder="Search title, author or source…"/><button type="submit">Search catalogue <ArrowUpRight size={15}/></button></form>}
    <div className="source-workspace" key={view}>
    {view === 'overview' && <LibraryOverview directory={directory} entries={entries} scriptureCount={scriptureCount} openCatalogue={openCatalogue}/>}
    {view === 'collections' && <SourceCollections directory={directory} entries={entries} failed={!!failed} openCatalogue={openCatalogue}/>}
    {view === 'scriptures' && children}
    {view === 'quality' && <SourceReview directory={directory} entries={entries} openCatalogue={openCatalogue} reports={research} repo={repo} showReports={location.hash === '#research'}/>}
    {view === 'foundations' && <>
    <section id="foundations" className="scroll-mt-24 py-8"><h2 className="font-serif text-3xl">Behind the reader, study tables & atlas.</h2><div className="mt-6 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">{foundational.map(([name, kind, description, url]) => <article key={name} className="border-t border-line py-5"><p className="text-[11px] uppercase tracking-widest text-accent">{kind}</p><h3 className="mt-2 font-serif text-xl"><a href={url} className="hover:underline">{name} <ArrowUpRight className="inline h-3.5 w-3.5" aria-hidden /></a></h3><p className="mt-2 text-sm leading-relaxed text-muted">{description}</p></article>)}</div><p className="text-sm text-muted">The Gospel portraits, reading-chart groupings and approved Names of God selection also include original editorial work by this project. <a href={`${repo}SOURCES.md`} className="text-accent underline">Detailed credits, editions & source ledger</a></p></section>

    <section id="reference-library" className="scroll-mt-24 py-8"><h2 className="font-serif text-3xl">The reference library.</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">Respected reference works gathered for the person, place, topic and word pages to come. Each is held as downloaded, with its licence and checksum in the source ledger, and will be credited on every page that uses it.</p><div className="mt-6 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">{referenceLibrary.map(([name, kind, use, licence, url]) => <article key={kind} className="border-t border-line py-5"><p className="text-[11px] uppercase tracking-widest text-accent">{kind}</p><h3 className="mt-2 font-serif text-xl"><a href={url} className="hover:underline">{name} <ArrowUpRight className="inline h-3.5 w-3.5" aria-hidden /></a></h3><p className="mt-2 text-sm leading-relaxed text-muted">{use}</p><p className="mt-2 text-xs text-muted">{licence}</p></article>)}</div><p className="text-sm text-muted">Planned, not yet shown on the site. <a href={`${repo}SOURCES.md`} className="text-accent underline">Source ledger: editions, licences & checksums</a></p></section>

    </>}
    {view === 'bibliography' && <div ref={marker}><SourceCatalogue directory={directory} entries={entries} matches={matches} failed={failed === 'records'} facetState={facetState} filters={filters} page={page} onPage={setPage} onFilters={next => { setFacets(next.facets ?? {}); setCategory(next.category); setHoldings(next.holdings); setReview(next.review); setQuery(next.query); setPage(0); }}/></div>}
    {view === 'repositories' && <SourceProviders directory={directory} />}

    {view === 'foundations' && <aside className="my-8 rounded-2xl border border-accent/30 bg-surface p-6"><h2 className="font-serif text-2xl">An open reference desk, an honest record.</h2><p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted">Historical texts, modern editions, translations and digital files can carry different permissions. A source link does not grant permission to republish its contents. Our library has a substantial Reformed and Protestant emphasis; comparative sources are identified by their role. Cataloguing, acquiring, reviewing and publishing are distinct steps. This directory joins the project’s work and edition catalogues, acquisition manifests, inventories and on-disk provenance. Work IDs, asset IDs and exact source URLs connect records; matching titles alone do not merge editions. Metadata and evidence files are distinguished from reading texts. Source dates and unresolved attribution stay visible.</p></aside>}
    </div>
    {local && <aside className="source-local-tools"><div><strong>Local library workspace</strong><p>Open the existing tools to inspect holdings and evidence. Decisions stay in their original ledgers.</p></div><nav aria-label="Local library tools"><a href="/data/">Data hub ↗</a><a href="/data_intake/">Holdings & intake ↗</a><a href="/data_analysis/">Analysis desks ↗</a><a href="/data_analysis/candidates/">Candidate review ↗</a></nav></aside>}
  </div>;
}
