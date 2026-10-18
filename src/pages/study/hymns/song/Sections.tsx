// The sections after the hymn itself: where Newton found it, its place in the book, and where hymnals place it
// (approved mock-up: design/hymn-directions/shared/sections.js).
import { useMemo, useState, type CSSProperties, type MouseEvent } from "react";
import type { HymnSong, SongPlacedRef } from "@/lib/hymns";
import { ROMAN, placedUrl, type OpenPassage } from "./parts";

const tone = (token: string) => ({ "--tone": `var(--${token})` }) as CSSProperties;

export function Head({ num, title, children }: { num: string; title: JSX.Element; children: React.ReactNode }) {
  return <div className="hy-head"><span className="hy-num">{num}</span><div><h2>{title}</h2><p>{children}</p></div></div>;
}

/** 02 · Where Newton found it: his heading verse beside his line. */
export function Found({ song }: { song: HymnSong }) {
  const verse = song.heading.passage.verses[0].text, phrase = "that thou hast brought me hitherto";
  const at = verse.indexOf(phrase);
  return <section className="hy-sec" id="found">
    <Head num="02" title={<>Where Newton <em>found it</em></>}>He printed the hymn under David's prayer after God's promise of a lasting house. "Hitherto" is the word the hymn turns into "thus far".</Head>
    <div className="hy-found">
      <blockquote>{at < 0 ? verse : <>{verse.slice(0, at)}<b>{phrase}</b>{verse.slice(at + phrase.length)}</>}<cite>1 Chronicles 17:16 · King James Version</cite></blockquote>
      <span className="join" aria-hidden="true" />
      <blockquote>Through many dangers, toils and snares, I have already come; <b>’Tis grace has brought me safe thus far</b>, and grace will lead me home.<cite>Stanza III</cite></blockquote>
    </div>
  </section>;
}

/** 03 · Its place in the book: Olney Book I walks through the Bible, Genesis to Revelation, one tick per hymn. */
export function BookRow({ song }: { song: HymnSong }) {
  const [shown, setShown] = useState(song.number);
  const h = song.book1.find((x) => x.n === shown) ?? song.book1[0];
  return <section className="hy-sec" id="book">
    <Head num="03" title={<>Its place in <em>the book</em></>}>Book I of <i>Olney Hymns</i> walks through the Bible from Genesis to Revelation, one hymn per passage: {song.book1.length} hymns.
      This is number {song.number}, the only one on 1 Chronicles. (Across all three books Newton wrote {song.olneyAuthors["John Newton"]} hymns, Cowper {song.olneyAuthors["William Cowper"]}.)
      Hover a tick to see the hymn.</Head>
    <div className="hy-book"><div className="hy-book-row" onMouseLeave={() => setShown(song.number)}>{song.book1.map((x) =>
      <button key={x.n} type="button" style={tone(x.tone)} className={x.n === song.number ? "here" : undefined} aria-label={`Hymn ${x.n}: ${x.title}`}
        onMouseEnter={() => setShown(x.n)} onFocus={() => setShown(x.n)} onClick={() => setShown(x.n)} />)}</div>
      <div className="hy-book-scale"><span>Genesis</span><span>Psalms</span><span>Prophets</span><span>Gospels</span><span>Revelation</span></div>
      <p className="hy-book-readout" aria-live="polite"><small>No. {h.n} · {h.book} · {h.author}</small>{h.title}</p></div>
  </section>;
}

type Placed = SongPlacedRef & { book: string; tone: string; echoes: HymnSong["echoes"] };

/** 04 · Where hymnals place it: one square per passage hymnal editors tie this hymn to, by book. Pointing shows the verse;
 *  a click opens the passage beside the page; a ring marks a passage one of the hymn's own lines echoes. */
export function PlacedSquares({ song, open }: { song: HymnSong; open: OpenPassage }) {
  const all = useMemo<Placed[]>(() => song.placed.flatMap((b) => b.refs.map((r) => ({ ...r, book: b.book, tone: b.tone,
    echoes: song.echoes.filter((e) => e.code === r.code && e.chapter === r.chapter && (r.whole || (e.verses[0].n <= r.first + r.count - 1 && e.verses[e.verses.length - 1].n >= r.first))) }))), [song]);
  const echoed = all.filter((r) => r.echoes.length).length;
  const [shown, setShown] = useState(() => Math.max(0, all.findIndex((r) => r.echoes.length)));
  const r = all[shown];
  function onClick(event: MouseEvent, i: number) {
    event.preventDefault();
    setShown(i);
    const p = all[i];
    open({ passage: { ref: p.label, code: p.code, chapter: p.chapter, verses: p.verses }, line: p.echoes.length ? song.stanzas[p.echoes[0].stanza][p.echoes[0].line] : undefined,
      kicker: `Hymnals tie the hymn here${p.count > p.verses.length ? ` · first ${p.verses.length} of ${p.count} verses` : ""}` });
  }
  let i = 0;
  return <section className="hy-sec" id="placed">
    <Head num="04" title={<>Where hymnals <em>place it</em></>}>Printed hymnals list, for each hymn, the Bible passages it goes with, so a church can choose a hymn for the day's reading.
      Gathered from the hymnals Hymnary.org catalogues, editors have tied <b>this hymn</b> to {all.length} passages in {song.placed.length} books.
      One square is one passage; a ringed square is one the hymn's own lines echo. Point at a square to read it; click to open it beside the page.</Head>
    <div className="hy-placed">{song.placed.map((b) => <div key={b.book} className="hy-placed-book" style={tone(b.tone)}><h4>{b.book}<span>{b.refs.length}</span></h4>
      <div className="sq">{b.refs.map(() => { const k = i++, p = all[k];
        return <a key={k} href={placedUrl(p)} className={[p.echoes.length ? "echo" : "", k === shown ? "on" : ""].join(" ").trim() || undefined} aria-label={p.label}
          onMouseEnter={() => setShown(k)} onFocus={() => setShown(k)} onClick={(e) => onClick(e, k)} />; })}</div></div>)}</div>
    {r && <div className="hy-placed-read" aria-live="polite" style={tone(r.tone)}>
      <p className="ref">{r.label}{r.whole ? " · the whole chapter" : ""}{r.echoes.length > 0 && <em>echoed in stanza {[...new Set(r.echoes.map((e) => ROMAN[e.stanza]))].join(", ")}</em>}</p>
      <p className="txt">{r.verses.map((v) => <span key={v.n}><sup>{v.n}</sup>{v.text} </span>)}{r.count > r.verses.length && <span className="more">… {r.count - r.verses.length} more verses</span>}</p></div>}
    <p className="hy-placed-key"><span><i className="k-sq" />a passage hymnals tie it to</span><span><i className="k-sq echo" />one its lines echo ({echoed})</span></p>
  </section>;
}
