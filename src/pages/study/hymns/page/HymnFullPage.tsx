// One hymn's page, for every hymn but Amazing Grace (which keeps its own hand-made study): the approved design
// (design/hymn-directions/a/) filled from data/hymns/pages/ by scripts/build-hymn-pages.py. The same template serves all
// 1,227; each section appears only when the data has something for it, and the numbers follow what is shown. A hymn with
// no heading verse and no echoes shows its words, its book and its place in the book (owner, 2026-10-17).
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { HymnPageData } from "@/lib/hymn-pages";
import type { SongPlacedBook } from "@/lib/hymns";
import { Constellation } from "../song/Constellation";
import { Echoes } from "../song/Echoes";
import { Head, PlacedSquares } from "../song/Sections";
import { PassagePanel, ROMAN, numeralStyle, type PanelContent } from "../song/parts";
import { BookTicks, Found, MainPassage, PageSources } from "./sections";
import { StanzaPager, stanzaPages, type StanzaPage } from "./StanzaPager";
import "../song/song.css";
import "./page.css";

/** The constellation draws only up to this many stanzas on its inner ring. */
const RING_STANZAS = 12;
const surname = (name: string) => name.split(" ").pop() ?? name;

function Crumb() {
  return <p className="hy-crumb"><Link to="/study">Study</Link><span>/</span><Link to="/study/theology?area=life">Living the Christian Life</Link><span>/</span><Link to="/study/hymns">Hymns</Link></p>;
}

const SECTION: Record<string, string> = {};
for (const [codes, section] of [
  ["GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST", "history"], ["JOB PSA PRO ECC SNG", "poetry"],
  ["ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL", "prophets"], ["MAT MRK LUK JHN", "gospels"], ["ACT", "acts"],
  ["ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD", "epistles"], ["REV", "revelation"],
] as const) for (const code of codes.split(" ")) SECTION[code] = section;
/** A book's reading-chart colour token, without the dashes ("poetry"). */
const toneOf = (code: string) => SECTION[code] ?? "accent";

/** The outer ring of the constellation: the books of the heading verse and of every echo, in Bible order. */
function ringOf(page: HymnPageData): SongPlacedBook[] {
  const books = new Map<string, SongPlacedBook>();
  const add = (code: string, ref: string, chapter: number, first: number, count: number, verses: SongPlacedBook["refs"][number]["verses"]) => {
    const name = ref.replace(/\s+\d+(:.*)?$/, "").replace(/^Psalm$/, "Psalms");
    const book = books.get(code) ?? { book: name, code, tone: toneOf(code), refs: [] };
    const short = ref.slice(ref.search(/\d+(:|$)/));
    if (!book.refs.some((r) => r.ref === short)) book.refs.push({ ref: short, label: ref, code, chapter, first, whole: !short.includes(":"), count, verses });
    books.set(code, book);
  };
  if (page.heading) { const p = page.heading.passage; add(p.code, p.ref, p.chapter, p.verses[0]?.n ?? 1, p.count, p.verses); }
  for (const e of page.echoes) add(e.code, e.ref, e.chapter, e.verses[0]?.n ?? 1, e.verses.length, e.verses);
  return [...books.values()];
}

/** One page of stanzas, with its echoes renumbered from the page's first stanza. */
function slice(page: HymnPageData, p: StanzaPage) {
  return { stanzas: page.stanzas.slice(p.first, p.last + 1),
    echoes: page.echoes.filter((e) => e.stanza >= p.first && e.stanza <= p.last).map((e) => ({ ...e, stanza: e.stanza - p.first })) };
}

function lede(page: HymnPageData) {
  if (page.group === "psalms" && page.heading) return <>Isaac Watts's setting of {page.heading.label}, printed in {page.year} in <i>{page.collection}</i>, where he set
    the psalms "in the language of the New Testament".</>;
  const where = page.partLabel && page.partLabel !== page.collection ? `${page.collection}, ${page.partLabel.replace(/^Book ([IV]+) · .*/, "Book $1")}` : page.collection;
  return <>{page.author} printed it in {page.year} in <i>{where}</i>, no. {page.number.replace(/^\d+:/, "")}{page.heading ? <>, under {page.heading.label}</> : null}.</>;
}

export function HymnFullPage({ page }: { page: HymnPageData }) {
  const [panel, setPanel] = useState<PanelContent | null>(null);
  const [closedAt, setClosedAt] = useState(0);
  const close = useCallback(() => { setPanel(null); setClosedAt((n) => n + 1); }, []);
  const ring = useMemo(() => ({ ...page, placed: ringOf(page) }), [page]);
  const pages = useMemo(() => stanzaPages(page.stanzas), [page]);
  const lines = page.stanzas.reduce((n, s) => n + s.length, 0);
  // The constellation earns its place only when the hymn reaches into two books or more (a psalm setting's echoes all sit
  // in its one psalm) and its stanzas fit the inner ring.
  const showRing = ring.placed.length >= 2 && page.echoes.length > 0 && page.stanzas.length <= RING_STANZAS;
  const toConstellation = () => document.getElementById("constellation")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  let n = 0;
  const num = () => String(++n).padStart(2, "0");
  const who = surname(page.author);

  return <div className="hy-song hy-full">
    <section className="hy-intro">
      <div>
        <Crumb />
        <h1>{page.firstLine.replace(/[,;:]$/, "")}{page.subtitle && <em>{page.subtitle.replace(/\.$/, "")}</em>}</h1>
        <p className="hy-lede">{lede(page)}</p>
        {showRing && <div className="hp-actions"><button type="button" className="d-go" onClick={toConstellation}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="12" cy="12" r="2.4" /><circle cx="12" cy="12" r="8.5" strokeDasharray="2 3" /><circle cx="12" cy="3.5" r="1.4" /><circle cx="19.4" cy="15.6" r="1.4" /><circle cx="4.6" cy="15.6" r="1.4" /></svg>
          See the constellation</button></div>}
      </div>
      <dl className="hy-facts">
        <div><dt>Written by</dt><dd>{page.author}<small>{page.authorDates}</small></dd></div>
        <div><dt>Printed</dt><dd>{page.year}<small>{page.collection} · no. {page.number.replace(/^\d+:/, "")}</small></dd></div>
        <div><dt>Metre</dt><dd>{page.meterName || page.meter || "Not recorded"}<small>{page.meterName && page.meter ? `${page.meter} · ` : ""}{page.stanzas.length} stanza{page.stanzas.length === 1 ? "" : "s"}</small></dd></div>
        {page.hymnals
          ? <div><dt>In hymnals</dt><dd>{page.hymnals.toLocaleString("en-GB")}<small>listed at Hymnary.org</small></dd></div>
          : <div><dt>Written on</dt><dd>{page.heading?.label ?? "A subject"}<small>{page.heading ? "the verse printed above it" : "no verse printed above it"}</small></dd></div>}
      </dl>
    </section>

    <section className="hy-sec" id="hymn">
      {page.echoes.length > 0 ? <>
        <Head num={num()} title={<>The hymn, <em>and the Scripture in it</em></>}>All {page.stanzas.length > 1 ? `${page.stanzas.length} stanzas` : "of it"} as {who} printed
          them. Beside {page.echoes.length === 1 ? "the line" : "each line"} that echoes a verse, the verse. Point at a line or a verse to join them; click to read the passage.
          {showRing ? " Below the hymn, the same links as a constellation." : ""}</Head>
        <p className="hf-label">Verses a line echoes, found by matching the words or proposed by an AI model, and each checked twice: the words are in the
          verse, and a separate check agreed. <b>shared words</b> marks a verse found by its wording; <b>echo</b> one proposed and confirmed. Not the author's own notes.</p>
        <StanzaPager pages={pages}>{(p) => <Echoes song={slice(page, p)} stanzaOffset={p.first} open={setPanel} closedAt={closedAt} showKey={false} />}</StanzaPager>
        <p className="ec-key">{page.echoes.length} echo{page.echoes.length === 1 ? "" : "es"} in {lines} lines.</p>
        {showRing && <div className="d-among" id="constellation">
          <p className="d-among-k">Among the Scriptures</p>
          <p className="d-among-line">The stanzas at the centre; around them, every book its heading and its echoes come from, Old Testament on the left and New on the
            right. Choose a stanza or a book.</p>
          <Constellation song={ring} open={setPanel} title={page.firstLine.split(/\s+/).slice(0, 3).join(" ").replace(/[,;:!]$/, "")}
            ringLabel="its heading or an echo comes from here" ringNoun="verse" ringVerb="it draws on" />
        </div>}
      </> : <>
        <Head num={num()} title={<>The <em>hymn</em></>}>The words as {who} printed them, {lines} lines.</Head>
        <StanzaPager pages={pages}>{(p) => <div className="ec ec-plain"><div className="stanzas">{page.stanzas.slice(p.first, p.last + 1).map((stanza, i) =>
          <div key={p.first + i} className="stanza"><span className="rn" aria-hidden="true" style={numeralStyle(ROMAN[p.first + i] ?? "")}>{ROMAN[p.first + i] ?? p.first + i + 1}</span>
            {stanza.map((line, l) => <span key={l} className="line"><span className="t">{line}</span></span>)}</div>)}</div></div>}</StanzaPager>
      </>}
    </section>

    {page.heading && <Found num={num()} page={page} who={who} />}
    {!page.heading && page.mainPassage && <MainPassage num={num()} page={page} open={setPanel} />}
    <BookTicks num={num()} page={page} />
    {page.placed.length > 0 && <PlacedSquares num={num()} song={page} open={setPanel} />}
    <PageSources page={page} />
    <PassagePanel content={panel} onClose={close} />
  </div>;
}
