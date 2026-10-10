import { readingSourceUrl } from "@/lib/reading-sources";
import "../teachers/shared/acquired.css";
import { ArrowRight, ArrowUpRight, Search } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import NotFoundPage from "@/pages/NotFoundPage";
import { filterSources, researchUrl, sourceUses, type ResearchBundle } from "./model";
import { CitationInspector, RelatedLinks, ResearchArt, ResearchHero, SourceTile, WitnessComparison } from "./ResearchParts";

export function ResearchIndex({ data, view = "all" }: { data: ResearchBundle; view?: "all" | "cases" | "study" }) {
  const cards = [
    ...data.cases.map(c => ({ to: "cases/" + c.id, title: c.title, lead: c.question, kind: c.kind, eyebrow: c.eyebrow })),
    ...data.lessons.map(c => ({ to: "study/" + c.id, title: c.title, lead: c.passage.reference, kind: "study" as const, eyebrow: c.eyebrow })),
  ].filter(c => view === "all" || (view === "study" ? c.kind === "study" : c.kind !== "study"));
  return <>
    <ResearchHero eyebrow={view === "study" ? "Studies · Read in context" : view === "cases" ? "Apologetics · Follow the evidence" : "Scholars · Apologetics · Studies"}
      title={view === "study" ? "Scripture before us." : view === "cases" ? "Questions worth examining." : "Go to the source."}
      lead={view === "study" ? "Begin with the passage. Follow its meaning in context. Consider how it shapes belief and life." : view === "cases" ? "Name the claim, inspect its source and leave its limits in view." : "Meet the people and works behind the evidence. Examine a historical question. Return to Scripture with the context in view."} />
    <section className="rs-paths" aria-label="Readings"><div className="rs-card-grid">{cards.map((card,i) => <Link className={"rs-reading-card rs-" + card.kind} key={card.to} to={researchUrl(card.to)}><div className="rs-card-top"><span>{String(i+1).padStart(2,"0")} / {card.kind === "study" ? "STUDY" : "CASE"}</span><ArrowUpRight size={18} aria-hidden /></div><ResearchArt kind={card.kind} /><div className="rs-card-copy"><small>{card.eyebrow}</small><h2>{card.title}</h2><p>{card.lead}</p><span>Start reading <ArrowRight size={16} aria-hidden /></span></div></Link>)}</div></section>
    <section className="rs-shelf"><div className="rs-section-title"><div><p className="rs-eyebrow">Scholars · Works & editions</p><h2>Know what you are reading.</h2></div><Link to={researchUrl("works")}>Browse the sources <ArrowRight size={16} aria-hidden /></Link></div><div className="rs-source-grid">{data.sources.map(s => <SourceTile key={s.id} source={s} />)}</div></section>
    <div className="rs-three-doors"><div><span>01</span><h3>Identify</h3><p>A named work, edition and contributor.</p></div><div><span>02</span><h3>Examine</h3><p>An exact source, a stated claim and its limits.</p></div><div><span>03</span><h3>Understand</h3><p>Scripture, interpretation and a thoughtful response.</p></div></div>
  </>;
}

export function WorksCatalogue({ data }: { data: ResearchBundle }) {
  const [query, setQuery] = useState("");
  const shown = filterSources(data.sources, query, data.contributors);
  return <><ResearchHero eyebrow="Scholars · Named editions" title="Behind the reading." lead="Find the work, identify the edition and see exactly where it is used in the site’s cases and studies." />
    <div className="rs-filter"><label><Search size={19} aria-hidden /><span className="sr-only">Search works and editions</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Find an author, witness, place or edition…" /></label><p role="status">{shown.length} of {data.sources.length} editions</p></div>
    {shown.length ? <div className="rs-source-grid">{shown.map(s => <SourceTile key={s.id} source={s} />)}</div> : <p className="rs-empty">No edition matches “{query}”. Try Jerusalem, Greek or Mark.</p>}
    <section className="rs-shelf"><div className="rs-section-title"><div><p className="rs-eyebrow">People & institutions</p><h2>The work behind the source.</h2></div></div><div className="rs-contributors">{data.contributors.map(c => <Link to={researchUrl("contributors/" + c.id)} key={c.id}><small>{c.kind === "institution" ? "Editorial project" : "Modern scholarship"}</small><h3>{c.name}</h3><p>{c.role}</p><ArrowUpRight size={17} aria-hidden /></Link>)}</div></section>
  </>;
}

export function WorkPage({ data, evidence = false }: { data: ResearchBundle; evidence?: boolean }) {
  const { id } = useParams();
  const source = data.sources.find(s => s.id === id);
  if (!source) return <NotFoundPage />;
  return <div className={"rs-source-page rs-" + (source.id === "sinaiticus-mark" ? "manuscript" : "historical")}>
    <ResearchHero eyebrow={evidence ? "Apologetics · Evidence record" : "Scholars · Work & edition"} title={source.title} lead={source.subtitle} />
    <div className="rs-source-layout"><aside className="rs-source-facts"><p className="rs-eyebrow">At a glance</p><dl><dt>Source type</dt><dd>{source.genre}</dd><dt>Ancient setting</dt><dd>{source.period}</dd><dt>Language</dt><dd>{source.language}</dd><dt>Named edition</dt><dd>{source.edition}</dd><dt>Access</dt><dd>Reading availability recorded on this site</dd></dl><Link className="rs-button" to={readingSourceUrl("research-" + source.id)}>Reading copy and availability <ArrowRight size={17} aria-hidden /></Link></aside>
    <article>
      <section className="rs-reading-section"><p className="rs-eyebrow">{evidence ? "What we can observe" : "About this work"}</p><h2>{evidence ? "A source with a particular scope." : "Read the edition in context."}</h2><p>{source.description}</p></section>
      {evidence && source.id === "sinaiticus-mark" && <WitnessComparison />}
      <section className="rs-location"><p className="rs-eyebrow">Exact location</p><h2>{source.locator}</h2>{source.citation.quote && <blockquote>“{source.citation.quote}”</blockquote>}<CitationInspector source={source} /></section>
      <section className="rs-reading-section"><h2>{evidence ? "What it does not settle" : "Use & interpretation"}</h2><ul>{source.limitations.map(limit => <li key={limit}>{limit}</li>)}</ul></section>
      <section className="rs-reading-section"><p className="rs-eyebrow">Attribution</p><h2>Who made this edition available?</h2><div className="rs-contributors">{source.contributors.map(id => { const c = data.contributors.find(c => c.id === id)!; return <Link key={id} to={researchUrl("contributors/" + id)}><h3>{c.name}</h3><p>{c.role}</p><ArrowRight size={16} aria-hidden /></Link>; })}</div></section>

      <RelatedLinks links={[{ to: (evidence ? "works/" : "evidence/") + source.id, label: evidence ? "Open the bibliographic record" : "Examine the evidence record", note: evidence ? "Edition, attribution and actual uses" : "The observation and its limits" }, ...sourceUses(data, source.id)]} title="Where this source is used" />
      <footer className="acq-sources"><h2>Sources and credits</h2><p>{source.rights} <a href={source.rightsUrl} target="_blank" rel="noreferrer">Rights information</a></p><a href={source.url} target="_blank" rel="noreferrer">Original source and provenance</a><ul>{source.references.map(ref => <li key={ref.url}><a href={ref.url} target="_blank" rel="noreferrer">{ref.label}</a></li>)}</ul></footer>
    </article></div>
  </div>;
}

export function ContributorPage({ data }: { data: ResearchBundle }) {
  const { id } = useParams();
  const contributor = data.contributors.find(c => c.id === id);
  if (!contributor) return <NotFoundPage />;
  return <><ResearchHero eyebrow={"Scholars · " + (contributor.kind === "institution" ? "Institution" : "Contributor")} title={contributor.name} lead={contributor.role} />
    {contributor.kind === "person" && <p className="rs-credit">Faith or tradition: not established in the edition credits reviewed here.</p>}
    <div className="rs-contributor-reading"><section className="rs-reading-section"><h2>The contribution</h2><p>{contributor.description}</p><p>{contributor.scope}</p><p className="rs-credit">{contributor.sourceLocator}</p></section>
      <section className="rs-shelf"><p className="rs-eyebrow">Named works & editions in these readings</p><div className="rs-source-grid">{contributor.works.map(id => <SourceTile key={id} source={data.sources.find(s => s.id === id)!} />)}</div></section>
      <RelatedLinks links={contributor.works.flatMap(id => sourceUses(data,id))} title="Actual source uses" /><footer className="acq-sources"><h2>Sources and credits</h2><a href={contributor.url} target="_blank" rel="noreferrer">Original attribution</a><p>{contributor.sourceLocator}</p></footer>
    </div></>;
}
