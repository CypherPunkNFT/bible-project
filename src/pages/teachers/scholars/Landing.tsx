import { useMemo, useState, type MouseEvent } from "react";
import { ArrowRight, Search } from "lucide-react";
import { useScholars } from "./context";
import { reducedMotion } from "./marks/dom";
import { Constellation } from "./landing/Constellation";
import { findScholars } from "./landing/search";
import { RadiatingBible } from "../preachers/landing/RadiatingBible";
import { SCHOLAR_SECTIONS, sectionNumber } from "./sections";
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
  const found = useMemo(() => findScholars(data, query), [data, query]);
  const matchIds = useMemo(() => new Set([...found.map(m=>m.s.id), ...(query.trim() ? library?.filter(p=>p.search.includes(query.trim().toLocaleLowerCase())).map(p=>p.id) ?? [] : [])]), [found,library,query]);
  return <div className="lnd">
    <div className="lnd-top">
      <div className="lnd-copy"><p className="kicker lnd-kicker">Scholars in the library</p>
        <h1 className="lnd-title">The greats, <br/><em>catalogued.</em></h1>
        <p className="lnd-lead">Explore {library?.length.toLocaleString() ?? "the full library of"} catalogue entries across five fields, including {data.scholars.length} documented scholar profiles. Search authors, translators and their held works.</p>
      </div>
      <RadiatingBible />
      <div className="lnd-tools">
        <form className="lnd-full-search" onSubmit={e=>{e.preventDefault();filterCatalogue({q:query.trim().toLocaleLowerCase()});}}>
          <label className="sr-only" htmlFor="full-contributor-search">Search the full catalogue</label>
          <div><Search size={17} aria-hidden="true"/><input id="full-contributor-search" type="search" placeholder="Author, translator or work" value={query} onChange={e=>setQuery(e.target.value)}/><button type="submit" aria-label="Search catalogue"><ArrowRight size={17}/></button></div>
        </form>
        <dl className="lnd-figs">
          <div><dt>Contributors</dt><dd>{library?.length.toLocaleString() ?? "…"}</dd><p>{data.scholars.length} documented profiles</p></div>
          <div><dt>Fields</dt><dd>{Object.keys(data.fields).length}</dd><p>history to reference books</p></div>
          <div><dt>Era established</dt><dd>{libraryFacts ? (libraryFacts.summary.catalogueEntries-libraryFacts.summary.eras.unknown).toLocaleString() : "…"}</dd><p>entries with reviewed dates</p></div>
          <div><dt>Era unknown</dt><dd>{libraryFacts?.summary.eras.unknown.toLocaleString() ?? "…"}</dd><p>retained in the catalogue</p></div>
        </dl>
      </div>
    </div>
    <Constellation data={data} matches={matchIds} searching={!!query.trim()} onOpen={openProfile}/>
    <div className="lnd-under"><a className="lnd-more" href="#built" onClick={jump}>See how these works are used on the site <ArrowRight size={14}/></a><span>Explore selected scholars by subject; search the full catalogue above.</span></div>
    <nav className="lnd-jump" aria-label="On this page">{SCHOLAR_SECTIONS.map(({id,title})=><a key={id} href={`#${id}`} onClick={jump}><b>{sectionNumber(id)}</b>{title}</a>)}</nav>
  </div>;
}
