import { ArrowRight, BookOpen, Layers, Network, Quote } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
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
  { id: "references", slug: "references", discover: ["Follow a book's links across the canon","Compare the strongest book-to-book connections","Find passages to read together in context"], label: "References", lens: "Connections", icon: Network, color: "poetry", question: "How does one passage lead to another?", why: "A verse belongs to a wider conversation. Follow the links across chapters, then compare the connections between whole books.", charts: [{ id: "arcs", label: "Cross-reference arcs" }, { id: "matrix", label: "Book to book" }] },
  { id: "structure", slug: "structure", discover: ["Compare the Bible by nine different measures","See how literary forms shape your reading","Move from a section to a numbered chapter"], label: "Bible structure", lens: "Composition", icon: BookOpen, color: "history", question: "How does the whole fit together?", why: "The Bible is a collection of different books and literary forms. See its proportions, compare its books, and find your place among the chapters.", charts: [{ id: "sections", label: "Sections & measures" }, { id: "sizes", label: "Book lengths" }, { id: "chapters", label: "Chapter atlas" }] },
  { id: "words", slug: "words-of-jesus", discover: ["Read teaching within each Gospel's setting","Compare parallel Gospel passages","Locate longer discourses and shorter encounters"], label: "Words of Jesus", lens: "Voice & teaching", icon: Quote, color: "revelation", question: "What does Jesus say—and in what setting?", why: "Focus on his teaching within the Gospel stories. Read parallel accounts alongside one another, then see where his speech fills a chapter.", charts: [{ id: "jesus", label: "Teaching journeys" }, { id: "speech", label: "Where he speaks" }] },
  { id: "versions", slug: "versions", discover: ["Place the library's editions in time","Compare their actual book collections","Choose an edition and begin reading"], label: "Versions", lens: "Editions & contents", icon: Layers, color: "acts", question: "Which edition am I reading?", why: "The editions in this library come from different times and include different collections of books. Place them in time and compare what each contains.", charts: [{ id: "timeline", label: "Versions through time" }, { id: "coverage", label: "Version coverage" }] },
] as const;

function Result<T>({ state, children }: { state: AsyncState<T>; children: (value: T) => ReactNode }) {
  if (state.status === "loading") return <Loading height={380} />;
  if (state.status === "error") return <div className="charts-error" role="alert"><p>This chart could not be loaded.</p><button type="button" onClick={() => window.location.reload()}>Try again</button></div>;
  return <>{children(state.value)}</>;
}
function ArcsView() { const arcs = useAsync(loadArcs, "arcs"); return <Result state={arcs}>{(data) => <ArcDiagram data={data} />}</Result>; }
function MatrixView() { const pairs = useAsync(loadBookPairs, "pairs"); return <Result state={pairs}>{(data) => <BookMatrix pairs={data} />}</Result>; }

/** The page stays open; heavier charts mount as the reader approaches them and then keep their state. */
function ChartPanel({ id, title, lead, source, height = 480, children }: { id: string; title: string; lead: string; source: ReactNode; height?: number; children: ReactNode }) {
  const element = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(() => window.location.hash === "#" + id || (id === "jesus" && window.location.hash === "#speech") || (id === "arcs" && (!window.location.hash || window.location.hash === "#references")));
  useEffect(() => {
    if (ready || !element.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setReady(true); observer.disconnect(); }
    }, { rootMargin: "400px 0px" });
    observer.observe(element.current);
    return () => observer.disconnect();
  }, [ready]);
  return <section ref={element} id={id} aria-labelledby={id + "-title"} className="charts-explorer chart-panel">
    <header className="chart-panel-intro"><h3 id={id + "-title"}>{title}</h3><p>{lead}</p></header>
    <div className="charts-stage">{ready ? children : <div className="chart-awaiting" style={{ minHeight: height }} aria-hidden="true"><span /></div>}</div>
    <footer className="charts-panel-footer">{source}</footer>
  </section>;
}

function MapPreview({ kind }: { kind: string }) {
  return <svg className="chart-map-preview" viewBox="0 0 240 70" fill="none" aria-hidden="true">
    {kind === "references" && <>{[30, 46, 68, 92, 115, 142, 165, 196].map((end, i) => <path key={end} d={"M 8 59 Q " + (end / 2 + 8) + " " + (52 - i * 9) + " " + (end + 25) + " 59"} stroke="currentColor" opacity={.2 + i * .09} />)}<path d="M8 64H231" stroke="currentColor" strokeWidth="4" opacity=".7" /></>}
    {kind === "structure" && <>{Array.from({ length: 48 }, (_, i) => <rect key={i} x={8 + i % 16 * 14} y={12 + Math.floor(i / 16) * 17} width="10" height="12" rx="2" fill="currentColor" opacity={.2 + (i % 7) * .1} />)}</>}
    {kind === "words" && <>{[12, 20, 17, 43, 34, 54, 31, 22, 42, 59, 48, 15, 28, 39, 20, 9].map((height, i) => <rect key={i} x={8 + i * 14} y={64 - height} width="10" height={height} rx="2" fill="currentColor" opacity={.25 + height / 90} />)}</>}
    {kind === "versions" && <><path d="M8 48H230" stroke="currentColor" opacity=".4" />{[20, 67, 109, 157, 191, 219].map((x, i) => <g key={x}><path d={"M" + x + " 48V" + (i % 2 ? 18 : 32)} stroke="currentColor" /><circle cx={x} cy={i % 2 ? 18 : 32} r="4" fill="currentColor" opacity={.4 + i * .1} /></g>)}</>}
  </svg>;
}

export default function ChartsPage() {
  const catalog = useCatalog();
  const stats = useAsync(loadStats, "stats");
  const location = useLocation();
  const [section, setSection] = useState<SectionFilter>("");
  const routeSlug = location.pathname.split("/")[2];
  const standalone = !!routeSlug;
  const requested = new URLSearchParams(location.search).get("collection") ?? location.hash.slice(1);
  const active = AREAS.find((area) => standalone ? area.slug === routeSlug : area.id === requested || area.charts.some((chart) => chart.id === requested)) ?? AREAS[0];
  const shown = (id: string) => standalone && active.id === id;
  const standaloneLink = (area: (typeof AREAS)[number]) => "/charts/" + area.slug;
  const canon = stats.status === "ready" ? stats.value.books.filter((b) => b.section !== "apocrypha") : null;
  useLayoutEffect(() => {
    const target = location.hash.slice(1);
    if (target) (document.getElementById(target) ?? (target === "speech" ? document.getElementById("jesus") : null))?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [location.hash, stats.status, active.id]);
  const structureFilters = <SectionFilters value={section} onChange={setSection} />;
  const source = <a href="https://www.openbible.info/labs/cross-references/" target="_blank" rel="noreferrer">OpenBible.info ↗</a>;
  const Heading = "h1";
  const collectionCards = <nav className="chart-collection-cards" aria-label="Chart collections">{AREAS.map((area) => <Link key={area.id} to={standaloneLink(area)} className="chart-collection-card" aria-current={standalone && active.id === area.id ? "page" : undefined} style={{ "--chart-color": "var(--" + area.color + ")" } as CSSProperties}>
    <span className="chart-collection-name"><area.icon size={17} aria-hidden="true" />{area.label}</span><span className="chart-collection-lens">{area.lens}</span><MapPreview kind={area.id} />
  </Link>)}</nav>;
  const collectionTools = <aside className="chart-discovery-guide" style={{ "--chart-color": "var(--" + active.color + ")" } as CSSProperties}><span>What you can discover</span><ul>{active.discover.map((item) => <li key={item}><ArrowRight size={13} aria-hidden="true" />{item}</li>)}</ul></aside>;
  if (!standalone && requested && requested !== "chart-map") return <Navigate replace to={standaloneLink(active) + (active.charts.some((chart) => chart.id === location.hash.slice(1)) ? location.hash : "")} />;
  return <div className="charts-hub charts-open mx-auto max-w-7xl px-4 sm:px-6">
    {!standalone && <><header className="charts-intro">
      <div><p className="charts-eyebrow"><span /> A map for reading</p><h1>See Scripture <em>differently.</em></h1><p className="charts-intro-copy">Follow a connection. Understand a book. Hear a teaching. Know the edition in your hands.</p></div>
      <dl className="charts-numbers"><div><dt>books · KJV canon</dt><dd>{canon ? canon.length : "—"}</dd></div><div><dt>chapters</dt><dd>{canon ? formatNumber(canon.reduce((n, b) => n + b.chapters.length, 0)) : "—"}</dd></div><div><dt>versions</dt><dd>{catalog.translations.length}</dd></div></dl>
    </header>
    <section className="charts-map" aria-labelledby="charts-map-title" id="chart-map">
      <div className="charts-map-heading"><div><h2 id="charts-map-title">Four perspectives. One library.</h2><p>Explore the connections between passages, the shape of the books, the words of Jesus, and the editions that carry the text. Choose a collection to begin.</p></div></div>
      {collectionCards}
    </section></>}
    {standalone && <div className="chart-collection-breadcrumb"><Link to="/charts">Charts</Link><span>/</span><strong>{active.label}</strong></div>}
    {standalone && collectionCards}
    {shown("references") && <section hidden={active.id !== "references"} id="references" aria-labelledby="references-title" className="chart-area" style={{ "--chart-color": "var(--poetry)" } as CSSProperties}>
      <header className="chart-area-heading"><div><p className="charts-panel-kicker">Connections · References</p><Heading id="references-title">Scripture in conversation.</Heading><p>The arc view gives you the sweep across chapters; the book matrix reveals which books point to one another. Read both as invitations to examine the linked passages in context.</p></div><Network aria-hidden="true" /></header>
      {active.id === "references" && collectionTools}
      <ChartPanel id="arcs" title="Cross-reference arcs" lead="Every arc joins two chapters in the existing cross-reference set. Light up a book to follow its part in the wider web." source={<><span>Cross-references between different chapters</span>{source}</>}><ArcsView /></ChartPanel>
      <ChartPanel id="matrix" title="Book to book" lead="Move from the sweep of the arcs to individual pairs. Inspect the grid or choose from the ranked list; a direction means one book points to the other." source={<><span>Rows: from · Columns: to · Stronger colour: more references · Genesis → Revelation</span>{source}</>}><MatrixView /></ChartPanel>
    </section>}
    {shown("structure") && <section hidden={active.id !== "structure"} id="structure" aria-labelledby="structure-title" className="chart-area" style={{ "--chart-color": "var(--history)" } as CSSProperties}>
      <header className="chart-area-heading"><div><p className="charts-panel-kicker">Composition · Bible structure</p><Heading id="structure-title">The whole, the books, the chapters.</Heading><p>Begin with the sections and literary forms, compare the lengths of their books, then find a numbered chapter. Section selections carry through all three charts.</p></div><BookOpen aria-hidden="true" /></header>
      {active.id === "structure" && collectionTools}
      <ChartPanel id="sections" title="Sections & measures" lead="How does the balance change when you count books, chapters, words or entries in the study collection? Choose a measure, then follow its evidence." source={<span>KJV text measures · Study selections explain their sources and counting rules.</span>} height={850}>
        {structureFilters}<SectionGuide section={section} /><Result state={stats}>{(data) => <SectionDonut stats={data} section={section} onSection={setSection} />}</Result>
      </ChartPanel>
      <ChartPanel id="sizes" title="Book lengths" lead="Books occupy very different amounts of space. Compare words, verses or chapters, in Bible order or with the longest first." source={<span>KJV text · Every bar opens its book in the reader.</span>} height={1400}>
        {structureFilters}<Result state={stats}>{(data) => <BookSizes stats={data} section={section} />}</Result>
      </ChartPanel>
      <ChartPanel id="chapters" title="Chapter atlas" lead="One numbered tile is one chapter. Its colour shows its section and its depth shows the word count. Open a tile to read." source={<span>KJV text · Chapter divisions are reading aids; depth of colour measures words.</span>} height={2400}>
        {structureFilters}<SectionGuide section={section} /><Result state={stats}>{(data) => <ChapterGrid key={section} stats={data} section={section} />}</Result>
      </ChartPanel>
    </section>}
    {shown("words") && <section hidden={active.id !== "words"} id="words" aria-labelledby="words-title" className="chart-area" style={{ "--chart-color": "var(--revelation)" } as CSSProperties}>
      <header className="chart-area-heading"><div><p className="charts-panel-kicker">Voice & teaching · Words of Jesus</p><Heading id="words-title">Hear the words. Follow the life.</Heading><p>A count can show where Jesus speaks; reading the passages shows what he teaches. Put the Gospel accounts alongside one another, then use the speech atlas to find chapters to linger in.</p></div><Quote aria-hidden="true" /></header>
      {active.id === "words" && collectionTools}
      <ChartPanel id="jesus" title="Teaching journeys & the speech atlas" lead="Read a teaching in its Gospel setting, compare parallel accounts, and explore the numbered chapter charts below." source={<span>KJV previews and red-letter markup · Teaching passages include their narrative setting.</span>} height={1700}><Result state={stats}>{(data) => <WordsOfJesus stats={data} />}</Result></ChartPanel>
    </section>}
    {shown("versions") && <section hidden={active.id !== "versions"} id="versions" aria-labelledby="versions-title" className="chart-area" style={{ "--chart-color": "var(--acts)" } as CSSProperties}>
      <header className="chart-area-heading"><div><p className="charts-panel-kicker">Editions & contents · Versions</p><Heading id="versions-title">Know the edition you are reading.</Heading><p>These charts describe the library in your hands. Edition dates place its texts in time; coverage shows which books each edition actually includes.</p></div><Layers aria-hidden="true" /></header>
      {active.id === "versions" && collectionTools}
      <ChartPanel id="timeline" title="Versions through time" lead="Find an edition by its recorded year. The dates belong to these editions, rather than the ancient composition of the biblical books." source={<span>Edition years from the version catalogue.</span>}><VersionsTimeline /></ChartPanel>
      <ChartPanel id="coverage" title="Version coverage" lead="See the Old Testament, New Testament and Apocrypha included in each edition. Inspect a book or filter the version groups." source={<span>Coverage from each version's actual book list.</span>} height={1100}><CoverageMatrix /></ChartPanel>
    </section>}
    {standalone && <Link to="/charts" className="chart-back-map">Return to all chart collections ↑</Link>}
  </div>;
}
