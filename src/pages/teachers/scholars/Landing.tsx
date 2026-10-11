// Opening: full catalogue search, bounded contributor selection and audited coverage totals.
import { useDeferredValue, useMemo, useState, type MouseEvent } from "react";
import { ArrowRight } from "lucide-react";
import { useScholars } from "./context";
import { byBirth, isUsed } from "./marks/facts";
import { reducedMotion } from "./marks/dom";
import { Mark } from "./marks/Mark";
import { toneStyle } from "./marks/shapes";
import { LibraryConstellation } from "./landing/LibraryConstellation";
import { searchOpening } from "./landing/library-view";
import "./Landing.css";
import "./landing/library-opening.css";
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
  const { data, library, libraryFacts, libraryError, openProfile, filterCatalogue } = useScholars();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const found = useMemo(() => searchOpening(library ?? [], deferredQuery), [library, deferredQuery]);
  const born = useMemo(() => byBirth(data.scholars), [data]);
  const live = born.filter(isUsed);
  const summary = libraryFacts?.summary;
  const count = (value: number | undefined) => value === undefined ? '\u2026' : value.toLocaleString();
  return <div className="lnd">
    <div className="lnd-hero">
      <div className="lnd-copy">
        <p className="kicker lnd-kicker">Scholars in the library</p>
        <h1 className="lnd-title">The greats, <em>catalogued.</em></h1>
        <p className="lnd-lead">Explore the people behind the books: historians, translators, early church writers, theologians and makers of reference works. Search {summary ? summary.catalogueEntries.toLocaleString() : "the library's"} catalogue entries, from the Latin Fathers to modern apologetics.</p>
        <p className="lnd-scope">The catalogue includes authors, editors, organisations and unresolved credits. {data.scholars.length} entries currently have a documented biographical profile; the acquired library is still being reconciled.</p>
        <form className="lnd-full-search" onSubmit={e => { e.preventDefault(); filterCatalogue({ q: query.trim().toLocaleLowerCase() }, { resetLibrary: true }); }}>
          <label htmlFor="full-contributor-search">Search the full catalogue</label>
          <div><input id="full-contributor-search" type="search" placeholder="Name, role or featured work" aria-describedby="opening-search-status" value={query} onChange={e => setQuery(e.target.value)} /><button type="submit" disabled={!library}>Search <ArrowRight size={14} aria-hidden="true" /></button></div>
        </form>
        <div className="lnd-search-feedback" aria-busy={query !== deferredQuery}>
          <p id="opening-search-status" role="status">{libraryError ? 'Catalogue unavailable. Reload to try again.' : !library ? 'Loading catalogue entries...' : query.trim() ? `${found.length.toLocaleString()} matching entries${found.length > 6 ? '; showing the first 6' : ''}.` : 'Search names, recorded roles and featured work titles across the full catalogue.'}</p>
          {query.trim() && found.length > 0 && <ul className="lnd-library-results">{found.slice(0, 6).map(p => <li key={p.id}>
            <button type="button" onClick={e => p.scholar ? openProfile(p.scholar.id, e.currentTarget) : filterCatalogue({ q: p.name.toLocaleLowerCase() }, { resetLibrary: true })}>
              <b>{p.name}</b><span>{p.scholar ? 'Open profile' : 'Browse catalogue'} ? {p.roles.join(', ') || 'Recorded contributor'}</span>
            </button>
          </li>)}</ul>}
          {query.trim() && library && found.length === 0 && <p>Try another spelling, a surname or a recorded role.</p>}
        </div>
        <aside className="lnd-built" aria-label="Built on their work">
          <h2>You have been reading <em>their work</em> all&nbsp;along.</h2>
          <p>This site stands on books by {live.length} of them. Their dictionaries, concordance and harmony power the Topics pages, the Gospel harmony, the miracles and the Letters study.</p>
          <ul className="lnd-used">{live.map((s) => <li key={s.id}>
            <button type="button" style={toneStyle(s.field)} onClick={(e) => openProfile(s.id, e.currentTarget)}>
              <Mark scholar={s} size={26} className="lnd-mark" /><span>{s.short}</span></button></li>)}</ul>
          <a className="lnd-more" href="#built" onClick={jump}>Follow each feature back to its book<ArrowRight size={14} aria-hidden="true" /></a>
        </aside>
      </div>
      <LibraryConstellation />
    </div>
    <div className="lnd-foot">
      <dl className="lnd-figs">
        <div><dt>Catalogue entries</dt><dd>{count(summary?.catalogueEntries)}</dd><p>authors, editors and other credits</p></div>
        <div><dt>Fields</dt><dd>{Object.keys(data.fields).length}</dd><p>subjects covered by their works</p></div>
        <div><dt>Placed by era</dt><dd>{count(summary ? summary.catalogueEntries - summary.eras.unknown : undefined)}</dd><p>supported by recorded dates</p></div>
        <div><dt>Era unknown</dt><dd>{count(summary?.eras.unknown)}</dd><p>included while dates await review</p></div>
      </dl>
      <nav className="lnd-jump" aria-label="On this page"><span className="lnd-jump-l">On this page</span>
        {JUMPS.map(({id, title}) => <a key={id} href={`#${id}`} onClick={jump}><b>{sectionNumber(id)}</b>{title}</a>)}</nav>
    </div>
  </div>;
}
