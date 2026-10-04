import { ArrowRight, BookOpen, Layers, Network, Quote } from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArcDiagram } from "@/components/charts/ArcDiagram";
import { BookMatrix } from "@/components/charts/BookMatrix";
import { BookSizes } from "@/components/charts/BookSizes";
import { ChapterGrid } from "@/components/charts/ChapterGrid";
import { Loading } from "@/components/charts/ChartCard";
import { CoverageMatrix } from "@/components/charts/CoverageMatrix";
import { SectionDonut } from "@/components/charts/SectionDonut";
import { SectionFilters, SectionGuide, type SectionFilter } from "@/components/charts/SectionGuide";
import { VersionsTimeline } from "@/components/charts/VersionsTimeline";
import { WordsOfJesus } from "@/components/charts/WordsOfJesus";
import { useCatalog } from "@/lib/catalog";
import { loadArcs, loadBookPairs, loadStats } from "@/lib/data";
import { useAsync, type AsyncState } from "@/lib/useAsync";
import { formatNumber } from "@/lib/utils";
import "./charts.css";

const AREAS = [
  { id: "references", label: "References", short: "Follow the connections", icon: Network, color: "poetry", title: "Scripture in conversation.", lead: "See the sweep of the cross-references, then look closely at where one book points to another.", views: [{ id: "arcs", label: "Across Scripture" }, { id: "matrix", label: "Book to book" }] },
  { id: "structure", label: "Bible structure", short: "Understand the whole", icon: BookOpen, color: "history", title: "One story. A library of voices.", lead: "Change the measure, meet the literary forms, then move from the whole Bible to a book or a numbered chapter.", views: [{ id: "sections", label: "The whole in parts" }, { id: "sizes", label: "Compare books" }, { id: "chapters", label: "Chapter atlas" }] },
  { id: "words", label: "Words of Jesus", short: "Listen. Compare. Reflect.", icon: Quote, color: "revelation", title: "Hear the words. Follow the life.", lead: "Explore the shape of Jesus' speech, linger over his teaching, and hear the distinctive voices of the Gospel accounts.", views: [{ id: "jesus", label: "Words of Jesus" }] },
  { id: "versions", label: "Versions", short: "A library across centuries", icon: Layers, color: "acts", title: "The Scriptures, handed on.", lead: "Place the editions in time, then compare the books each includes. Dates describe these editions; coverage describes their contents.", views: [{ id: "timeline", label: "Through time" }, { id: "coverage", label: "Books included" }] },
] as const;

function Result<T>({ state, children }: { state: AsyncState<T>; children: (value: T) => ReactNode }) {
  if (state.status === "loading") return <Loading height={380} />;
  if (state.status === "error") return <div className="charts-error" role="alert"><p>This chart could not be loaded.</p><button type="button" onClick={() => window.location.reload()}>Try again</button></div>;
  return <>{children(state.value)}</>;
}
function ArcsView() { const arcs = useAsync(loadArcs, "arcs"); return <Result state={arcs}>{(data) => <ArcDiagram data={data} />}</Result>; }
function MatrixView() { const pairs = useAsync(loadBookPairs, "pairs"); return <Result state={pairs}>{(data) => <BookMatrix pairs={data} />}</Result>; }

export default function ChartsPage() {
  const catalog = useCatalog();
  const stats = useAsync(loadStats, "stats");
  const location = useLocation();
  const navigate = useNavigate();
  const [section, setSection] = useState<SectionFilter>("");
  const [remembered, setRemembered] = useState<Record<string, string>>({});
  const requested = location.hash.slice(1);
  const areaIndex = Math.max(0, AREAS.findIndex((a) => a.id === requested || a.views.some((v) => v.id === requested)));
  const area = AREAS[areaIndex];
  const active = area.views.find((v) => v.id === requested) ?? area.views[0];
  const canon = stats.status === "ready" ? stats.value.books.filter((b) => b.section !== "apocrypha") : null;
  const choose = (id: string) => {
    setRemembered((current) => ({ ...current, [area.id]: active.id }));
    navigate({ pathname: "/charts", hash: "#" + id }, { preventScrollReset: true });
  };
  const chooseArea = (i: number) => choose(remembered[AREAS[i].id] ?? AREAS[i].views[0].id);
  return <div className="charts-hub mx-auto max-w-7xl px-4 sm:px-6" style={{ "--chart-color": "var(--" + area.color + ")" } as CSSProperties}>
    <header className="charts-intro">
      <div><p className="charts-eyebrow"><span /> The visual collection</p><h1>See Scripture <em>differently.</em></h1><p className="charts-intro-copy">Notice the patterns. Understand the context. Return to the Word.</p></div>
      <dl className="charts-numbers"><div><dt>chapters</dt><dd>{canon ? formatNumber(canon.reduce((n, b) => n + b.chapters.length, 0)) : "—"}</dd></div><div><dt>verses · KJV</dt><dd>{canon ? formatNumber(canon.reduce((n, b) => n + b.verses, 0)) : "—"}</dd></div><div><dt>versions</dt><dd>{catalog.translations.length}</dd></div></dl>
    </header>
    <div className="charts-tabs" role="tablist" aria-label="Explore Scripture">
      {AREAS.map((a, i) => <button key={a.id} type="button" role="tab" id={"tab-" + a.id} aria-controls={areaIndex === i ? active.id : undefined} aria-selected={areaIndex === i} tabIndex={areaIndex === i ? 0 : -1} className="charts-tab" style={{ "--view-color": "var(--" + a.color + ")" } as CSSProperties} onClick={() => chooseArea(i)} onKeyDown={(event) => {
        const target = event.key === "ArrowRight" ? (i + 1) % 4 : event.key === "ArrowLeft" ? (i + 3) % 4 : event.key === "Home" ? 0 : event.key === "End" ? 3 : -1;
        if (target < 0) return;
        event.preventDefault(); chooseArea(target); document.getElementById("tab-" + AREAS[target].id)?.focus();
      }}><a.icon size={22} strokeWidth={1.35} aria-hidden="true" /><span><strong>{a.label}</strong><small>{a.short}</small></span></button>)}
    </div>
    <section id={active.id} role="tabpanel" aria-labelledby={"tab-" + area.id} tabIndex={0} className="charts-explorer">
      <header className="charts-panel-heading"><div><p className="charts-panel-kicker">{area.label}</p><h2>{area.title}</h2><p className="charts-panel-lead">{area.lead}</p></div><span className="charts-panel-mark" aria-hidden="true"><area.icon size={32} strokeWidth={1} /></span></header>
      {area.views.length > 1 && <nav className="charts-modes" aria-label={area.label + " views"}>{area.views.map((v) => <button key={v.id} type="button" aria-pressed={active.id === v.id} onClick={() => choose(v.id)}>{v.label}</button>)}</nav>}
      <div className="charts-stage">
        {area.id === "structure" && <><SectionFilters value={section} onChange={setSection} /><SectionGuide section={section} /></>}
        {active.id === "arcs" && <ArcsView />}
        {active.id === "matrix" && <MatrixView />}
        {active.id === "sections" && <Result state={stats}>{(data) => <SectionDonut stats={data} section={section} onSection={setSection} />}</Result>}
        {active.id === "sizes" && <Result state={stats}>{(data) => <BookSizes stats={data} section={section} />}</Result>}
        {active.id === "chapters" && <Result state={stats}>{(data) => <ChapterGrid key={section} stats={data} section={section} />}</Result>}
        {active.id === "jesus" && <Result state={stats}>{(data) => <WordsOfJesus stats={data} />}</Result>}
        {active.id === "timeline" && <VersionsTimeline />}
        {active.id === "coverage" && <CoverageMatrix />}
      </div>
      <footer className="charts-panel-footer"><span>{area.id === "references" ? active.id === "matrix" ? "Rows: from · Columns: to · Stronger colour: more references · Genesis → Revelation" : "Arcs join different chapters; select a book to follow its references." : area.id === "structure" ? "KJV text measures · Study selections identify their sources and counting rules above." : area.id === "words" ? "KJV red-letter markup · Teaching selections are an invitation to read the full passage." : "Edition dates and book lists from the version catalogue."}</span>{area.id === "references" && <a href="https://www.openbible.info/labs/cross-references/" target="_blank" rel="noreferrer">OpenBible.info ↗</a>}</footer>
    </section>
    <nav className="charts-next" aria-label="Continue exploring charts"><p>Look closer.<br /><em>There is more to discover.</em></p><button type="button" onClick={() => chooseArea((areaIndex + 1) % 4)}><span><small>Explore next</small>{AREAS[(areaIndex + 1) % 4].label}</span><ArrowRight size={16} aria-hidden="true" /></button></nav>
  </div>;
}
