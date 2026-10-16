import { useMemo, useState, type MouseEvent } from "react";
import { ArrowRight, Search } from "lucide-react";
import { useScholars } from "./context";
import { reducedMotion } from "./marks/dom";
import { Constellation } from "./landing/Constellation";
import { ALL_LIBRARY, matchesLibrary } from './catalogue/library';
import { NO_FILTERS } from './context';
import { LandingHeader } from "../shared/LandingHeader";
import { SCHOLAR_SECTIONS, sectionNumber } from "./sections";
import { StartReading } from "../shared/StartReading";
import { toneVar } from "./marks/shapes";
import "./Landing.css";
function jump(event: MouseEvent<HTMLAnchorElement>) {
  const hash = event.currentTarget.getAttribute("href") ?? "";
  const target = document.getElementById(hash.slice(1));
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  history.replaceState(history.state, "", hash);
}
export function Landing() {
  const { data, library, libraryFacts, openProfile, filterCatalogue } = useScholars();
  const [query, setQuery] = useState("");
  const matchIds = useMemo(() => new Set(query.trim() ? (library??[]).filter(p=>matchesLibrary(p,{...NO_FILTERS,q:query.trim().toLocaleLowerCase()},ALL_LIBRARY)).flatMap(p=>[p.id,...(p.scholar?[p.scholar.id]:[])]) : []),[library,query]);
  return <div className="lnd">
    <LandingHeader title={<>The greats,<br/><em>catalogued.</em></>} lead={<>Explore {library?.length.toLocaleString() ?? "the full library of"} contributor entries across five fields, including {data.scholars.length} documented scholar profiles. Search authors, translators and their associated works.</>}
      navigation={<nav className="lnd-section-nav" aria-label="On this page"><div className="lnd-jump">{SCHOLAR_SECTIONS.map(({id,title})=><a key={id} href={`#${id}`} onClick={jump}><span><b>{sectionNumber(id)}</b>{title}</span><ArrowRight size={14} aria-hidden="true"/></a>)}</div></nav>}>
        <form className="lnd-full-search" onSubmit={e=>{e.preventDefault();filterCatalogue({q:query.trim().toLocaleLowerCase()});}}>
          <label className="sr-only" htmlFor="full-contributor-search">Search the full catalogue</label>
          <div><Search size={17} aria-hidden="true"/><input id="full-contributor-search" type="search" placeholder="Author, translator or work" value={query} onChange={e=>setQuery(e.target.value)}/><button type="submit" aria-label="Search catalogue"><ArrowRight size={17}/></button></div>
        </form>
        <dl className="lnd-figs">
          <div><dt>Contributors</dt><dd>{library?.length.toLocaleString() ?? "…"}</dd><p>{data.scholars.length} documented profiles</p></div>
          <div><dt>Fields</dt><dd>{Object.keys(data.fields).length}</dd><p>history to reference books</p></div>
          <div><dt>Era established</dt><dd>{libraryFacts ? (libraryFacts.summary.catalogueEntries-libraryFacts.summary.eras.unknown).toLocaleString() : "…"}</dd><p>documented or source-supported</p></div>
          <div><dt>Era unknown</dt><dd>{libraryFacts?.summary.eras.unknown.toLocaleString() ?? "…"}</dd><p>retained in the catalogue</p></div>
        </dl>
    </LandingHeader>
    <Constellation data={data} matches={matchIds} searching={!!query.trim()} onOpen={openProfile}/>
    <StartReading side="scholars" onOpen={openProfile} toneFor={id => {const scholar = data.scholars.find(s => s.id === id); return scholar ? toneVar(scholar.field) : 'var(--muted)';}}/>
  </div>;
}
