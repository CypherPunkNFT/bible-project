import { ArrowRight, ArrowUpRight, BookOpen, ChevronLeft, ChevronRight, Library, Search } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { REFORMED_LIBRARY as library } from "@/generated/reading-library";
import { studyById } from "@/data/apologetics-library";
import type { ReadingWork } from "@/data/reading-library-types";
import { MeaningPrompt } from "@/components/search/MeaningPrompt";
import { ApHeading, ApSectionHeading } from "@/components/ApologeticsParts";
import { AP_BASE, studyUrl } from "@/lib/apologetics-links";
import "./reformed-library.css";

const eras: Record<string, string> = { reformation: "Reformation", "post-reformation": "Puritans & orthodoxy", "eighteenth-century": "18th century", "nineteenth-century": "19th century", "twentieth-century": "Early 20th century" };
const traditions: Record<string, string> = { reformed: "Reformed", "continental-reformed": "Continental Reformed", presbyterian: "Presbyterian", congregational: "Congregational", puritan: "Puritan", baptist: "Baptist", anglican: "Anglican", "calvinist-evangelical": "Calvinist evangelical" };
const language = (id: string) => id === "en" ? "English" : id === "la" ? "Latin" : id;
const authorsOf = (work: ReadingWork) => work.authorIds.map((id) => library.authors.find((author) => author.id === id)!);
const pageSize = 12;

export function ReformedDoor() {
  return <section className="rf-branch-door" aria-label="Read the Reformed tradition"><div><p className="ap-eyebrow">From the question to the source</p><h2>Read deeply. Trace the argument.</h2><p>{library.works.length} historic works by {library.authors.length} authors, connected to the questions below. Find an accessible first read or follow a doctrine into a substantial theological work.</p></div><div className="rf-branch-actions"><Link className="ap-button ap-button-solid" to={AP_BASE + "/paths/" + library.pathId}>Follow the Reformed learning path<ArrowRight size={16} /></Link><Link className="ap-button" to={AP_BASE + "/texts"}>Open the historic reading library<ArrowUpRight size={16} /></Link><Link className="ap-button" to={AP_BASE + "/texts?view=authors"}>Meet the theologians<ArrowRight size={16} /></Link></div></section>;
}

export function HistoricReading({ studyId }: { studyId: string }) {
  const works = library.works.filter((work) => work.studyIds.includes(studyId)).slice(0, 3);
  if (!works.length) return null;
  return <section className="rf-study-reading" aria-label="Historic reading for this question"><p className="ap-eyebrow">Take the question further</p><h2>Read a fuller argument.</h2><ul>{works.map((work) => <li key={work.id}><Link to={AP_BASE + "/texts?q=" + encodeURIComponent(work.title)}>{work.title}</Link><small>{authorsOf(work).map((author) => author.name).join("; ")}</small></li>)}</ul><Link to={AP_BASE + "/texts"}>Explore all historic texts <ArrowRight size={15} /></Link></section>;
}

function WorkCard({ work }: { work: ReadingWork }) {
  const authors = authorsOf(work);
  return <article className="rf-work" id={work.id}>
    <div className="rf-work-top"><span>{eras[work.era]}</span><span>{work.depth}</span></div>
    <div className="rf-work-title"><BookOpen size={24} strokeWidth={1} /><h2>{work.title}</h2></div>
    <div className="rf-byline">{authors.map((author) => <Link key={author.id} to={AP_BASE + "/texts?author=" + author.id}>{author.name}</Link>)}</div>
    <p>{work.summary}</p>
    <div className="rf-start"><span>Where to begin</span><p>{work.startingPoint}</p></div>
    <div className="rf-editions">{work.editions.map((edition) => <div key={edition.id}>
      <p>{edition.label}</p>
      <small>{edition.languages.map(language).join(" / ")}{edition.abridgment === "excerpt" ? " · Partial holding / excerpt" : edition.abridgment === "unknown" ? " · Extent not fully verified" : ""}</small>
      {edition.links.map((link) => <a key={link.id} href={link.url} target="_blank" rel="noreferrer">{link.mediaKind === "scan" ? "Open the historic scan" : "Read the text"}<ArrowUpRight size={14} /><span className="sr-only">: {work.title}, {edition.label}, at {link.host}</span></a>)}
    </div>)}</div>
    <details className="rf-details"><summary>Edition, tradition & reading notes</summary>
      <p>{authors.map((author) => author.traditions.map((id) => traditions[id] ?? id).join(" · ")).join("; ")}</p>
      {work.cautions.map((note) => <p key={note}>{note}</p>)}
      {work.editions.map((edition) => <div key={edition.id}><strong>{edition.label}</strong><p>{edition.textRights.status === "public-domain" ? "Public-domain historic text" : "Text rights require further verification"} · {edition.textRights.jurisdiction}. {edition.textRights.scope}</p><p>{edition.textRights.basis}</p><div className="rf-evidence-links">{edition.textRights.evidence.map((e, index) => <a key={index} href={e.url} target="_blank" rel="noreferrer">{index ? "Rights basis" : "Edition record"}<ArrowUpRight size={11} /></a>)}</div></div>)}
      <p>Host files and added material have separate terms. This catalogue provides reading links; it does not redistribute these books.</p>
    </details>
    <div className="rf-guide-links"><span>Explore the question</span>{work.studyIds.slice(0, 2).map((id) => <Link key={id} to={studyUrl(id)}>{studyById(id)!.title}<ArrowRight size={13} /></Link>)}</div>
  </article>;
}

export default function ReformedLibraryPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "", author = params.get("author") ?? "all", era = params.get("era") ?? "all", subject = params.get("subject") ?? "all", depth = params.get("depth") ?? "all", lang = params.get("language") ?? "all";
  const view = params.get("view") === "authors" ? "authors" : "texts";
  const selectedAuthor = library.authors.find((a) => a.id === author);
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const visible = library.works.filter((work) => {
    const creators = authorsOf(work), haystack = [work.title, work.summary, work.startingPoint, ...creators.flatMap((a) => [a.name, ...a.aliases]), ...work.subjects.map((id) => library.subjects.find((s) => s.id === id)?.label ?? id)].join(" ").toLocaleLowerCase();
    return (author === "all" || work.authorIds.includes(author)) && (era === "all" || work.era === era) && (subject === "all" || work.subjects.includes(subject)) && (depth === "all" || work.depth === depth) && (lang === "all" || work.editions.some((e) => e.languages.includes(lang))) && words.every((word) => haystack.includes(word));
  });
  const authorResults = library.authors.filter((author) => visible.some((work) => work.authorIds.includes(author.id)));
  const resultCount = view === "texts" ? visible.length : authorResults.length;
  const pages = Math.max(1, Math.ceil(resultCount / pageSize)), parsedPage = Number(params.get("page") ?? 1);
  const currentPage = Math.min(pages, Math.max(1, Number.isSafeInteger(parsedPage) ? parsedPage : 1));
  const offset = (currentPage - 1) * pageSize;
  const change = (key: string, value: string) => { const next = new URLSearchParams(params); next.delete("page"); if (value && value !== "all") next.set(key, value); else next.delete(key); setParams(next, { replace: true }); };
  const move = (page: number) => { const next = new URLSearchParams(params); next.set("page", String(page)); setParams(next); document.getElementById("rf-results")?.scrollIntoView({ behavior: "instant", block: "start" }); };
  const hasFilters = !!query || [author, era, subject, depth, lang].some((v) => v !== "all");
  return <>
    <ApHeading eyebrow="Historic texts / Reformed theology" title={library.title} lead={library.description}>
      <div className="rf-library-intro"><p><strong>{library.works.length}</strong> works <span>·</span> <strong>{library.authors.length}</strong> authors <span>·</span> Five centuries of theology</p><Link to={AP_BASE + "/topics/reformed"}>Explore the Reformed theology branch <ArrowRight size={15} /></Link></div>
    </ApHeading>
    <details className="rf-scope"><summary>A reading tradition, with sources you can inspect</summary><p>{library.scopeNote}</p><p>{library.rightsNote}</p><div className="rf-evidence-links">{library.rightsSources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.locator}<ArrowUpRight size={12} /></a>)}</div></details>
    {!hasFilters && view === "texts" && <section className="rf-first-reads" aria-label="Three doors into the library"><ApSectionHeading eyebrow="Three doors into the library" title="Grace. Doctrine. A reasoned faith." /><div>{library.featuredWorkIds.map((id, index) => { const work = library.works.find((w) => w.id === id)!; return <Link key={id} to={AP_BASE + "/texts?q=" + encodeURIComponent(work.title)}><span>0{index + 1}</span><small>{authorsOf(work)[0].name}</small><h2>{work.title}</h2><p>{work.summary}</p><strong>Find the text <ArrowRight size={15} /></strong></Link>; })}</div></section>}
    <section className="rf-catalogue" aria-label="Browse the historic reading library">
      <div className="rf-catalogue-heading"><h2>Follow an author. Explore an idea.</h2><div className="ap-filter-chips" role="group" aria-label="Browse view"><button type="button" aria-pressed={view === "texts"} onClick={() => change("view", "texts")}><BookOpen size={15} />Texts</button><button type="button" aria-pressed={view === "authors"} onClick={() => change("view", "authors")}><Library size={15} />Authors</button></div></div>
      <label className="ap-search rf-search"><Search size={19} /><span className="sr-only">Search historic texts and authors</span><input type="search" value={query} placeholder="Search Calvin, assurance, covenant, justification…" onChange={(e) => change("q", e.target.value)} /></label>
      <MeaningPrompt query={query} className="ap-meaning-prompt" />
      <div className="rf-filters">
        <label>Author<select value={author} onChange={(e) => change("author", e.target.value)}><option value="all">Every author</option>{library.authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
        <label>Period<select value={era} onChange={(e) => change("era", e.target.value)}><option value="all">Every period</option>{Object.entries(eras).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <label>Subject<select value={subject} onChange={(e) => change("subject", e.target.value)}><option value="all">Every subject</option>{library.subjects.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
        <label>Reading level<select value={depth} onChange={(e) => change("depth", e.target.value)}><option value="all">Every level</option>{["introductory", "intermediate", "advanced"].map((id) => <option key={id} value={id}>{id[0].toUpperCase() + id.slice(1)}</option>)}</select></label>
        <label>Language<select value={lang} onChange={(e) => change("language", e.target.value)}><option value="all">Every language</option><option value="en">English</option><option value="la">Latin</option></select></label>
      </div>
      {selectedAuthor && <div className="rf-author-focus"><div><p className="ap-eyebrow">On the author’s shelf</p><h2>{selectedAuthor.name}</h2><p>{selectedAuthor.traditions.map((id) => traditions[id] ?? id).join(" · ")}</p></div><a href={selectedAuthor.evidenceUrl} target="_blank" rel="noreferrer">Author and tradition source <ArrowUpRight size={14} /></a></div>}
      <div className="rf-result-status" id="rf-results"><p role="status">{resultCount} {view === "texts" ? resultCount === 1 ? "work" : "works" : resultCount === 1 ? "author" : "authors"}{resultCount > pageSize ? ` · Showing ${offset + 1}–${Math.min(offset + pageSize, resultCount)}` : ""}</p>{hasFilters && <button type="button" onClick={() => setParams(view === "authors" ? { view: "authors" } : {})}>Clear all filters</button>}</div>
      {resultCount === 0 ? <div className="ap-empty"><Search size={26} /><h2>No texts match those filters.</h2><p>Try another author or a broader subject.</p><button type="button" className="ap-button" onClick={() => setParams({})}>Reset the library</button></div> : view === "texts" ? <div className="rf-work-grid">{visible.slice(offset, offset + pageSize).map((work) => <WorkCard key={work.id} work={work} />)}</div> : <div className="rf-author-grid">{authorResults.slice(offset, offset + pageSize).map((author) => { const works = visible.filter((work) => work.authorIds.includes(author.id)); return <article key={author.id}><span className="rf-author-initial" aria-hidden="true">{author.name.split(" ").at(-1)![0]}</span><h2>{author.name}</h2><p>{author.traditions.map((id) => traditions[id] ?? id).join(" · ")}</p><p>{works.slice(0, 2).map((w) => w.title).join(" / ")}</p><Link to={AP_BASE + "/texts?author=" + author.id}>Explore {works.length} {works.length === 1 ? "work" : "works"}<ArrowRight size={15} /></Link></article>; })}</div>}
      {pages > 1 && <nav className="rf-pagination" aria-label="Reading library pages"><button type="button" disabled={currentPage === 1} onClick={() => move(currentPage - 1)}><ChevronLeft size={16} />Previous</button><span>Page {currentPage} of {pages}</span><button type="button" disabled={currentPage === pages} onClick={() => move(currentPage + 1)}>Next<ChevronRight size={16} /></button></nav>}
    </section>
    <div className="ap-document-downloads"><span>Take the reading catalogue with you</span><a href="/content/apologetics/reformed-reading.md" download>Reading list · Markdown <ArrowUpRight size={13} /></a><a href="/content/apologetics/reformed-reading.json" download>Structured records · JSON <ArrowUpRight size={13} /></a></div>
    <p className="ap-local-note">{library.rightsNote}</p>
  </>;
}
