// The constellation: the six stanzas at the centre and, on an outer ring, every book hymnal editors tie the hymn to; bright
// lines run from a stanza to the book of the verse one of its lines echoes. Choosing a stanza or a book fills the reading
// column beside it (approved mock-up: design/hymn-directions/shared/constellation.js).
import { useMemo, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import type { HymnSong, SongEcho } from "@/lib/hymns";
import { ROMAN, placedUrl, type OpenPassage } from "./parts";

// Geometry: a 600 × 600 stage. Books on an outer ring in Bible order, Old Testament down the left side from the top,
// New Testament down the right; stanzas on a small inner ring.
const C = 300, R_BOOK = 248, R_STANZA = 78;
const angle = (i: number, n: number, side: number) => { const t = (i + .5) / n; return side < 0 ? Math.PI * (1.5 - .06 - t * .88) : Math.PI * (-.5 + .06 + t * .88); };
const curve = (x1: number, y1: number, x2: number, y2: number, bend = .35) => {
  const mx = (x1 + x2) / 2 + (C - (x1 + x2) / 2) * bend, my = (y1 + y2) / 2 + (C - (y1 + y2) / 2) * bend;
  return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
};
type Pick = { stanza: number } | { book: string };

function buildStage(song: HymnSong) {
  const ntStart = song.placed.findIndex((b) => b.book === "Matthew");
  const ot = ntStart < 0 ? song.placed : song.placed.slice(0, ntStart), nt = ntStart < 0 ? [] : song.placed.slice(ntStart);
  const books = [...ot.map((b, i) => ({ ...b, a: angle(i, ot.length, -1) })), ...nt.map((b, i) => ({ ...b, a: angle(i, nt.length, 1) }))]
    .map((b) => ({ ...b, x: C + R_BOOK * Math.cos(b.a), y: C + R_BOOK * Math.sin(b.a), r: 3 + Math.sqrt(b.refs.length) * 2.4 }));
  const stanzas = song.stanzas.map((_, s) => { const a = -Math.PI / 2 + (s / song.stanzas.length) * Math.PI * 2; return { s, x: C + R_STANZA * Math.cos(a), y: C + R_STANZA * Math.sin(a) }; });
  const bookOf = (e: SongEcho) => books.find((b) => e.ref.startsWith(b.book.replace("Psalms", "Psalm")))?.book;
  return { books, stanzas, bookOf };
}

const activate = (fn: () => void) => ({ onClick: fn, onKeyDown: (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } } });

export function Constellation({ song, open }: { song: HymnSong; open: OpenPassage }) {
  const { books, stanzas, bookOf } = useMemo(() => buildStage(song), [song]);
  const [pick, setPick] = useState<Pick>({ stanza: 0 });
  const echoes = song.echoes.map((e, i) => ({ ...e, i, book: bookOf(e) }));
  const stanzaPicked = "stanza" in pick ? pick.stanza : -1, bookPicked = "book" in pick ? pick.book : "";
  const stanzaOn = (s: number) => stanzaPicked === s || (bookPicked !== "" && echoes.some((e) => e.stanza === s && e.book === bookPicked));
  const bookOn = (name: string) => bookPicked === name || (stanzaPicked >= 0 && echoes.some((e) => e.stanza === stanzaPicked && e.book === name));
  const echoOn = (e: (typeof echoes)[number]) => (stanzaPicked >= 0 ? e.stanza === stanzaPicked : e.book === bookPicked);
  const openEcho = (i: number) => { const e = song.echoes[i]; open({ passage: e, line: song.stanzas[e.stanza][e.line], kicker: `Stanza ${ROMAN[e.stanza]} echoes` }); };
  const steps = <div className="cn-steps" aria-label="Stanzas">{song.stanzas.map((_, s) =>
    <button key={s} type="button" className={s === stanzaPicked ? "on" : undefined} onClick={() => setPick({ stanza: s })}>{ROMAN[s]}</button>)}</div>;

  let reading: JSX.Element;
  if (stanzaPicked >= 0) {
    const mine = echoes.filter((e) => e.stanza === stanzaPicked);
    reading = <><p className="k">Stanza {ROMAN[stanzaPicked]}</p><h3>{song.stanzas[stanzaPicked][0].replace(/[,;!]$/, "")}</h3>
      <div className="st">{song.stanzas[stanzaPicked].map((line, l) => { const e = mine.find((m) => m.line === l);
        return e ? <p key={l} className="e" onClick={() => openEcho(e.i)}>{line}</p> : <p key={l}>{line}</p>; })}</div>
      {mine.length ? <div className="cn-echoes">{mine.map((e) => <button key={e.i} type="button" onClick={() => openEcho(e.i)}><b>{e.ref}</b><span>“{e.words}”</span></button>)}</div>
        : <p className="cn-hint">No line of this stanza quotes a verse closely; it is the hymn's own confession.</p>}{steps}</>;
  } else {
    const b = books.find((x) => x.book === bookPicked);
    const mine = echoes.filter((e) => e.book === bookPicked);
    reading = <><p className="k">{b ? `${b.refs.length} passage${b.refs.length > 1 ? "s" : ""} hymnals name` : ""}</p><h3>{bookPicked}</h3>
      <div className="cn-refs">{b?.refs.map((r) => <Link key={r.ref} to={placedUrl(r)}>{r.label}</Link>)}</div>
      {mine.length > 0 && <><p className="cn-hint">Echoed in the hymn:</p><div className="cn-echoes">{mine.map((e) =>
        <button key={e.i} type="button" onClick={() => openEcho(e.i)}><b>{e.ref} · stanza {ROMAN[e.stanza]}</b><span>“{song.stanzas[e.stanza][e.line]}”</span></button>)}</div></>}{steps}</>;
  }

  return <div className="cn">
    <div><div className="cn-stage picked"><svg viewBox="0 0 600 600" role="img" aria-label="The hymn's stanzas and the books it is tied to">
      <circle className="cn-ring" cx={C} cy={C} r={R_BOOK} /><circle className="cn-ring" cx={C} cy={C} r={R_STANZA} />
      {books.map((b) => <path key={`tie-${b.book}`} className={`cn-tie${bookPicked === b.book ? " on" : ""}`} style={{ "--tone": `var(--${b.tone})` } as React.CSSProperties} d={curve(C, C, b.x, b.y, 0)} />)}
      {echoes.map((e) => { const b = books.find((x) => x.book === e.book), st = stanzas[e.stanza];
        return b ? <path key={`echo-${e.i}`} className={`cn-echo${echoOn(e) ? " on" : ""}`} d={curve(st.x, st.y, b.x, b.y)} /> : null; })}
      {books.map((b) => { const left = b.x < C, lx = b.x + (left ? -1 : 1) * (b.r + 6);
        return <g key={`book-${b.book}`} className={`cn-book${bookOn(b.book) ? " on" : ""}`} style={{ "--tone": `var(--${b.tone})` } as React.CSSProperties} tabIndex={0} role="button"
          aria-label={`${b.book}, ${b.refs.length} passages`} {...activate(() => setPick({ book: b.book }))}>
          <circle cx={b.x} cy={b.y} r={b.r} /><text x={lx} y={b.y + 4} textAnchor={left ? "end" : "start"}>{b.book}</text></g>; })}
      {stanzas.map((st) => <g key={`st-${st.s}`} className={`cn-stanza${stanzaOn(st.s) ? " on" : ""}`} tabIndex={0} role="button" aria-label={`Stanza ${ROMAN[st.s]}`} {...activate(() => setPick({ stanza: st.s }))}>
        <circle cx={st.x} cy={st.y} r="17" /><text x={st.x} y={st.y}>{ROMAN[st.s]}</text></g>)}
      <g className="cn-centre"><text className="t1" x={C} y={C - 4}>Amazing grace</text><text className="t2" x={C} y={C + 16}>{song.author.split(" ").pop()} · {song.year}</text></g>
    </svg></div>
      <p className="cn-legend"><span><i className="e" />a line echoes this verse</span><span><i />hymnal editors tie the hymn here</span></p></div>
    <div className="cn-read" aria-live="polite">{reading}</div>
  </div>;
}
