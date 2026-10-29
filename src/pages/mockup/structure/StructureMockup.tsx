import { BookOpen } from "lucide-react";
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
import "@/pages/charts.css";
import "./structure-mockup.css";

/** /study/structure_mockup: the Structure collection as ONE section (owner, 2026-10-29). The parts and their measures,
 *  then the books by length; a book opens in place to its chapters and the chosen chapter's AI summary. Replaces the
 *  three separate charts (Sections & measures, Book lengths, Chapter atlas) of the real page, ChartsPage.tsx. */
export default function StructureMockup() {
  const stats = useAsync(loadStats, "stats");
  const library = useMemo(() => (stats.status === "ready" ? buildLibrary(stats.value) : null), [stats]);
  const [section, setSection] = useState<SectionFilter>("");
  return <div className="charts-hub charts-open study-explorers mx-auto max-w-7xl px-4 sm:px-6">
    <div className="chart-collection-breadcrumb"><StudyBackLink /><strong>The shape of the Bible</strong></div>
    <section id="structure" aria-labelledby="structure-title" className="chart-area" style={{ "--chart-color": "var(--history)" } as CSSProperties}>
      <header className="chart-area-heading"><div><p className="charts-panel-kicker">Composition · Bible structure</p><h1 id="structure-title">The whole, the books, the chapters.</h1><p>Begin with the six parts and how much of the Bible each one holds, then compare its books. Open any book to walk through its chapters, with a summary of each.</p></div><BookOpen aria-hidden="true" /></header>
      <section aria-labelledby="shape-title" className="charts-explorer chart-panel shape-panel">
        <header className="chart-panel-intro"><h2 id="shape-title">The shape of the Bible</h2><p>Choose a part to follow it all the way down: its share of the whole, its books, then any chapter.</p></header>
        <div className="charts-stage">
          {stats.status === "loading" ? <Loading /> : stats.status === "error" ? <div className="charts-error" role="alert"><p>This chart could not be loaded.</p><button type="button" onClick={() => window.location.reload()}>Try again</button></div> : <>
            <SectionFilters value={section} onChange={setSection} />
            {section && <SectionGuide section={section} />}
            <div className="shape-step"><span>01</span><h3>The parts</h3></div>
            <SectionDonut stats={stats.value} section={section} onSection={setSection} />
            <div className="shape-step"><span>02</span><h3>The books and their chapters</h3></div>
            {library && <BookChapters library={library} section={section} />}
          </>}
        </div>
        <footer className="charts-panel-footer"><span>KJV text measures · Chapter divisions are reading aids. Chapter summaries are AI-written and still being checked; the chapter itself is the authority.</span></footer>
      </section>
    </section>
    <Link to="/study" className="chart-back-map">Return to the Study collection ↑</Link>
  </div>;
}
