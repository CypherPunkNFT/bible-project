// Section 07: every book in one line, in canonical order: what it says of its writer, who the witnesses name, and its date
// drawn as ranges, never points; where evangelical and critical ranges differ, both are drawn and named. Then the close:
// the words easily confused, what the page reaches and does not, the site's own word, where to go next, the sources, and
// the question to carry.
import { Link } from "react-router-dom";
import { ACADEMIC_BACK, AXIS, D, LINK_HREF, NB, SIDE_WORD, axisShare, findRow, readingTag, sectionOf, type Bar } from "./model";
import { Head, Quote, Text } from "./parts";

type Change = (values: Record<string, string | null>) => void;

function Bars({ bars }: { bars: Bar[] }) {
  return <div className="nb-bars" aria-hidden="true">
    {AXIS.ticks.map((year) => <span key={year} className="nb-tick" style={{ left: `${axisShare(year) * 100}%` }} />)}
    {bars.map((bar) => <span key={`${bar.side}${bar.from}`} className={`nb-bar ${bar.side}${bar.soft ? " soft" : ""}`}
      style={{ left: `${axisShare(bar.from) * 100}%`, width: `${Math.max(1.2, (axisShare(bar.to) - axisShare(bar.from)) * 100)}%` }} />)}
  </div>;
}

function Table({ rowId, onChange }: { rowId: string | null; onChange: Change }) {
  const lit = findRow(rowId);
  const bars = new Map(NB.table.map((row) => [row.book, row.bars]));
  return <div className="nb-table">
    <div className="nb-table-head" aria-hidden="true">
      <span>Book</span><span>What it says of its writer</span><span>Who the witnesses name</span>
      <span className="nb-axis">{AXIS.ticks.filter((y) => y % 20 === 0 || y === 130).map((y) => <i key={y} style={{ left: `${axisShare(y) * 100}%` }}>{y}</i>)}</span>
    </div>
    <ol>{D.referenceTable.map((row) => <li key={row.book} id={`book-${row.book.replace(/\s+/g, "-").toLowerCase()}`} className={`${sectionOf(row.book)}${lit === row.book ? " lit" : ""}`}>
      <button type="button" className="nb-row-book" aria-pressed={lit === row.book} onClick={() => onChange({ book: lit === row.book ? null : row.book })}>{row.book}</button>
      <span className="nb-row-claims"><Text text={row.claims} book={row.book} /></span>
      <span className="nb-row-witness"><Text text={row.witness} /></span>
      <span className="nb-row-date"><Bars bars={bars.get(row.book) ?? []} /><small><Text text={row.date} /></small></span>
      {lit === row.book && row.home && <span className="nb-row-home"><Text text={row.home} /></span>}
    </li>)}</ol>
    <ul className="nb-key" aria-label="How the dates are drawn">
      <li><span className="nb-swatch evangelical" />{SIDE_WORD.evangelical}, drawn solid, first</li>
      <li><span className="nb-swatch critical" />{SIDE_WORD.critical}, drawn hatched, second</li>
      <li><span className="nb-swatch one" />One range, or two views the record does not rank</li>
      <li><span className="nb-swatch one soft" />“About” or “before”: a soft bar about five years wide</li>
    </ul>
  </div>;
}

function Closing() {
  return <>
    <div className="nb-close">
      <div>
        <p className="nb-kicker">Words easily confused</p>
        <dl className="nb-confused">{D.confusedWords.map((w) => <div key={w.word}><dt>{w.word}</dt><dd><Text text={w.note} /></dd></div>)}</dl>
      </div>
      <div>
        <p className="nb-kicker">How far this page reaches</p>
        <ul className="nb-reach">{D.reach.map((r) => <li key={r}><Text text={r} /></li>)}</ul>
        <p className="nb-kicker nb-gap">Not on this page</p>
        <ul className="nb-reach">{D.boundaries.out.map((r) => <li key={r}><Text text={r} /></li>)}</ul>
      </div>
    </div>
    <aside className="nb-confession">
      <div>
        <p className="nb-kicker">{D.stance.head}</p>
        <p className="nb-confession-words">{D.stance.confession}</p>
        <p className="nb-caption">{D.stance.confessionSource}</p>
        <p className="nb-para"><Text text={D.stance.body} /></p>
      </div>
      <div>{D.stance.verses.map((label) => <Quote key={label} refKey={label} />)}</div>
    </aside>
    <p className="nb-kicker nb-gap">Where to go next</p>
    <ul className="nb-links">{D.links.map((link) => {
      const href = LINK_HREF.get(link.title);
      return <li key={link.title}>
        {href ? <Link to={href}>{link.title} →</Link> : <span>{link.title}</span>}
        <small>{link.kind} · <Text text={link.why} />{!href && " (no page address yet)"}</small>
      </li>;
    })}</ul>
    <details className="nb-sources">
      <summary>Sources · {D.sources.length}, each with what was read of it</summary>
      <ul>{D.sources.map((s) => <li key={s.id}>
        <p className="nb-source-title"><Text text={s.title} /><small>{s.kind} · {readingTag(s.status)}</small></p>
        <p><i><Text text={s.answers} /></i> <Text text={s.read} /></p>
      </li>)}</ul>
    </details>
    <div className="nb-final">
      <p>{D.question}</p>
      <small>Ask it of the next claim you hear about who wrote a book of the Bible, and when.</small>
      <nav aria-label="Leave this study"><Link to={ACADEMIC_BACK}>← Back to Academic studies</Link><a href="#landing">To the top ↑</a></nav>
    </div>
  </>;
}

export function Books({ rowId, onChange }: { rowId: string | null; onChange: Change }) {
  return <>
    <Head num="07" kicker="Every book" title={<>Twenty-seven lines.<em> Ranges, not points.</em></>} lead={D.dates.note} />
    <Table rowId={rowId} onChange={onChange} />
    <Closing />
  </>;
}
