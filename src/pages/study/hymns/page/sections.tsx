// The sections of a generated hymn page after the hymn itself: where the author found it (or, for a psalm, the psalm it
// sets), the passage it draws on most when no verse is printed above it, its place in its book, and the sources. Built
// from the approved Amazing Grace sections (../song/Sections.tsx), with every sentence filled from the hymn's data.
import { useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { BookTick, HymnPageData, PagePassage } from "@/lib/hymn-pages";
import { Head } from "../song/Sections";
import { ROMAN, type OpenPassage } from "../song/parts";

const tone = (token: string) => ({ "--tone": `var(--${token || "accent"})` }) as CSSProperties;
const readHref = (p: PagePassage) =>
  `/read/bsb/${p.code}/${p.chapter}${p.whole ? "" : `?hl=${p.verses[0].n}${p.verses.length > 1 ? `-${p.verses[p.verses.length - 1].n}` : ""}`}`;

function Verses({ p }: { p: PagePassage }) {
  return <>{p.verses.map((v) => <span key={v.n}>{p.verses.length > 1 && <sup>{v.n}</sup>}{v.text} </span>)}
    {p.count > p.verses.length && <span className="hf-more">… {p.count - p.verses.length} more verses</span>}</>;
}

/** Where the author found it: the verse printed above the hymn, beside the stanza whose line comes closest to it. */
export function Found({ num, page, who }: { num: string; page: HymnPageData; who: string }) {
  const h = page.heading!;
  const p = h.passage, psalm = page.group === "psalms" && p.code === "PSA";
  const stanza = h.line ? page.stanzas[h.line.stanza] : null;
  return <section className="hy-sec" id="found">
    <Head num={num} title={psalm ? <>The psalm <em>it sets</em></> : <>Where {who} <em>found it</em></>}>
      {psalm ? `Watts made this hymn from ${h.label}, "in the language of the New Testament": a paraphrase, not a translation.`
        : `${who} printed the hymn under ${h.label}.`}
      {stanza ? " The line that comes closest to it is marked." : ""}</Head>
    <div className={`hy-found${stanza ? "" : " hf-single"}`}>
      <blockquote><Verses p={p} /><cite>{h.label}{p.whole ? " · its first verses" : ""} · Berean Standard Bible</cite>
        <Link className="hf-read" to={readHref(p)}>Read {p.ref.split(":")[0]}<ArrowRight size={14} strokeWidth={1.5} aria-hidden /></Link></blockquote>
      {stanza && h.line && <><span className="join" aria-hidden="true" />
        <blockquote>{stanza.map((line, l) => <span key={l}>{l === h.line!.line ? <b>{line}</b> : line} </span>)}<cite>Stanza {ROMAN[h.line.stanza] ?? h.line.stanza + 1}</cite></blockquote></>}
    </div>
  </section>;
}

/** For a hymn printed without a heading: the one verse its lines draw on most, labelled as the checks' choice. */
export function MainPassage({ num, page, open }: { num: string; page: HymnPageData; open: OpenPassage }) {
  const m = page.mainPassage!;
  return <section className="hy-sec" id="found">
    <Head num={num} title={<>The passage <em>it draws on most</em></>}>Its book prints no verse above this hymn. Of the verses its lines share most
      wording with, this is the one the whole hymn draws on, chosen by an AI model from those the word matching found. Not the author's own heading.</Head>
    <div className="hy-found hf-single">
      <blockquote><Verses p={m.passage} /><cite>{m.label} · Berean Standard Bible</cite>
        <button type="button" className="hf-read" onClick={() => open({ passage: m.passage, kicker: "The passage it draws on most" })}>Open it beside the page
          <ArrowRight size={14} strokeWidth={1.5} aria-hidden /></button></blockquote>
    </div>
  </section>;
}

/** A long book is drawn in two or three rows (owner, 2026-10-18), so a tick stays wide enough to point at. */
const ONE_ROW = 150, ROW = 130, MOST_ROWS = 3;

/** What a tick is called at the ends of its row: "Psalm 104" for a psalm setting, "No. 26" otherwise. */
const tickName = (page: HymnPageData, n: string) => (!/^\d/.test(n) ? n : page.group === "psalms" ? `Psalm ${n.split(":")[0].replace(/^0+/, "")}` : `No. ${n.replace(/^\d+:/, "")}`);

/** The labels under a row: Book I of Olney Hymns, on one row, reads as a walk through the Bible; any other row names its ends. */
function scale(page: HymnPageData, row: BookTick[], rows: number) {
  if (rows === 1 && page.book.label.startsWith("Book I · On select passages")) return ["Genesis", "Psalms", "Prophets", "Gospels", "Revelation"];
  return [tickName(page, row[0].n), tickName(page, row[row.length - 1].n)];
}

/** Its place in the book: one tick per hymn of its book, in the book's order; pointing names a hymn, a click opens it. */
export function BookTicks({ num, page }: { num: string; page: HymnPageData }) {
  const navigate = useNavigate();
  const { ticks, here, label } = page.book;
  const [shown, setShown] = useState(here);
  const t = ticks[shown] ?? ticks[here];
  const count = ticks.length <= ONE_ROW ? 1 : Math.min(MOST_ROWS, Math.ceil(ticks.length / ROW));
  const size = Math.ceil(ticks.length / count);
  const rows = Array.from({ length: count }, (_, r) => ({ start: r * size, row: ticks.slice(r * size, (r + 1) * size) }));
  const book = label.replace(/^Book ([IV]+) · (.*)$/, "Book $1 of the hymn book, “$2”,");
  const what = page.group === "psalms" ? "Watts's psalms run from Psalm 1 to Psalm 150, several settings to many psalms"
    : label.startsWith("Book I · On select passages") ? "Book I of Olney Hymns walks through the Bible from Genesis to Revelation, one hymn per passage"
      : `${book} holds these hymns in this order`;
  return <section className="hy-sec" id="book">
    <Head num={num} title={<>Its place in <em>the book</em></>}>{what}: {ticks.length} hymns. This is number {page.number.replace(/^\d+:/, "")}.
      Point at a tick to see the hymn; click it to open that hymn.</Head>
    <div className="hy-book">{rows.map(({ start, row }) => <div key={start} className="hf-book-line">
      <div className="hy-book-row" onMouseLeave={() => setShown(here)}>{row.map((x, k) => { const i = start + k;
        return <button key={x.id} type="button" style={tone(x.tone)} className={i === here ? "here" : undefined} aria-label={`No. ${x.n}: ${x.t}`}
          onMouseEnter={() => setShown(i)} onFocus={() => setShown(i)} onClick={() => (i === here ? setShown(i) : navigate(`/study/hymns/${x.id}`))} />; })}</div>
      <div className="hy-book-scale">{scale(page, row, rows.length).map((s) => <span key={s}>{s}</span>)}</div></div>)}
      <p className="hy-book-readout" aria-live="polite"><small>No. {t.n.replace(/^\d+:/, "")} · {t.a}{shown === here ? " · this hymn" : ""}</small>{t.t.replace(/[,;:]$/, "")}</p></div>
  </section>;
}

/** The closing sources line, collapsed. */
export function PageSources({ page }: { page: HymnPageData }) {
  // A Gutenberg text is credited to its hymn book, not to Project Gutenberg, as Project Gutenberg asks once its header is gone.
  const gutenberg = page.source.slug.startsWith("gutenberg");
  const items = [
    <li key="hymn"><b>The hymn.</b> {page.collection}, {page.author}, {page.year}
      {gutenberg ? "." : <>, from the Christian Classics Ethereal Library (<a href={page.source.url} target="_blank" rel="noreferrer">{page.source.url.replace("https://", "")}</a>).</>} Public domain.</li>,
    page.placed.length > 0 || page.hymnals ? <li key="hymnary"><b>Where hymnals place it.</b> Hymnary.org's catalogue
      {page.hymnary && <> (<a href={page.hymnary} target="_blank" rel="noreferrer">hymnary.org</a>)</>}: the passages hymnal editors attach to it and the number of
      hymnals that print it. No words were taken from Hymnary.</li> : null,
    <li key="verses"><b>The verses.</b> Shown in the Berean Standard Bible, from this site's own Bible text. The verse printed above the hymn is the
      author's. The verses beside its lines were found in the King James wording the author read: by matching the words, or proposed by an AI model, and
      kept only when the verse's words were proved to be there and a separate check agreed. The words beside each verse are cut from the verse itself.</li>,
  ].filter(Boolean);
  return <details className="hy-sources"><summary>Sources · {items.length}</summary><ul>{items}</ul></details>;
}
