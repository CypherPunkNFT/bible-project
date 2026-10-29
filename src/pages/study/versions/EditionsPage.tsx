import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { CoverageMatrix } from "@/components/charts/CoverageMatrix";
import { VersionsTimeline } from "@/components/charts/VersionsTimeline";
import { StudyBackLink } from "@/components/study/StudyBackLink";
import { useCatalog } from "@/lib/catalog";
import { groupOf, VERSION_GROUPS } from "@/lib/languages";
import "@/pages/charts.css";
import "@/pages/study/connections/connections.css";
import "./editions.css";

/** /study/versions_mockup: Versions & languages as one page (owner, 2026-10-29). The timeline, where every edition
 *  opens to read, then the books each edition holds, both following one group filter. No contents cards and no
 *  "Choose an edition" card: the timeline already is the way to choose one. Shares the heading and section styles of
 *  Connections in Scripture (connections.css). */
export default function EditionsPage() {
  const catalog = useCatalog();
  const [group, setGroup] = useState("");
  const editions = catalog.translations;
  const figures = useMemo(() => {
    const years = editions.map((t) => t.year);
    return [
      [String(editions.length), "editions to read"],
      [String(new Set(editions.map((t) => t.lang)).size), "languages"],
      [editions.length ? `${Math.min(...years)}–${Math.max(...years)}` : "—", "years of the editions"],
      [String(Math.max(0, ...editions.map((t) => Object.keys(t.books).length))), "books in the fullest edition"],
    ] as const;
  }, [editions]);
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of editions) map.set(groupOf(t.lang).id, (map.get(groupOf(t.lang).id) ?? 0) + 1);
    return map;
  }, [editions]);
  const choices = [{ id: "", title: "All editions", count: editions.length }, ...VERSION_GROUPS.map((g) => ({ id: g.id, title: g.title, count: counts.get(g.id) ?? 0 }))];

  return <div className="cx-page ed-page charts-hub mx-auto max-w-7xl px-4 sm:px-6" style={{ "--chart-color": "var(--acts)" } as CSSProperties}>
    <div className="chart-collection-breadcrumb"><StudyBackLink /><strong>Versions & languages</strong></div>

    <header className="cx-hero">
      <p className="cx-words">Editions · Languages · Contents</p>
      <h1>Know the edition <em>you are reading</em>.</h1>
      <p className="cx-lead">Every edition in this library, placed by its year. Choose one to start reading it, then see which books each edition holds, from Genesis to the Apocrypha.</p>
      <dl className="cx-figures">{figures.map(([value, label]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    </header>

    <div className="ed-groups" role="group" aria-label="Show editions">
      {choices.map((choice) => <button type="button" key={choice.id} aria-pressed={group === choice.id} onClick={() => setGroup(choice.id)}>{choice.title}<span>{choice.count}</span></button>)}
    </div>

    <section className="ed-section ed-time" aria-labelledby="ed-time-title">
      <header className="cx-section-head">
        <p className="cx-words">Through time</p>
        <h2 id="ed-time-title">Every edition, <em>by its year</em>.</h2>
        <p className="ed-section-lead">The years belong to these editions, not to the writing of the books themselves. Choose an edition to open it at its first chapter.</p>
      </header>
      <VersionsTimeline group={group} fit />
    </section>

    <section className="ed-section" aria-labelledby="ed-books-title">
      <header className="cx-section-head">
        <p className="cx-words">Contents</p>
        <h2 id="ed-books-title">Which books <em>each edition holds</em>.</h2>
        <p className="ed-section-lead">Old Testament, New Testament and Apocrypha, square by square. Hover a square for its chapters, or choose a book to see which editions include it.</p>
      </header>
      <CoverageMatrix group={group} />
    </section>

    <footer className="cx-source"><span>Edition years from the version catalogue · Coverage from each version's own book list</span><Link to="/library">Browse the library by language</Link></footer>
  </div>;
}
