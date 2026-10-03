import { ArcDiagram } from "@/components/charts/ArcDiagram";
import { BookMatrix } from "@/components/charts/BookMatrix";
import { BookSizes } from "@/components/charts/BookSizes";
import { ChapterGrid } from "@/components/charts/ChapterGrid";
import { ChartCard, Loading } from "@/components/charts/ChartCard";
import { CoverageMatrix } from "@/components/charts/CoverageMatrix";
import { SectionDonut } from "@/components/charts/SectionDonut";
import { VersionsTimeline } from "@/components/charts/VersionsTimeline";
import { WordsOfJesus } from "@/components/charts/WordsOfJesus";
import { loadArcs, loadBookPairs, loadStats } from "@/lib/data";
import { useAsync } from "@/lib/useAsync";

const JUMPS = [
  ["arcs", "Cross-reference arcs"],
  ["matrix", "Book to book"],
  ["sections", "The seven sections"],
  ["sizes", "Book sizes"],
  ["chapters", "Every chapter"],
  ["jesus", "Words of Jesus"],
  ["timeline", "Versions through time"],
  ["coverage", "Which version has which book"],
] as const;

export default function ChartsPage() {
  const stats = useAsync(loadStats, "stats");
  const arcs = useAsync(loadArcs, "arcs");
  const pairs = useAsync(loadBookPairs, "pairs");

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <header className="pb-6 pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Charts</p>
        <h1 className="mt-1 max-w-3xl font-serif text-4xl font-semibold tracking-tight sm:text-5xl">The Bible, measured and drawn.</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Sizes and red letters are counted from the King James Version's own markup. Cross-references are OpenBible.info's open, reader-voted set — shown as
          they are, with nothing added.
        </p>
        <nav aria-label="Charts on this page" className="mt-5 flex flex-wrap gap-1.5">
          {JUMPS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="rounded-full border border-line px-3 py-1 text-sm hover:bg-surface-2">
              {label}
            </a>
          ))}
        </nav>
      </header>
      <div className="space-y-6">
        <ChartCard id="arcs" title="Every cross-reference, as an arc" lead="All 1,189 chapters run along the bottom. Each arc joins two chapters that cross-reference each other — 340,000 links in one picture.">
          {arcs.status === "ready" ? <ArcDiagram data={arcs.value} /> : <Loading height={420} />}
        </ChartCard>
        <ChartCard id="matrix" title="Book to book" lead="How often each book points to each other book.">
          {pairs.status === "ready" ? <BookMatrix pairs={pairs.value} /> : <Loading height={420} />}
        </ChartCard>
        <ChartCard id="sections" title="The seven sections" lead="The reading chart's colour bands, by share of the Bible's words.">
          {stats.status === "ready" ? <SectionDonut stats={stats.value} /> : <Loading />}
        </ChartCard>
        <ChartCard id="sizes" title="How long is each book?" lead="Every book in order, by words, verses or chapters. Click a book to read it.">
          {stats.status === "ready" ? <BookSizes stats={stats.value} /> : <Loading height={480} />}
        </ChartCard>
        <ChartCard id="chapters" title="Every chapter of the Bible" lead="One square per chapter, one row per book. The deeper the colour, the longer the chapter.">
          {stats.status === "ready" ? <ChapterGrid stats={stats.value} /> : <Loading height={600} />}
        </ChartCard>
        <ChartCard id="jesus" title="The words of Jesus" lead="The red letters: how much of each chapter of the Gospels is Jesus speaking.">
          {stats.status === "ready" ? <WordsOfJesus stats={stats.value} /> : <Loading height={420} />}
        </ChartCard>
        <ChartCard id="timeline" title="The versions through time" lead="Every text on this site, placed at the year of the edition it carries. Click one to read it.">
          <VersionsTimeline />
        </ChartCard>
        <ChartCard id="coverage" title="Which version has which book" lead="Some versions are Old or New Testament only; some carry the Apocrypha.">
          <CoverageMatrix />
        </ChartCard>
      </div>
    </div>
  );
}
