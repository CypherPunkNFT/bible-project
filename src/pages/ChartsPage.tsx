import { ArrowLeft, ArrowRight, BarChart3, CircleDot, Grid3X3, Layers, Network, Quote, Route, ScanLine } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArcDiagram } from "@/components/charts/ArcDiagram";
import { BookMatrix } from "@/components/charts/BookMatrix";
import { BookSizes } from "@/components/charts/BookSizes";
import { ChapterGrid } from "@/components/charts/ChapterGrid";
import { Loading } from "@/components/charts/ChartCard";
import { CoverageMatrix } from "@/components/charts/CoverageMatrix";
import { SectionDonut } from "@/components/charts/SectionDonut";
import { VersionsTimeline } from "@/components/charts/VersionsTimeline";
import { WordsOfJesus } from "@/components/charts/WordsOfJesus";
import { useCatalog } from "@/lib/catalog";
import { loadArcs, loadBookPairs, loadStats } from "@/lib/data";
import { useAsync, type AsyncState } from "@/lib/useAsync";
import { formatNumber } from "@/lib/utils";
import "./charts.css";

const VIEWS = [
  { id: "arcs", label: "Cross-reference arcs", short: "Across Scripture", icon: Network, color: "gospels", title: "A thousand chapters. A web of connections.", lead: "Each arc joins chapters in OpenBible.info’s existing cross-reference set. Choose a book to follow its links across Scripture.", source: "OpenBible.info · Cross-references between different chapters" },
  { id: "matrix", label: "Book to book", short: "Follow the references", icon: Grid3X3, color: "poetry", title: "Where one book points to another.", lead: "Explore the connections between all 66 books. Select a pair in the grid or the ranked list to keep it in view.", source: "OpenBible.info · Directional cross-reference counts" },
  { id: "sections", label: "The sections", short: "The whole in parts", icon: CircleDot, color: "history", title: "The shape of the whole.", lead: "See how the reading-chart sections share the Bible’s words. Select a section to take a closer look.", source: "King James Version · Word counts, excluding the Apocrypha" },
  { id: "sizes", label: "Book lengths", short: "Compare the books", icon: BarChart3, color: "epistles", title: "Long stories. Short letters.", lead: "Compare every book by words, verses or chapters. Keep the Bible’s order, or bring the longest books to the top.", source: "King James Version · Counts from the text" },
  { id: "chapters", label: "Chapter atlas", short: "Every chapter, at a glance", icon: ScanLine, color: "prophets", title: "A small square. A whole chapter.", lead: "Each square is a chapter; stronger colour means more words. Filter by section, explore a book, or open a chapter to read.", source: "King James Version · 1,189 chapters, excluding the Apocrypha" },
  { id: "jesus", label: "Words of Jesus", short: "Explore the red letters", icon: Quote, color: "revelation", title: "The words in red.", lead: "Explore the share of each Gospel chapter marked as Jesus speaking. Select a bar to read the chapter in context.", source: "King James Version · Based on the edition’s red-letter markup" },
  { id: "timeline", label: "Versions through time", short: "Centuries of translation", icon: Route, color: "acts", title: "The Word, through the centuries.", lead: "Discover the editions in this library, placed by their recorded year. Every version opens directly in the reader.", source: "Edition years from the version catalogue" },
  { id: "coverage", label: "Version coverage", short: "See what is included", icon: Layers, color: "apocrypha", title: "One library. Different collections.", lead: "Compare the books included in each version, from the Old and New Testaments to the Apocrypha.", source: "Coverage from each version’s actual book list" },
] as const;

function Result<T>({ state, children }: { state: AsyncState<T>; children: (value: T) => ReactNode }) {
  if (state.status === "loading") return <Loading height={380} />;
  if (state.status === "error") return <div className="charts-error" role="alert"><p>This chart could not be loaded.</p><button type="button" onClick={() => window.location.reload()}>Try again</button></div>;
  return <>{children(state.value)}</>;
}

function ArcsView() {
  const arcs = useAsync(loadArcs, "arcs");
  return <Result state={arcs}>{(data) => <ArcDiagram data={data} />}</Result>;
}

function MatrixView() {
  const pairs = useAsync(loadBookPairs, "pairs");
  return <Result state={pairs}>{(data) => <BookMatrix pairs={data} />}</Result>;
}

export default function ChartsPage() {
  const catalog = useCatalog();
  const stats = useAsync(loadStats, "stats");
  const location = useLocation();
  const navigate = useNavigate();
  const index = Math.max(0, VIEWS.findIndex((view) => view.id === location.hash.slice(1)));
  const active = VIEWS[index];
  const canon = stats.status === "ready" ? stats.value.books.filter((b) => b.section !== "apocrypha") : null;
  const choose = (next: number) => navigate({ pathname: "/charts", hash: "#" + VIEWS[next].id }, { preventScrollReset: true });
  const next = (index + 1) % VIEWS.length;
  const previous = (index + VIEWS.length - 1) % VIEWS.length;

  return (
    <div className="charts-hub mx-auto max-w-7xl px-4 sm:px-6" style={{ "--chart-color": "var(--" + active.color + ")" } as CSSProperties}>
      <header className="charts-intro">
        <div>
          <p className="charts-eyebrow"><span /> The visual collection</p>
          <h1>See Scripture <em>differently.</em></h1>
          <p className="charts-intro-copy">Follow its references. Discover its proportions. Explore the Bible from a new perspective.</p>
        </div>
        <dl className="charts-numbers">
          <div><dt>chapters</dt><dd>{canon ? formatNumber(canon.reduce((n, b) => n + b.chapters.length, 0)) : "—"}</dd></div>
          <div><dt>verses · KJV</dt><dd>{canon ? formatNumber(canon.reduce((n, b) => n + b.verses, 0)) : "—"}</dd></div>
          <div><dt>versions</dt><dd>{catalog.translations.length}</dd></div>
        </dl>
      </header>
      <div className="charts-collection-label"><span>Eight ways to see the Bible</span><span>Choose a view to explore</span></div>
      <div className="charts-tabs" role="tablist" aria-label="Charts on this page">
        {VIEWS.map((view, i) => {
          const Icon = view.icon;
          return <button key={view.id} type="button" role="tab" id={"tab-" + view.id} aria-controls={view.id} aria-selected={index === i} tabIndex={index === i ? 0 : -1}
            className="charts-tab" style={{ "--view-color": "var(--" + view.color + ")" } as CSSProperties} onClick={() => choose(i)}
            onKeyDown={(event) => {
              const target = event.key === "ArrowRight" ? (i + 1) % VIEWS.length : event.key === "ArrowLeft" ? (i + VIEWS.length - 1) % VIEWS.length : event.key === "Home" ? 0 : event.key === "End" ? VIEWS.length - 1 : -1;
              if (target < 0) return;
              event.preventDefault();
              choose(target);
              document.getElementById("tab-" + VIEWS[target].id)?.focus();
            }}>
            <Icon size={21} strokeWidth={1.35} aria-hidden="true" /><span><strong>{view.label}</strong><small>{view.short}</small></span><span className="charts-tab-index">0{i + 1}</span>
          </button>;
        })}
      </div>
      <section key={active.id} id={active.id} role="tabpanel" aria-labelledby={"tab-" + active.id} tabIndex={0} className="charts-explorer">
        <header className="charts-panel-heading">
          <div><p className="charts-panel-kicker">0{index + 1} / {active.label}</p><h2>{active.title}</h2><p className="charts-panel-lead">{active.lead}</p></div>
          <span className="charts-panel-mark" aria-hidden="true"><active.icon size={32} strokeWidth={1} /></span>
        </header>
        <div className="charts-stage">
          {active.id === "arcs" && <ArcsView />}
          {active.id === "matrix" && <MatrixView />}
          {active.id === "sections" && <Result state={stats}>{(data) => <SectionDonut stats={data} />}</Result>}
          {active.id === "sizes" && <Result state={stats}>{(data) => <BookSizes stats={data} />}</Result>}
          {active.id === "chapters" && <Result state={stats}>{(data) => <ChapterGrid stats={data} />}</Result>}
          {active.id === "jesus" && <Result state={stats}>{(data) => <WordsOfJesus stats={data} />}</Result>}
          {active.id === "timeline" && <VersionsTimeline />}
          {active.id === "coverage" && <CoverageMatrix />}
        </div>
        <footer className="charts-panel-footer"><span>{active.source}</span><span>Explore · Compare · Read</span></footer>
      </section>
      <nav className="charts-next" aria-label="Continue exploring charts">
        <button type="button" onClick={() => choose(previous)}><ArrowLeft size={16} aria-hidden="true" /><span><small>Previous view</small>{VIEWS[previous].label}</span></button>
        <p>Same Scripture.<br /><em>A different perspective.</em></p>
        <button type="button" onClick={() => choose(next)}><span><small>Next view</small>{VIEWS[next].label}</span><ArrowRight size={16} aria-hidden="true" /></button>
      </nav>
    </div>
  );
}
