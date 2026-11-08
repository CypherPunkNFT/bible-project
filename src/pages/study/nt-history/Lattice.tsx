// 01 The lattice: four lanes of offices across 63 BC to AD 74, every reign a bar (solid where the year is fixed, hatched where it
// is reckoned), and the chosen New Testament anchor as a line crossing them. The anchor list and the rulers list are the keyboard
// path; the drawing repeats them for a pointer and stays out of the tab order.
import { Fragment } from "react";
import { atPath, D, findAnchor, NH, rangeWord, type Anchor, type Row } from "./model";
import { AXIS_YEARS, CHART, lattice, rowSpans, touchedBy, yearEndX, yearMidX, yearX, type Placed } from "./geometry";
import { Head, Prose, Refs } from "./parts";

const LAYOUT = lattice();
const KIND_WORD = { fixed: "fixed by an outside record", reckoned: "reckoned: about, disputed or worked out" } as const;

function rowYears(row: Row): string {
  if (row.points) return row.points.map((p) => rangeWord(p, p)).join(" or ");
  const spans = rowSpans(row).map(([a, b]) => rangeWord(a, b)).join(", ");
  return row.endAlt !== undefined ? `${spans} (or to ${rangeWord(row.endAlt, row.endAlt)})` : spans;
}

function Bar({ placed: { row, y, kind, labelX, labelInside, labelEnd }, lit, chosen, onPick }: { placed: Placed; lit: boolean; chosen: boolean; onPick: (id: string) => void }) {
  const cls = `nh-bar ${kind}${lit ? " lit" : ""}${chosen ? " chosen" : ""}`;
  const pick = () => onPick(row.id);
  const h = CHART.barHeight;
  if (row.points) {
    return <g onClick={pick}>{row.points.map((p) => <Fragment key={p}>
      <rect className={cls} x={yearX(p)} y={y} width={yearEndX(p) - yearX(p)} height={h} />
      <text className="nh-bar-label" x={yearEndX(p) + 3} y={y + 11}>{p}</text>
    </Fragment>)}<text className="nh-bar-label dim" x={labelX + 22} y={y + 11}>{row.name}</text></g>;
  }
  const spans = rowSpans(row);
  const first = yearX(spans[0][0]), last = yearEndX(spans[spans.length - 1][1]);
  return <g onClick={pick}>
    {spans.map(([a, b]) => <rect key={a} className={cls} x={yearX(a)} y={y} width={Math.max(2, yearEndX(b) - yearX(a))} height={h} rx="2" />)}
    {row.endAlt !== undefined && <rect className={`nh-bar reckoned${chosen ? " chosen" : ""}`} x={yearEndX(row.end!)} y={y} width={yearEndX(row.endAlt) - yearEndX(row.end!)} height={h} />}
    {row.open && <path className="nh-span" d={`M${first - 14} ${y + h / 2}H${first}M${last} ${y + h / 2}H${last + 14}`} />}
    <text className={`nh-bar-label${labelInside ? "" : " dim"}`} x={labelX} y={y + 11} textAnchor={labelEnd ? "end" : undefined}>{row.name}</text>
  </g>;
}

function Crossing({ anchor, height }: { anchor: Anchor; height: number }) {
  return <g aria-hidden="true">
    {anchor.countedFrom !== undefined && <path className="nh-span" d={`M${yearMidX(anchor.countedFrom)} ${CHART.top - 6}V${height}M${yearMidX(anchor.countedFrom)} ${CHART.top - 6}H${yearMidX(anchor.years[0].from)}`} />}
    {anchor.years.map((s, i) => {
      const x0 = yearX(s.from), x1 = yearEndX(s.to), mid = (x0 + x1) / 2;
      return <g key={s.label}>
        {s.to > s.from && <rect className="nh-cross-band" x={x0} y={CHART.top - 4} width={x1 - x0} height={height - CHART.top + 4} />}
        <line className={`nh-cross${i ? " alt" : ""}`} x1={mid} x2={mid} y1={CHART.top - 10 - i * 12} y2={height} />
        <text className="nh-cross-label" x={mid + 4} y={CHART.top - 12 - i * 12}>{rangeWord(s.from, s.to)}</text>
      </g>;
    })}
  </g>;
}

function Chart({ anchor, ruler, onRuler }: { anchor: Anchor; ruler: Row | null; onRuler: (id: string) => void }) {
  const lit = new Set(touchedBy(anchor).map((r) => r.id));
  const { placed, lanes, height } = LAYOUT;
  return <div className="nh-chart" aria-hidden="true">
    <svg viewBox={`0 0 ${CHART.width} ${height + 18}`}>
      <defs>
        <pattern id="nh-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line className="nh-hatch-line" x1="0" y1="0" x2="0" y2="5" /></pattern>
      </defs>
      <g className="nh-axis">{AXIS_YEARS.map((year) => <g key={year}><line x1={yearX(year)} x2={yearX(year)} y1={CHART.top - 2} y2={height} /><text x={yearX(year) + 3} y={height + 13}>{rangeWord(year, year)}</text></g>)}</g>
      {lanes.map((lane) => <g key={lane.name}><line className="nh-lane-rule" x1={CHART.left} x2={CHART.width - CHART.right} y1={lane.y} y2={lane.y} /><text className="nh-lane-name" x={CHART.left} y={lane.y + 14}>{lane.name}</text></g>)}
      {placed.map((p) => <Bar key={p.row.id} placed={p} lit={lit.has(p.row.id)} chosen={ruler?.id === p.row.id} onPick={onRuler} />)}
      <Crossing anchor={anchor} height={height} />
    </svg>
  </div>;
}

function Reading({ anchor }: { anchor: Anchor }) {
  const touched = touchedBy(anchor);
  return <div className="nh-reading" aria-live="polite">
    <div>
      <p className="nh-kicker">The line drawn</p>
      <h3>{anchor.title}</h3>
      <p className="nh-years">{anchor.years.map((s) => <span key={s.label}><b>{rangeWord(s.from, s.to)}</b> · {s.label}</span>)}</p>
      <p className="nh-para"><Prose text={atPath(anchor.textPath)} /></p>
      <Refs labels={anchor.verses} />
    </div>
    <div>
      <p className="nh-kicker">In office where the line crosses</p>
      <ul className="nh-touch">{touched.map((r) => <li key={r.id} className={anchor.named.includes(r.id) ? "named" : undefined}>
        <span>{r.name}{anchor.named.includes(r.id) && <small> · named in the verse</small>}</span><small>{NH.kinds[r.id] === "fixed" ? "fixed" : "reckoned"}</small>
      </li>)}</ul>
      {!anchor.named.length && <p className="nh-caption">The verse names no ruler in office: the line is fixed by its count of years or by Josephus.</p>}
    </div>
  </div>;
}

export function Lattice({ anchorId, ruler, onChange }: { anchorId: string | null; ruler: Row | null; onChange: (values: Record<string, string | null>) => void }) {
  const anchor = findAnchor(anchorId);
  const lit = new Set(touchedBy(anchor).map((r) => r.id));
  const pickRuler = (id: string) => onChange({ ruler: ruler?.id === id ? null : id });
  return <>
    <Head num="01" kicker="The lattice of reigns" title="Seven names." turn="One year."
      lead={<>Luke names seven people to fix one year (Luke 3:1–2). Choose an anchor: a line crosses the reigns, and every ruler it meets lights. Then ask whether that ruler's own date is fixed or reckoned.</>} />
    <div className="nh-lattice">
      <ul className="nh-anchors" aria-label="Anchors in the New Testament">{NH.anchors.map((a) => <li key={a.id}>
        <button type="button" className="nh-anchor" aria-pressed={a.id === anchor.id} onClick={() => onChange({ anchor: a.id })}>
          <b>{a.years[0].from < 0 ? `${-a.years[0].from} BC` : a.years[0].from}</b><span>{a.title}<small>{a.short}</small></span>
        </button>
      </li>)}</ul>
      <div>
        <Chart anchor={anchor} ruler={ruler} onRuler={pickRuler} />
        <p className="nh-legend"><span><i className="nh-swatch" /> Fixed by an outside record</span><span><i className="nh-swatch reckoned" /> Reckoned: about, disputed or worked out</span><span><i className="nh-swatch cross" /> The anchor's years; a second, dashed line where they are disputed</span></p>
      </div>
    </div>
    <Reading anchor={anchor} />
    <div className="nh-rulers">{D.timeline.lanes.map((lane) => <div key={lane}>
      <h3>{lane}</h3>
      <ul>{D.timeline.rows.filter((r) => r.lane === lane).map((r) => <li key={r.id}>
        <button type="button" className={`nh-ruler${lit.has(r.id) ? " lit" : ""}`} aria-pressed={ruler?.id === r.id} onClick={() => pickRuler(r.id)}>
          <span>{r.name}</span><small>{rowYears(r)}</small>
        </button>
      </li>)}</ul>
    </div>)}</div>
    {ruler && <p className="nh-ruler-note"><b>{ruler.name}</b>, {rowYears(ruler)}: {KIND_WORD[NH.kinds[ruler.id] ?? "reckoned"]}.{ruler.note && <> {ruler.note}</>}{" "}
      {NH.anchors.filter((a) => touchedBy(a).some((r) => r.id === ruler.id)).length
        ? <>Crossed by: {NH.anchors.filter((a) => touchedBy(a).some((r) => r.id === ruler.id)).map((a) => a.title).join(", ")}.</>
        : <>No anchor on this page crosses this bar.</>}</p>}
    <p className="nh-caption">Bars come from the research record's timeline. Solid or hatched is this page's reading of the record: a bar is hatched when the record gives its years as “about”, as two dates, as ranges or as open-ended. Each anchor's years are the record's own words, checked by the page's build.</p>
  </>;
}
