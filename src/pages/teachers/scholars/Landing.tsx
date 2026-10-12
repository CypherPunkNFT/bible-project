// The landing: the face of the Scholars side. The headline ("The greats, catalogued."), a warm intro, a search that
// offers matching scholars and opens their profile, the note that the site itself is built on several of these
// scholars' books (one chip per scholar it uses), the four figures, jump links to the sections below, and the large
// constellation of every scholar's field-shaped mark (landing/Constellation.tsx). Approved mock-up:
// design/scholars-directions/scholars/landing.js.
import { useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { ArrowRight } from "lucide-react";
import { useScholars } from "./context";
import { byBirth, isUsed } from "./marks/facts";
import { reducedMotion } from "./marks/dom";
import { Mark } from "./marks/Mark";
import { toneStyle } from "./marks/shapes";
import { Constellation } from "./landing/Constellation";
import { findScholars } from "./landing/search";
import "./Landing.css";
import { SCHOLAR_SECTIONS, sectionNumber } from "./sections";

const JUMPS = SCHOLAR_SECTIONS;

/** In-page links scroll smoothly and keep the address in step, without a reload. */
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
  const matchIds = useMemo(() => new Set(found.map((m) => m.s.id)), [found]);
  const born = useMemo(() => byBirth(data.scholars), [data]);
  const live = born.filter(isUsed);
  const screen = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const el = screen.current;
      if (el) el.style.setProperty("--landing-start", `${el.getBoundingClientRect().top + window.scrollY}px`);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  return <div className="lnd">
    <div className="lnd-screen" ref={screen}>
    <div className="lnd-hero">
      <div className="lnd-copy">
        <p className="kicker lnd-kicker">Scholars in the library</p>
        <h1 className="lnd-title">The greats, <em>catalogued.</em></h1>
        <p className="lnd-lead">Explore {library ? library.length.toLocaleString() : 'the full library of'} catalogue entries across five fields, including {data.scholars.length} documented scholar profiles. Search authors, translators and their held works.</p>
        <form className="lnd-full-search" onSubmit={e => { e.preventDefault(); filterCatalogue({ q: query.trim().toLocaleLowerCase() }); }}>
          <label htmlFor="full-contributor-search">Search the full catalogue</label>
          <div><input id="full-contributor-search" type="search" placeholder="Author, editor, translator or work" value={query} onChange={e => setQuery(e.target.value)} /><button type="submit">Search <ArrowRight size={14} aria-hidden="true" /></button></div>
        </form>
        <aside className="lnd-built" aria-label="Built on their work">
          <h2>You have been reading <em>their work</em> all&nbsp;along.</h2>
          <p>{live.length} documented scholars supply sources used by the site. Follow their connections in the ribbons below.</p>
          <ul className="lnd-used" tabIndex={0} aria-label="Scholars with verified source connections">{live.map((s) => <li key={s.id}>
            <button type="button" style={toneStyle(s.field)} onClick={(e) => openProfile(s.id, e.currentTarget)}>
              <Mark scholar={s} size={26} className="lnd-mark" /><span>{s.short}</span></button></li>)}</ul>
          <a className="lnd-more" href="#built" onClick={jump}>Follow each feature back to its book<ArrowRight size={14} aria-hidden="true" /></a>
        </aside>
      </div>
      <Constellation data={data} matches={matchIds} searching={query.trim().length > 0} onOpen={openProfile} />
    </div>
    <div className="lnd-foot">
      <dl className="lnd-figs">
        <div><dt>Contributors</dt><dd>{library ? library.length.toLocaleString() : '…'}</dd><p>{data.scholars.length} documented scholar profiles</p></div>
        <div><dt>Fields</dt><dd>{Object.keys(data.fields).length}</dd><p>history to reference books</p></div>
        <div><dt>Era established</dt><dd>{libraryFacts ? (libraryFacts.summary.catalogueEntries - libraryFacts.summary.eras.unknown).toLocaleString() : "…"}</dd><p>entries with reviewed dates</p></div>
        <div><dt>Era unknown</dt><dd>{libraryFacts?.summary.eras.unknown.toLocaleString() ?? "…"}</dd><p>retained in the catalogue</p></div>
      </dl>
    </div>
    </div>
      <nav className="lnd-jump" aria-label="On this page"><span className="lnd-jump-l">On this page</span>
        {JUMPS.map(({id, title}) => <a key={id} href={`#${id}`} onClick={jump}><b>{sectionNumber(id)}</b>{title}</a>)}</nav>
  </div>;
}
