import { ArrowRight, BookOpen, Search } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { GOSPEL_PORTRAITS, PORTRAIT_GOSPELS } from "@/data/gospel-portraits";
import { gospelOrder, matchingPortraitEvents, passagePosition, passageVerseCount, portraitEvents, type PortraitEvent } from "@/lib/gospel-portraits";
import { loadHarmony, shortRange, type Span } from "@/lib/study";
import { splitId } from "@/lib/refs";
import type { Stats } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { PassageText, RefLink } from "./StudyParts";
import "./gospel-portraits.css";

const palette = (color: string) => ({ "--portrait-color": color }) as CSSProperties;

export function GospelPortraits({ stats }: { stats: Stats }) {
  const harmony = useAsync(loadHarmony, "harmony");
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"all" | "four" | "one">("all");
  const [limit, setLimit] = useState(6);
  const events = useMemo(() => harmony.status === "ready" ? portraitEvents(harmony.value) : [], [harmony]);
  const selected = events.find((event) => event.n === params.get("portrait")) ?? events.find((event) => event.n === "72");
  const guide = GOSPEL_PORTRAITS.find((item) => item.event === selected?.n);
  const results = useMemo(() => matchingPortraitEvents(events, query, scope), [events, query, scope]);
  const pick = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("portrait", id);
    setParams(next, { replace: true, preventScrollReset: true });
  };

  if (harmony.status === "loading") return <p className="p-6 text-muted" role="status">Loading the Gospel portraits…</p>;
  if (harmony.status === "error" || !selected) return <p className="p-6 text-muted" role="alert">The Gospel portraits could not be loaded. Please reload to try again.</p>;

  return <div className="gospel-portraits">
    <div className="portrait-guides" role="group" aria-label="Eight guided Gospel comparisons">
      {GOSPEL_PORTRAITS.map((item, i) => <button key={item.event} type="button" aria-pressed={selected.n === item.event} onClick={() => pick(item.event)}>
        <span>{String(i + 1).padStart(2, "0")}</span>{item.title}
      </button>)}
    </div>

    <header className="portrait-question">
      <div><p className="portrait-eyebrow">{guide ? "A closer reading" : "From the complete harmony"} · §{selected.n}</p>
        <h3>{guide?.question ?? selected.title}</h3>
        <p>{guide?.invitation ?? "Follow this entry through the Gospels that Robertson groups together. Compare its place in each narrative, then read the passages and the chapter around them."}</p>
      </div>
      <span className="portrait-account-count"><strong>{PORTRAIT_GOSPELS.filter((g) => selected.refs[g.key]?.length).length}</strong><span>Gospel accounts<br />in this entry</span></span>
    </header>

    <figure className="portrait-map" aria-labelledby="portrait-map-title" aria-describedby="portrait-map-method">
      <div className="portrait-map-heading"><h4 id="portrait-map-title">Where it falls in each Gospel</h4><span>Beginning <ArrowRight size={13} aria-hidden /> End</span></div>
      {PORTRAIT_GOSPELS.map((gospel) => {
        const book = stats.books.find((b) => b.code === gospel.key)!;
        const spans = selected.refs[gospel.key] ?? [];
        const ordered = gospelOrder(events, gospel.key);
        const chapters = book.chapters.length;
        return <div key={gospel.key} className="portrait-lane" style={palette(gospel.color)}>
          <div className="portrait-lane-name"><strong>{gospel.name}</strong><span>{spans.length ? spans.map(shortRange).join("; ") : "Not grouped here"}</span></div>
          <div className="portrait-track">
            <svg viewBox="0 0 1000 40" preserveAspectRatio="none" role="img" aria-label={`${gospel.name}: ${spans.length ? spans.map(shortRange).join("; ") : "no passage in this harmony entry"}`}>
              <path d="M0 20H1000" className="portrait-baseline" />
              {ordered.flatMap((event) => event.refs[gospel.key]!.map((span, i) => {
                const p = passagePosition(span, book);
                return <rect key={`${event.n}-${i}`} x={p.start * 1000} y={12 + i % 2 * 9} width={Math.max(.8, (p.end - p.start) * 1000)} height="7" rx="1" className="portrait-trace" />;
              }))}
              {spans.map((span) => {
                const p = passagePosition(span, book);
                return <g key={span.join("-")}><rect x={p.start * 1000} y="8" width={Math.max(2, (p.end - p.start) * 1000)} height="25" rx="2" className="portrait-highlight" /><path d={`M${(p.start + p.end) * 500} 1v36`} className="portrait-marker" /></g>;
              })}
            </svg>
            <div className="portrait-ticks"><span>1:1</span><span>{book.verses.toLocaleString("en-US")} verses</span><span>{chapters}:{book.chapters[chapters - 1][0]}</span></div>
          </div>
        </div>;
      })}
      <figcaption id="portrait-map-method">Each line is a whole Gospel, scaled by its KJV verse count. The bright marks locate this entry; faint marks show other harmony passages. Position follows the written account, not elapsed time.</figcaption>
    </figure>

    <div className="portrait-comparison-heading"><h4>Read the accounts in their setting</h4><span>KJV passages · {guide ? "Original reading notes" : "Robertson’s passage groupings"}</span></div>
    <div className="portrait-accounts">
      {PORTRAIT_GOSPELS.map((gospel) => {
        const spans = selected.refs[gospel.key] ?? [];
        const book = stats.books.find((b) => b.code === gospel.key)!;
        const ordered = gospelOrder(events, gospel.key);
        const index = ordered.findIndex((item) => item.n === selected.n);
        const previous = index > 0 ? ordered[index - 1] : undefined;
        const following = index >= 0 ? ordered[index + 1] : undefined;
        return <section key={gospel.key} className="portrait-account" style={palette(gospel.color)} aria-label={`${gospel.name} account`}>
          <header><h5>{gospel.name}</h5>{spans.length > 0 && <span>{passageVerseCount(spans, book)} verses</span>}</header>
          {spans.length ? <>
            {spans.map((span) => <div className="portrait-passage" key={span.join("-")}>
              <RefLink span={span} label={shortRange(span)} className="portrait-reference" />
              <PassageText span={span} max={12} />
            </div>)}
            {guide?.observations[gospel.key] && <p className="portrait-observation"><strong>Notice</strong>{guide.observations[gospel.key]}</p>}
            <Link className="portrait-context" to={`/read/kjv/${gospel.key}/${splitId(spans[0][0]).chapter}`}><BookOpen size={14} aria-hidden />Read the chapter in context <ArrowRight size={13} aria-hidden /></Link>
            <div className="portrait-neighbours"><p>Nearby in this Gospel’s order</p>
              {previous && <Neighbour label="Before" event={previous} spans={previous.refs[gospel.key]!} onPick={pick} />}
              {following && <Neighbour label="After" event={following} spans={following.refs[gospel.key]!} onPick={pick} />}
            </div>
          </> : <div className="portrait-absent"><span aria-hidden>—</span><p>Robertson groups no passage from {gospel.name} with this entry.</p><p>This describes the harmony’s selection; it is not a claim that the Gospel has nothing related to say.</p></div>}
        </section>;
      })}
    </div>

    <section className="portrait-browser" aria-labelledby="portrait-browser-title">
      <header><div><p className="portrait-eyebrow">Keep exploring</p><h4 id="portrait-browser-title">Explore {matchingPortraitEvents(events, "", "all").length} Gospel entries</h4></div>
        <Link to="#harmony">Open the complete harmony <ArrowRight size={14} aria-hidden /></Link></header>
      <label className="portrait-search"><Search size={17} aria-hidden /><span className="sr-only">Search Gospel portrait entries</span><input type="search" value={query} placeholder="Search an event or harmony number…" onChange={(e) => { setQuery(e.target.value); setLimit(6); }} /></label>
      <div className="portrait-filters" role="group" aria-label="Filter harmony entries by Gospel coverage">
        {([['all', 'All accounts'], ['four', 'In all four'], ['one', 'In one Gospel']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={scope === value} onClick={() => { setScope(value); setLimit(6); }}>{label}</button>)}
        <span role="status">{results.length} entries</span>
      </div>
      <ol className="portrait-results">{results.slice(0, limit).map((event) => <li key={event.n}><button type="button" aria-pressed={selected.n === event.n} onClick={() => pick(event.n)}><span>§{event.n}</span><strong>{event.title}</strong><span>{PORTRAIT_GOSPELS.filter((g) => event.refs[g.key]).map((g) => g.name).join(" · ")}</span><ArrowRight size={15} aria-hidden /></button></li>)}</ol>
      {!results.length && <p className="portrait-empty">No entry matches. Try another word or choose All accounts.</p>}
      {limit < results.length && <button className="portrait-more" type="button" onClick={() => setLimit(limit + 12)}>Show more entries ({results.length - limit} remaining)</button>}
      <p className="portrait-selection" aria-live="polite">Comparing: {guide?.title ?? selected.title}. The map and accounts above update together.</p>
    </section>
    <p className="portrait-method">Passage boundaries and groupings: <a href="https://www.gutenberg.org/ebooks/36264" target="_blank" rel="noreferrer">A. T. Robertson, <cite>A Harmony of the Gospels</cite> (1922)</a>. The eight guided comparisons are this site’s observations on the cited texts. Verse counts measure the selected passages, not importance. Nearby entries are sorted by their first verse and may overlap.</p>
  </div>;
}

function Neighbour({ label, event, spans, onPick }: { label: string; event: PortraitEvent; spans: Span[]; onPick: (id: string) => void }) {
  return <button type="button" onClick={() => onPick(event.n)}><span>{label} · {spans.map(shortRange).join("; ")}</span><strong>{event.title}</strong></button>;
}
