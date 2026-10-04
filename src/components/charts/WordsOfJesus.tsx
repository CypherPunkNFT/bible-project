import { useState } from "react";
import { Link } from "react-router-dom";
import { PassageText, RefLink } from "@/components/study/StudyParts";
import { TEACHINGS } from "@/data/chart-insights";
import { useCatalog } from "@/lib/catalog";
import { formatRange } from "@/lib/refs";
import type { Stats } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export function WordsOfJesus({ stats }: { stats: Stats }) {
  const [mode, setMode] = useState("teaching");
  const [selected, setSelected] = useState(0);
  const teaching = TEACHINGS[selected];
  const catalog = useCatalog();
  return <div className="jesus-explorer">
    <div className="chart-segmented" role="group" aria-label="Words of Jesus views"><button type="button" aria-pressed={mode === "teaching"} onClick={() => setMode("teaching")}>Teaching journeys</button><button type="button" aria-pressed={mode === "chapters"} onClick={() => setMode("chapters")}>Where he speaks</button></div>
    {mode === "teaching" ? <>
      <div className="teaching-paths" role="group" aria-label="Choose a teaching">
        {TEACHINGS.map((t, i) => <button key={t.theme} type="button" aria-pressed={selected === i} onClick={() => setSelected(i)}><span>{t.theme}</span><strong>{t.title}</strong></button>)}
      </div>
      <article className="teaching-focus" aria-live="polite">
        <header><span className="charts-panel-kicker">{teaching.theme}</span><h3>{teaching.title}</h3><p>{teaching.invitation}</p></header>
        <div className="teaching-passages">{teaching.refs.map((span) => <section key={span[0]}><h4>{formatRange(catalog, span[0], span[1])}</h4><div className="teaching-scripture"><PassageText key={span[0]} span={span} max={4} /></div><RefLink span={span} label="Read the whole passage →" /></section>)}</div>
        <div className="teaching-notice"><h4>Look closer</h4><p>{teaching.notice}</p></div>
      </article>
      <p className="chart-measure-note">A selection of teaching passages, read in their Gospel settings. Previews use the KJV; passages include the narrator's words as well as Jesus' speech.</p>
      <Link to="/study/harmony" className="teaching-harmony-link">Follow the whole life of Jesus in the Gospel harmony →</Link>
    </> : <SpeechAtlas stats={stats} />}
  </div>;
}

function SpeechAtlas({ stats }: { stats: Stats }) {
  const [gospel, setGospel] = useState("");
  const [metric, setMetric] = useState("share");
  const [hover, setHover] = useState("");
  const withRed = stats.books.filter((b) => b.red > 0);
  const total = withRed.reduce((n, b) => n + b.red, 0);
  const gospels = stats.books.filter((b) => ["MAT", "MRK", "LUK", "JHN"].includes(b.code));
  const visible = gospels.filter((b) => !gospel || b.code === gospel);
  const chapters = visible.flatMap((b) => b.chapters.map(([, words, red], i) => ({ book: b, chapter: i + 1, words, red })));
  const max = Math.max(1, ...chapters.map((c) => c.red));
  const ranked = [...chapters].filter((c) => c.red > 0).sort((a, b) => b.red - a.red).slice(0, 5);
  return <>
    <div className="chart-controls"><div className="chart-segmented" role="group" aria-label="Choose a Gospel"><button type="button" aria-pressed={!gospel} onClick={() => { setGospel(""); setHover(""); }}>All four</button>{gospels.map((b) => <button key={b.code} type="button" aria-pressed={gospel === b.code} onClick={() => { setGospel(b.code); setHover(""); }}>{b.name}</button>)}</div>
      <div className="chart-segmented" role="group" aria-label="Measure Jesus' speech"><button type="button" aria-pressed={metric === "share"} onClick={() => setMetric("share")}>Share of chapter</button><button type="button" aria-pressed={metric === "words"} onClick={() => setMetric("words")}>Number of words</button></div>
    </div>
    <div className="measure-insight"><div><span>Words in red · whole KJV</span><strong>{formatNumber(total)}</strong><small>across {withRed.length} books</small></div><p>Long teaching discourses and short encounters leave different shapes. Compare a chapter's share of speech with its word count, then read the surrounding story.</p></div>
    <p className="chart-live-detail" aria-live="polite">{hover || "Each numbered bar is a chapter. Select it to read the words in context."}</p>
    <p className="chart-hint speech-scroll-hint">Scroll each chart sideways to see every numbered chapter →</p>
    <div className="speech-layout"><div className="speech-books">
      {visible.map((b) => <section key={b.code}><div className="speech-book-title"><h3>{b.name}</h3><span>{formatNumber(b.red)} words in red · {Math.round(b.red / b.words * 100)}% of the book</span></div>
        <div className="speech-bars">{b.chapters.map(([, words, red], i) => <Link key={i} to={"/read/kjv/" + b.code + "/" + (i + 1)} aria-label={b.name + " " + (i + 1) + ": " + formatNumber(red) + " words of Jesus"} onMouseEnter={() => setHover(b.name + " " + (i + 1) + " · " + formatNumber(red) + " words in red · " + Math.round(red / Math.max(1, words) * 100) + "% of the chapter")} onFocus={() => setHover(b.name + " " + (i + 1) + " · " + formatNumber(red) + " words in red · " + Math.round(red / Math.max(1, words) * 100) + "% of the chapter")}>
          <span className="speech-bar-track"><i style={{ height: (metric === "share" ? red / Math.max(1, words) * 100 : red / max * 100) + "%" }} /></span><span>{i + 1}</span>
        </Link>)}</div>
      </section>)}
      <p className="chart-hint">{metric === "share" ? "Full height = 100% of a chapter's words." : "Full height = " + formatNumber(max) + " words, using the same scale for all visible books."} The KJV edition supplies the red-letter boundaries.</p>
    </div><aside className="speech-ranking"><h3>Linger in a longer teaching</h3><p>Chapters with the most red-letter words in this selection.</p><ol>{ranked.map((c) => <li key={c.book.code + c.chapter}><Link to={"/read/kjv/" + c.book.code + "/" + c.chapter}><strong>{c.book.name} {c.chapter}</strong><span>{formatNumber(c.red)} words →</span></Link></li>)}</ol><h4>Beyond the four Gospels</h4>{withRed.filter((b) => !gospels.includes(b)).map((b) => <Link key={b.code} to={"/read/kjv/" + b.code + "/" + (b.chapters.findIndex((c) => c[2] > 0) + 1)}>{b.name} <span>{formatNumber(b.red)} words →</span></Link>)}</aside></div>
  </>;
}
