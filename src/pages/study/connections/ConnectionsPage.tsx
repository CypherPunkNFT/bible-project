import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { ArcDiagram } from "@/components/charts/ArcDiagram";
import { Loading } from "@/components/charts/ChartCard";
import { StudyBackLink } from "@/components/study/StudyBackLink";
import { useCatalog } from "@/lib/catalog";
import { loadArcs, loadBookPairs } from "@/lib/data";
import { useAsync, type AsyncState } from "@/lib/useAsync";
import { formatNumber } from "@/lib/utils";
import { BookAtlas, BookAtlasButton } from "./BookAtlas";
import { BookConversation } from "./BookConversation";
import "@/pages/charts.css";
import "./connections.css";

const SOURCE = "https://www.openbible.info/labs/cross-references/";

function Result<T>({ state, children }: { state: AsyncState<T>; children: (value: T) => ReactNode }) {
  if (state.status === "loading") return <Loading />;
  if (state.status === "error") return <div className="charts-error" role="alert"><p>This chart could not be loaded.</p><button type="button" onClick={() => window.location.reload()}>Try again</button></div>;
  return <>{children(state.value)}</>;
}

/** Connections in Scripture as one page: the arcs, then book to book, both led by one lit book that the matrix
 *  emblem's book atlas (or a click on the arcs) chooses. */
export default function ConnectionsPage() {
  const catalog = useCatalog();
  const arcs = useAsync(loadArcs, "arcs");
  const pairs = useAsync(loadBookPairs, "pairs");
  const [book, setBook] = useState("");
  const [atlasOpen, setAtlasOpen] = useState(false);
  const books = useMemo(() => catalog.books.filter((b) => b.num <= 66), [catalog.books]);
  const lit = books.find((b) => b.code === book);

  // Each book's cross-references with other books, both directions, for the atlas's fine lines.
  const totals = useMemo(() => {
    const map = new Map<string, number>();
    if (pairs.status !== "ready") return map;
    for (const [a, b, n] of pairs.value) if (a !== b) { map.set(a, (map.get(a) ?? 0) + n); map.set(b, (map.get(b) ?? 0) + n); }
    return map;
  }, [pairs]);
  const figures = useMemo(() => {
    const links = arcs.status === "ready" ? arcs.value.arcs.reduce((sum, edge) => sum + edge[2], 0) : 0;
    const chapters = arcs.status === "ready" ? arcs.value.chapters.length : 0;
    const joined = pairs.status === "ready" ? pairs.value.filter(([a, b, n]) => a !== b && n > 0).length : 0;
    return [[links, "cross-references between chapters"], [chapters, "chapters"], [books.length, "books"], [joined, "book pairs in conversation"]] as const;
  }, [arcs, pairs, books.length]);
  const atlasButton = <BookAtlasButton book={lit} onOpen={() => setAtlasOpen(true)} />;

  return <div className="cx-page charts-hub mx-auto max-w-7xl px-4 sm:px-6" style={{ "--chart-color": "var(--poetry)" } as CSSProperties}>
    <div className="chart-collection-breadcrumb"><StudyBackLink /><strong>Connections in Scripture</strong></div>

    <header className="cx-hero">
      <p className="cx-words">Cross-references · Book to book · Passages in conversation</p>
      <h1>Scripture in <em>conversation</em>.</h1>
      <p className="cx-lead">Every arc joins two chapters that point to one another. Light up a book to see its part in the whole, then follow it into the books it speaks with most, and read the linked passages in context.</p>
      <dl className="cx-figures">{figures.map(([value, label]) => <div key={label}><dt>{label}</dt><dd>{value ? formatNumber(value) : "—"}</dd></div>)}</dl>
    </header>

    <section className="cx-arcs" aria-labelledby="cx-arcs-title">
      <h2 id="cx-arcs-title" className="sr-only">Cross-reference arcs</h2>
      <Result state={arcs}>{(data) => <ArcDiagram data={data} focus={book} onFocusChange={setBook} picker={atlasButton} />}</Result>
    </section>

    <section className="cx-books" aria-labelledby="cx-books-title">
      <header className="cx-section-head">
        <p className="cx-words">Book to book</p>
        <h2 id="cx-books-title">{lit ? <>Who <em>{lit.name}</em> speaks with.</> : <>Which books <em>speak to each other</em>.</>}</h2>
      </header>
      <Result state={pairs}>{(data) => <BookConversation books={books} pairs={data} book={book} />}</Result>
    </section>

    <footer className="cx-source"><span>Cross-references from the OpenBible.info dataset, between different chapters and books</span><a href={SOURCE} target="_blank" rel="noreferrer">OpenBible.info ↗</a></footer>
    {atlasOpen && <BookAtlas books={books} totals={totals} selected={book} onChoose={setBook} onClose={() => setAtlasOpen(false)} />}
  </div>;
}
