import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CoverageMatrix } from "@/components/charts/CoverageMatrix";
import { VersionsTimeline } from "@/components/charts/VersionsTimeline";
import { StudyBackLink } from "@/components/study/StudyBackLink";
import { useCatalog } from "@/lib/catalog";
import { groupOf, VERSION_GROUPS } from "@/lib/languages";
import { EditionsArt } from "./EditionsArt";
import { LanguageShelf, LibraryFigures } from "./LanguageShelf";
import "@/pages/charts.css";
import "./editions.css";

function SectionHead({ number, id, title, children }: { number: string; id: string; title: ReactNode; children: ReactNode }) {
  return <header className="ed-section-head"><span>{number}</span><div><h2 id={id}>{title}</h2><p>{children}</p></div></header>;
}

/** /study/versions_mockup: Versions & languages as one page (owner, 2026-10-29). The heading with its shelf drawing,
 *  the figures as one bar, then the languages with every edition to open, then the timeline and the books each
 *  edition holds, both following one group filter. No contents cards and no "Choose an edition" card: the languages
 *  and the timeline already are the ways to choose one. */
export default function EditionsPage() {
  const catalog = useCatalog();
  const [group, setGroup] = useState("");
  const editions = catalog.translations;
  const books = useMemo(() => catalog.books.filter((b) => editions.some((t) => t.books[b.code])), [catalog.books, editions]);
  const languageCount = new Set(editions.map((t) => t.lang)).size;
  const years = editions.map((t) => t.year);
  const choices = [{ id: "", title: "All editions", count: editions.length }, ...VERSION_GROUPS.map((g) => ({ id: g.id, title: g.title, count: editions.filter((t) => groupOf(t.lang).id === g.id).length }))];

  return <div className="ed-page charts-hub mx-auto max-w-7xl px-4 sm:px-6" style={{ "--chart-color": "var(--acts)" } as CSSProperties}>
    <div className="chart-collection-breadcrumb"><StudyBackLink /><strong>Versions & languages</strong></div>

    <header className="ed-heading">
      <div>
        <p className="ed-words">Editions · Languages · Contents</p>
        <h1>Know the edition <em>you are reading</em>.</h1>
        <p className="ed-lead">{editions.length} editions in {languageCount} languages, from {years.length ? Math.min(...years) : "—"} to {years.length ? Math.max(...years) : "—"}. Find one by its language or its year and open it to read, then see which books each one holds.</p>
      </div>
      <EditionsArt />
    </header>
    <LibraryFigures editions={editions} books={books} />

    <section className="ed-section ed-first" aria-labelledby="ed-languages-title">
      <SectionHead number="01" id="ed-languages-title" title="The languages">Each language by its own name, with every edition in it. Choose one to open it at its first chapter.</SectionHead>
      <LanguageShelf editions={editions} />
    </section>

    <section className="ed-section ed-time" aria-labelledby="ed-time-title">
      <SectionHead number="02" id="ed-time-title" title="Through time">The years belong to these editions, not to the writing of the books themselves.</SectionHead>
      <div className="ed-groups" role="group" aria-label="Show editions in the timeline and the contents">
        {choices.map((choice) => <button type="button" key={choice.id} aria-pressed={group === choice.id} onClick={() => setGroup(choice.id)}>{choice.title}<span>{choice.count}</span></button>)}
      </div>
      <VersionsTimeline group={group} fit plain />
    </section>

    <section className="ed-section ed-books" aria-labelledby="ed-books-title">
      <SectionHead number="03" id="ed-books-title" title="Which books each holds">Old Testament, New Testament and Apocrypha, square by square, for the editions chosen above. Hover a square for its chapters, or choose a grey square along the top to see which editions include that book.</SectionHead>
      {/* As wide as the table, so the sources line ends where the table does. */}
      <div className="ed-books-fit">
        <CoverageMatrix group={group} bookStrip plain />
        <footer className="ed-source"><span>Edition years from the version catalogue · Coverage from each version's own book list</span><Link to="/library">Browse the library by language</Link></footer>
      </div>
    </section>

  </div>;
}
