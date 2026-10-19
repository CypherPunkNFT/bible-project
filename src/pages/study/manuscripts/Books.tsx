// "By book" (approved mock-up: js/books.js): the 66 books as tiles, darker where more records hold the book (scaled within
// each Testament). Choosing a book lists its copies oldest first, under the approved chapter grid: one square per chapter,
// darker where more records name it; choosing a chapter keeps only those copies. The list scrolls with the outside pill.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { OutsideScroll } from "@/components/OutsideScroll";
import type { MsRecord } from "@/lib/manuscripts";
import { useMs } from "./context";
import { byDate, formatNumber, holderText, isDated, kindOf, plural, sigla } from "./model";

const ABBR = ["Gen", "Exod", "Lev", "Num", "Deut", "Josh", "Judg", "Ruth", "1 Sam", "2 Sam", "1 Kgs", "2 Kgs", "1 Chr", "2 Chr", "Ezra", "Neh", "Esth", "Job", "Ps", "Prov", "Eccl", "Song", "Isa", "Jer", "Lam", "Ezek", "Dan", "Hos", "Joel", "Amos", "Obad", "Jonah", "Mic", "Nah", "Hab", "Zeph", "Hag", "Zech", "Mal",
  "Matt", "Mark", "Luke", "John", "Acts", "Rom", "1 Cor", "2 Cor", "Gal", "Eph", "Phil", "Col", "1 Thess", "2 Thess", "1 Tim", "2 Tim", "Titus", "Phlm", "Heb", "Jas", "1 Pet", "2 Pet", "1 John", "2 John", "3 John", "Jude", "Rev"];
const SEC: Record<string, string> = { history: "History", poetry: "Poetry & Wisdom", prophets: "Prophets", gospels: "Gospels & Acts", epistles: "Epistles", revelation: "Revelation" };
const VERSIONS = ["latin", "syriac", "coptic", "gothic", "armenian", "geez"];
const FILTERS: [string, string, (r: MsRecord) => boolean][] = [["all", "Every record", () => true], ["dss", "Dead Sea Scrolls", (r) => r.k === "dss"], ["hebrew", "Hebrew codices", (r) => r.k === "hebrew"],
  ["greek", "Greek New Testament", (r) => ["papyrus", "majuscule", "minuscule"].includes(r.k)], ["versions", "Early translations", (r) => VERSIONS.includes(r.k)]];
/** A star marks a book, chapter or copy that has an openly licensed picture. */
const Star = () => <span className="bk-star" title="Has a picture" aria-label="has a picture">★</span>;
const style = (vars: Record<string, string>) => vars as CSSProperties;

type Holding = MsRecord & { b: number[] };

export function Books() {
  const { index, openRecord } = useMs();
  const { books } = index.data;
  const holding = useMemo(() => index.data.records.filter((r): r is Holding => Boolean(r.b?.length)), [index]);
  const [filter, setFilter] = useState("all"), [book, setBook] = useState(42), [chapter, setChapter] = useState(0);
  const subset = useMemo(() => holding.filter(FILTERS.find((f) => f[0] === filter)![2]), [holding, filter]);

  const tiles = useMemo(() => {
    const n = new Array(66).fill(0), pictured = new Array(66).fill(0);
    for (const r of subset) for (const b of r.b) { n[b]++; if (r.im) pictured[b]++; }
    return { n, pictured, maxOT: Math.max(1, ...n.slice(0, 39)), maxNT: Math.max(1, ...n.slice(39)) };
  }, [subset]);
  const panel = useMemo(() => {
    const info = books[book], all = subset.filter((r) => r.b.includes(book)).sort(byDate);
    const withCh = all.filter((r) => r.ch?.[book]);
    const perCh = new Array(info.ch + 1).fill(0);
    for (const r of withCh) for (const c of r.ch![book]) perCh[c]++;
    const chPictured = new Set(withCh.filter((r) => r.im).flatMap((r) => r.ch![book]));
    const shown = chapter ? withCh.filter((r) => r.ch![book].includes(chapter)) : all;
    return { info, all, withCh, perCh, maxCh: Math.max(1, ...perCh), chPictured, shown, dated: all.filter(isDated).length };
  }, [books, subset, book, chapter]);

  // Wide screens: the panel is as tall as the book grids (at least 520 px), and its list scrolls inside.
  const grid = useRef<HTMLDivElement>(null), side = useRef<HTMLElement>(null);
  useEffect(() => {
    const g = grid.current, s = side.current;
    if (!g || !s) return;
    const observer = new ResizeObserver(() => { s.style.height = innerWidth > 960 ? `${Math.max(g.offsetHeight, 520)}px` : ""; });
    observer.observe(g);
    return () => observer.disconnect();
  }, []);

  const tile = (b: number) => {
    const n = tiles.n[b], k = n ? Math.sqrt(n / (b < 39 ? tiles.maxOT : tiles.maxNT)) : 0;
    return <button key={b} type="button" className={`bk-tile${n ? "" : " bk-zero"}`} aria-pressed={b === book} style={style({ "--tone": `var(--${books[b].sec})`, "--k": k.toFixed(3) })}
      title={`${books[b].name}: ${plural(n, "record")}`} onClick={() => { setBook(b); setChapter(0); }}>
      <b>{ABBR[b]}</b><small>{n ? formatNumber(n) : "–"}{tiles.pictured[b] > 0 && <span className="bk-pic" title={`${plural(tiles.pictured[b], "copy", "copies")} with a picture`}>★ {tiles.pictured[b]}</span>}</small></button>;
  };
  const { info, all, withCh, perCh, maxCh, chPictured, shown, dated } = panel;
  const cols = Math.min(info.ch, info.ch > 60 ? 15 : 10);

  return <>
    <div className="bk-filters" role="radiogroup" aria-label="Which records">{FILTERS.map(([k, label, test]) =>
      <button key={k} type="button" role="radio" aria-checked={k === filter} onClick={() => { setFilter(k); setChapter(0); }}>{label}<em>{formatNumber(holding.filter(test).length)}</em></button>)}</div>
    <div className="bk-layout">
      <div ref={grid} className="bk-grids"><p className="bk-t">Old Testament</p><div className="bk-grid">{Array.from({ length: 39 }, (_, b) => tile(b))}</div>
        <p className="bk-t">New Testament</p><div className="bk-grid">{Array.from({ length: 27 }, (_, i) => tile(i + 39))}</div>
        <p className="bk-key"><span className="bk-key-star"><span className="bk-star">★</span> copies with a picture</span><span>fewer</span><i /><i /><i /><i /><span>more</span><span className="bk-key-0"><b />none in the open data</span></p></div>
      <aside ref={side} className="bk-panel" style={style({ "--tone": `var(--${info.sec})` })}>
        <div className="bk-head"><p className="kicker">{SEC[info.sec]}</p><h3>{info.name}</h3><p>{plural(all.length, "record")} hold it{all.length ? `, ${formatNumber(dated)} with a date` : ""}.</p></div>
        <div className="bk-chapters">{withCh.length ? <>
          <div className="bk-ch" style={style({ "--cols": String(cols) })}>{Array.from({ length: info.ch }, (_, i) => i + 1).map((c) =>
            <button key={c} type="button" aria-pressed={c === chapter} style={style({ "--k": perCh[c] ? Math.sqrt(perCh[c] / maxCh).toFixed(3) : "0" })}
              title={`Chapter ${c}: ${plural(perCh[c], "record")} name it${chPictured.has(c) ? ", one with a picture" : ""}`} onClick={() => setChapter(chapter === c ? 0 : c)}>{c}{chPictured.has(c) && <Star />}</button>)}</div>
          <p className="bk-ch-note">{chapter ? <>Chapter {chapter}: {plural(shown.length, "record")} name it. <button type="button" onClick={() => setChapter(0)}>Show every copy</button></>
            : `${plural(withCh.length, "record")} name the chapters they hold, mostly fragments; the rest name only the book. Choose a chapter.`}</p>
        </> : <p className="bk-ch-note">{all.length ? "These records name the book, not its chapters." : ""}</p>}</div>
        <OutsideScroll className="bk-scroll" label={`Copies of ${info.name}`} resetKey={`${filter}-${book}-${chapter}`}>
          <ol className="bk-list">{shown.length ? shown.map((r) => <li key={r.i}><button type="button" data-open={r.i} style={style({ "--tone": `var(${kindOf(r.k).tone})` })} onClick={(e) => openRecord(r.i, e.currentTarget)}>
            <span className="bk-d">{r.d ?? "undated"}</span>
            <span className="bk-n"><b>{r.n}{r.im && <Star />}</b><small>{[sigla(r), kindOf(r.k).label, holderText(index, r) || r.f].filter(Boolean).join(" · ")}</small></span></button></li>)
            : <li className="bk-none">No record in this selection holds {info.name}.</li>}</ol>
        </OutsideScroll>
      </aside>
    </div>
  </>;
}
