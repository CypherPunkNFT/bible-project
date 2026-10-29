import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Loading } from "@/components/charts/ChartCard";
import { SectionDonut } from "@/components/charts/SectionDonut";
import { SectionFilters, SectionGuide, type SectionFilter } from "@/components/charts/SectionGuide";
import { StudyBackLink } from "@/components/study/StudyBackLink";
import { loadStats } from "@/lib/data";
import { useAsync } from "@/lib/useAsync";
import { buildLibrary } from "@/pages/library/model";
import { BookChapters } from "./BookChapters";
import { ShapeBookArt } from "./ShapeBookArt";
import "@/pages/charts.css";
import "./structure-mockup.css";

/** /study/structure_mockup: the Structure collection in two sections (owner, 2026-10-29), each titled above its own
 *  container: the parts and their measures, then the books by length, where a book opens to its chapters, each
 *  chapter's AI summary, hymns, teachers and connected studies. Replaces the three separate charts of the real page
 *  (Sections & measures, Book lengths, Chapter atlas; ChartsPage.tsx). */
export default function StructureMockup() {
  const stats = useAsync(loadStats, "stats");
  const library = useMemo(() => (stats.status === "ready" ? buildLibrary(stats.value) : null), [stats]);
  const [section, setSection] = useState<SectionFilter>("");
  const failed = <div className="charts-error" role="alert"><p>This chart could not be loaded.</p><button type="button" onClick={() => window.location.reload()}>Try again</button></div>;
  return <div className="charts-hub charts-open study-explorers mx-auto max-w-7xl px-4 sm:px-6">
    <div className="chart-collection-breadcrumb"><StudyBackLink /><strong>The shape of the Bible</strong></div>
    <section id="structure" aria-labelledby="structure-title" className="chart-area" style={{ "--chart-color": "var(--history)" } as CSSProperties}>
      <header className="chart-area-heading shape-heading"><div><p className="charts-panel-kicker">Composition · Bible structure</p><h1 id="structure-title">The whole, the books, the chapters.</h1><p>Sixty-six books, written by many hands across many centuries, come to 1,189 chapters. Begin with the six parts and how much of the Bible each one holds, then compare the books themselves. Open any book to walk through its chapters one by one: a short summary of each, the hymns written on it, the sermons preached from it, and the studies on this site that take it up.</p></div><ShapeBookArt /></header>

      <section aria-labelledby="parts-title" className="shape-section">
        <header className="shape-section-head"><span>01</span><div><h2 id="parts-title">The <em>parts</em></h2><p>Choose a part to see its share of the whole, by any of nine measures. The part you choose also narrows the books below.</p></div></header>
        <div className="charts-explorer shape-card">
          <div className="charts-stage">
            {stats.status === "loading" ? <Loading /> : stats.status === "error" ? failed : <>
              <SectionFilters value={section} onChange={setSection} />
              {section && <SectionGuide section={section} />}
              <SectionDonut stats={stats.value} section={section} onSection={setSection} />
            </>}
          </div>
          <footer className="charts-panel-footer"><span>KJV text measures · Study selections explain their sources and counting rules.</span></footer>
        </div>
      </section>

      <section aria-labelledby="books-title" className="shape-section">
        <header className="shape-section-head"><span>02</span><div><h2 id="books-title">The books and their <em>chapters</em></h2><p>Every book by its length. Open one to walk through its chapters, with a summary of each and what the site holds on it.</p></div></header>
        <div className="charts-explorer shape-card">
          <div className="charts-stage">
            {stats.status === "loading" ? <Loading /> : stats.status === "error" ? failed : library && <BookChapters library={library} section={section} onClearSection={() => setSection("")} />}
          </div>
          <footer className="charts-panel-footer"><span>KJV text · Chapter divisions are reading aids. Chapter summaries are AI-written and still being checked; the chapter itself is the authority.</span></footer>
        </div>
      </section>
    </section>
    <Link to="/study" className="chart-back-map">Return to the Study collection ↑</Link>
  </div>;
}
