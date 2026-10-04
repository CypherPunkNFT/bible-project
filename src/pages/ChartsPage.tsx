import { ArrowRight, ArrowUp, BookOpen, Layers, Network, Quote } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArcDiagram } from "@/components/charts/ArcDiagram";
import { BookMatrix } from "@/components/charts/BookMatrix";
import { BookSizes } from "@/components/charts/BookSizes";
import { ChapterGrid } from "@/components/charts/ChapterGrid";
import { Loading } from "@/components/charts/ChartCard";
import { CoverageMatrix } from "@/components/charts/CoverageMatrix";
import { SectionDonut } from "@/components/charts/SectionDonut";
import { SectionFilters, SectionGuide, type SectionFilter } from "@/components/charts/SectionGuide";
import { VersionsTimeline } from "@/components/charts/VersionsTimeline";
import { SpeechAtlas, TeachingJourneys } from "@/components/charts/WordsOfJesus";
import { STUDY_SECTIONS } from "@/data/study-sections";
import { STUDY_COLLECTIONS, type StudyCollectionId } from "@/data/study-collections";
import { loadArcs, loadBookPairs, loadStats } from "@/lib/data";
import { useAsync, type AsyncState } from "@/lib/useAsync";
import "./charts.css";
import { StudyContents } from "@/components/study/StudyContents";
import HarmonyPage from "@/pages/study/HarmonyPage";

const AREAS = [
  { id: "references", slug: "references", discover: ["Follow a book's links across the canon","Compare the strongest book-to-book connections","Find passages to read together in context"], label: "References", lens: "Connections", icon: Network, color: "poetry", question: "How does one passage lead to another?", why: "A verse belongs to a wider conversation. Follow the links across chapters, then compare the connections between whole books.", charts: [{ id: "arcs", label: "Cross-reference arcs" }, { id: "matrix", label: "Book to book" }] },
  { id: "structure", slug: "structure", discover: ["Compare the Bible by nine different measures","See how literary forms shape your reading","Move from a section to a numbered chapter"], label: "Bible structure", lens: "Composition", icon: BookOpen, color: "history", question: "How does the whole fit together?", why: "The Bible is a collection of different books and literary forms. See its proportions, compare its books, and find your place among the chapters.", charts: [{ id: "sections", label: "Sections & measures" }, { id: "sizes", label: "Book lengths" }, { id: "chapters", label: "Chapter atlas" }] },
  { id: "words", slug: "words-of-jesus", discover: ["Read teaching within each Gospel's setting","Compare 185 events across the Gospel accounts","Locate longer discourses and shorter encounters"], label: "Words of Jesus", lens: "Voice & teaching", icon: Quote, color: "revelation", question: "What does Jesus say—and in what setting?", why: "Focus on his teaching within the Gospel stories. Read parallel accounts alongside one another, then see where his speech fills a chapter.", charts: [{ id: "jesus", label: "Teaching journeys" }, { id: "speech", label: "Where he speaks" }] },
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
  const location = useLocation();
  const collection = location.pathname.split("/")[2] as StudyCollectionId;
  const sections = STUDY_SECTIONS[collection];
  const position = sections.findIndex((item) => item.id === id);
  const element = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(() => window.location.hash === "#" + id || (id === "jesus" && window.location.hash === "#speech") || (id === "harmony" && window.location.hash.startsWith("#event-")) || (id === "arcs" && (!window.location.hash || window.location.hash === "#references")));
  useEffect(() => {
    if (ready || !element.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setReady(true); observer.disconnect(); }
    }, { rootMargin: "400px 0px" });
    observer.observe(element.current);
    return () => observer.disconnect();
  }, [ready]);
  useEffect(() => {
    if (location.hash === "#" + id || (id === "harmony" && location.hash.startsWith("#event-"))) setReady(true);
  }, [id, location.hash]);
  return <section ref={element} id={id} aria-labelledby={id + "-title"} className="charts-explorer chart-panel">
    <header className="chart-panel-intro"><div className="study-section-position"><span>{String(position + 1).padStart(2, "0")} / {String(sections.length).padStart(2, "0")} · {sections[position].kind}</span><Link to="#collection-contents">Back to contents <ArrowUp size={14} aria-hidden="true" /></Link></div><h2 id={id + "-title"}>{title}</h2><p>{lead}</p></header>
    <div className="charts-stage">{ready ? children : <div className="chart-awaiting" style={{ minHeight: height }} aria-hidden="true"><span /></div>}</div>
    <footer className="charts-panel-footer">{source}</footer>
  </section>;
}

export default function ChartsPage() {
  const stats = useAsync(loadStats, "stats");
  const location = useLocation();
  const [section, setSection] = useState<SectionFilter>("");
  const routeSlug = location.pathname.split("/")[2];
  const active = AREAS.find((area) => area.slug === (routeSlug === "gospels" ? "words-of-jesus" : routeSlug)) ?? AREAS[0];
  const shown = (id: string) => active.id === id;
  useLayoutEffect(() => {
    const target = location.hash.slice(1);
    if (target) (document.getElementById(target) ?? (target === "speech" ? document.getElementById("jesus") : target.startsWith("event-") ? document.getElementById("harmony") : null))?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [location.hash, stats.status, active.id]);
  const structureFilters = <SectionFilters value={section} onChange={setSection} />;
  const source = <a href="https://www.openbible.info/labs/cross-references/" target="_blank" rel="noreferrer">OpenBible.info ↗</a>;
  const Heading = "h1";
  const collection = STUDY_COLLECTIONS.find((item) => item.id === routeSlug)!;
  const collectionTools = <><aside className="chart-discovery-guide" style={{ "--chart-color": "var(--" + active.color + ")" } as CSSProperties}><span>What you can discover</span><ul>{active.discover.map((item) => <li key={item}><ArrowRight size={13} aria-hidden="true" />{item}</li>)}</ul></aside><StudyContents /></>;
  return <div className="charts-hub charts-open study-explorers mx-auto max-w-7xl px-4 sm:px-6">
    <div className="chart-collection-breadcrumb"><Link to="/study">Study</Link><span>/</span><strong>{collection.label}</strong></div>
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
      <header className="chart-area-heading"><div><p className="charts-panel-kicker">Life & teaching · Jesus & the Gospels</p><Heading id="words-title">Four accounts. One life.</Heading><p>Meet Jesus through the accounts of his life and the words of his teaching. Begin with a teaching in its Gospel setting, explore where he speaks, then compare events across Matthew, Mark, Luke and John.</p></div><Quote aria-hidden="true" /></header>
      {active.id === "words" && collectionTools}
      <ChartPanel id="jesus" title="Teaching journeys" lead="Read eight selected teachings in their Gospel setting, compare parallel accounts, and follow the passages into the reader." source={<span>KJV previews · Teaching passages include their narrative setting.</span>} height={850}><TeachingJourneys /></ChartPanel>
      <ChartPanel id="speech" title="Where he speaks" lead="See the shape of Jesus' speech across the Gospel chapters. Compare the share of a chapter with its red-letter word count, then read the surrounding story." source={<span>KJV red-letter markup · Chapter bars open their passages in the reader.</span>} height={850}><Result state={stats}>{(data) => <SpeechAtlas stats={data} />}</Result></ChartPanel>
      <ChartPanel id="harmony" title="Gospel harmony" lead="Follow 185 events through A. T. Robertson's fourteen parts. Open an event to read its accounts together; each Gospel retains its own voice and setting." source={<span>A. T. Robertson · 1922 · Gospel order follows this harmony, rather than an independently established chronology.</span>} height={700}><HarmonyPage embedded /></ChartPanel>
    </section>}
    {shown("versions") && <section hidden={active.id !== "versions"} id="versions" aria-labelledby="versions-title" className="chart-area" style={{ "--chart-color": "var(--acts)" } as CSSProperties}>
      <header className="chart-area-heading"><div><p className="charts-panel-kicker">Editions & contents · Versions</p><Heading id="versions-title">Know the edition you are reading.</Heading><p>Know the texts in your hands. Edition dates place the library in time; coverage shows which books each edition actually includes. The Library brings these editions together by language.</p></div><Layers aria-hidden="true" /></header>
      {active.id === "versions" && collectionTools}
      <ChartPanel id="timeline" title="Versions through time" lead="Find an edition by its recorded year. The dates belong to these editions, rather than the ancient composition of the biblical books." source={<span>Edition years from the version catalogue.</span>}><VersionsTimeline /></ChartPanel>
      <ChartPanel id="coverage" title="Version coverage" lead="See the Old Testament, New Testament and Apocrypha included in each edition. Inspect a book or filter the version groups." source={<span>Coverage from each version's actual book list.</span>} height={1100}><CoverageMatrix /></ChartPanel>
    </section>}
    {<Link to="/study" className="chart-back-map">Return to the Study collection ↑</Link>}
  </div>;
}
