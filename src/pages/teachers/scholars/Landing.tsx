// The landing: the face of the Scholars side. The headline ("The greats, catalogued."), a warm intro, a search that
// offers matching scholars and opens their profile, the note that the site itself is built on several of these
// scholars' books (one chip per scholar it uses), the four figures, jump links to the sections below, and the large
// constellation of every scholar's field-shaped mark (landing/Constellation.tsx). Approved mock-up:
// design/scholars-directions/scholars/landing.js.
import { useMemo, useState, type MouseEvent } from "react";
import { ArrowRight } from "lucide-react";
import { useScholars } from "./context";
import { byBirth, isUsed } from "./marks/facts";
import { reducedMotion } from "./marks/dom";
import { Mark } from "./marks/Mark";
import { toneStyle } from "./marks/shapes";
import { Constellation } from "./landing/Constellation";
import { Finder } from "./landing/Finder";
import { findScholars } from "./landing/search";
import "./Landing.css";

const JUMPS = [["catalogue", "01", "The catalogue"], ["built", "02", "Built on their work"], ["discoveries", "03", "Discoveries"], ["fields", "04", "Five ways to study"], ["directory", "07", "Everyone"]] as const;

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
  const { data, openProfile } = useScholars();
  const [query, setQuery] = useState("");
  const found = useMemo(() => findScholars(data, query), [data, query]);
  const matchIds = useMemo(() => new Set(found.map((m) => m.s.id)), [found]);
  const born = useMemo(() => byBirth(data.scholars), [data]);
  const live = born.filter(isUsed), held = born.filter((s) => s.site?.status === "held");
  const first = born[0], last = born[born.length - 1];
  return <div className="lnd">
    <div className="lnd-hero">
      <div className="lnd-copy">
        <p className="kicker lnd-kicker">Scholars in the library</p>
        <h1 className="lnd-title">The greats, <em>catalogued.</em></h1>
        <p className="lnd-lead">Historians, translators, archaeologists, theologians and the makers of reference books: {data.scholars.length} scholars across two thousand years,
          Christian or not, each labelled for what they were. Look someone up, or wander the marks and meet someone new.</p>
        <Finder query={query} onQuery={setQuery} found={found} onOpen={openProfile} />
        <aside className="lnd-built" aria-label="Built on their work">
          <h2>You have been reading <em>their work</em> all&nbsp;along.</h2>
          <p>This site stands on books by {live.length} of them. Their dictionaries, concordance and harmony power the Topics pages, the Gospel harmony, the miracles and the Letters study.</p>
          <ul className="lnd-used">{live.map((s) => <li key={s.id}>
            <button type="button" style={toneStyle(s.field)} onClick={(e) => openProfile(s.id, e.currentTarget)}>
              <Mark scholar={s} size={26} className="lnd-mark" /><span>{s.short}</span></button></li>)}</ul>
          <a className="lnd-more" href="#built" onClick={jump}>Follow each feature back to its book<ArrowRight size={14} aria-hidden="true" /></a>
        </aside>
      </div>
      <Constellation data={data} matches={matchIds} searching={query.trim().length > 0} onOpen={openProfile} />
    </div>
    <div className="lnd-foot">
      <dl className="lnd-figs">
        <div><dt>Scholars</dt><dd>{data.scholars.length}</dd><p>from {first.short} to {last.short}</p></div>
        <div><dt>Fields</dt><dd>{Object.keys(data.fields).length}</dd><p>history to reference books</p></div>
        <div><dt>Used on this site</dt><dd>{live.length}</dd><p>{held.length} more in the library</p></div>
        <div><dt>Since</dt><dd>{first.circa && <><small>c.</small> </>}{first.born}</dd><p>{first.short}, the earliest</p></div>
      </dl>
      <nav className="lnd-jump" aria-label="On this page"><span className="lnd-jump-l">On this page</span>
        {JUMPS.map(([id, n, label]) => <a key={id} href={`#${id}`} onClick={jump}><b>{n}</b>{label}</a>)}</nav>
    </div>
  </div>;
}
