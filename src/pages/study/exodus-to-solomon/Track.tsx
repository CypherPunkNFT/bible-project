// 01 Cords and nails: Scripture's spans hung as cords from Solomon's fourth year, the ground's ranges as bars beneath the line,
// the two outside records as nails through both. The reader chooses a reading of 1 Kings 6:1 and of Exodus 12:40; nothing is
// chosen on arrival, so both exodus dates are drawn at once and the page picks neither (rule A5). Under the track, where
// each date falls against each bar, the years in order for phones, and the two debates with both views at equal weight.
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { cordPath, hangOf, knots, ladder, laneY, placeBars, relation, RELATION_WORD, ticks, TRACK, trackHeight, unitsFor, weightOf, x, type Weight } from "./geometry";
import { cordById, D, debateById, spanWord, XS, type Debate, type Exodus, type Stay } from "./model";
import { Head, OpenRecord, Prose, RefButton } from "./parts";

const ROW = { count: 64, measure: 104, hang: { count: { egypt: 142, canaan: 160 }, measure: { egypt: 188, canaan: 206 } } };
const EXODI: Exodus[] = ["count", "measure"];
const STAYS: Stay[] = ["egypt", "canaan"];
const VIEW = { count: 0, measure: 1 } as const;

type Change = (values: Record<string, string | null>) => void;

function Choice<T extends string>({ label, verse, name, value, options, onChange }: { label: string; verse: string; name: string; value: T | null; options: [T, string][]; onChange: Change }) {
  return <div className="xs-choice" role="group" aria-label={label}>
    <p><span>{label}</span> <RefButton label={verse} /></p>
    <div>{options.map(([id, words]) => <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange({ [name]: value === id ? null : id })}>{words}</button>)}</div>
  </div>;
}

function Strand({ from, to, y, weight, canaan = false }: { from: number; to: number; y: number; weight: Weight; canaan?: boolean }) {
  return <path className={`xs-strand ${weight}${canaan ? " canaan" : ""}`} d={cordPath(from, to, y)} />;
}

function Chart({ exodus, stay }: { exodus: Exodus | null; stay: Stay | null }) {
  const { bars, nails, lanes } = placeBars();
  const height = trackHeight(lanes);
  const peg = XS.cords.peg;
  const bottom = laneY(lanes);
  return <svg className="xs-track" viewBox={`0 0 ${TRACK.width} ${height}`} role="img"
    aria-label={`A track of years from ${XS.chart.from} to ${XS.chart.drawnTo} BC. Above the line, cords from 1 Kings 6:1 hang from Solomon's fourth year, about ${peg} BC, to about ${XS.cords.exodus.count} and about ${XS.cords.exodus.measure} BC, and the 430 years of Exodus 12:40 hang from each. Below the line, the ground's dated ranges. Two outside records, Merneptah and Shoshenq, cross both as nails. The list under the drawing gives every year shown.`}>
    <rect className="xs-ground" x={TRACK.left} y={TRACK.line} width={TRACK.width - TRACK.left - TRACK.right} height={bottom - TRACK.line} />
    {ticks().map((year) => <g key={year} className="xs-tick"><line x1={x(year)} x2={x(year)} y1={TRACK.top} y2={bottom} /><text x={x(year)} y={TRACK.line + 13} textAnchor="middle">{year}</text></g>)}
    <line className="xs-line" x1={TRACK.left} x2={TRACK.width - TRACK.right} y1={TRACK.line} y2={TRACK.line} />
    <text className="xs-band" x={TRACK.left + 2} y={TRACK.top - 8}>Scripture's spans · cords</text>
    <text className="xs-band" x={TRACK.left + 2} y={TRACK.line + 30}>The ground's ranges · bars</text>
    {nails.map((n) => { const [start, end] = n.spans[0]; const a = x(start), b = x(end), mid = (a + b) / 2, half = Math.max(2.5, (b - a) / 2);
      return <g key={n.id} className="xs-nail"><title>{`${n.name}: ${spanWord(n.spans[0])}`}</title>
        <rect x={mid - half - 4} y={TRACK.top + 4} width={half * 2 + 8} height={5} rx={1.5} />
        <path d={`M${mid - half} ${TRACK.top + 9}V${bottom - 6}L${mid} ${bottom + 4}L${mid + half} ${bottom - 6}V${TRACK.top + 9}Z`} />
        <text x={mid - 4} y={bottom + 18} textAnchor="end">{n.name} · {spanWord(n.spans[0])}</text></g>; })}
    <g className="xs-peg"><path d={`M${x(peg)} ${TRACK.top + 18}V${TRACK.line}`} /><circle cx={x(peg)} cy={ROW.count} r={3.2} />
      <text x={x(peg) - 8} y={TRACK.top + 14} textAnchor="end">Solomon's fourth year · about {peg} BC</text></g>
    {EXODI.map((which) => { const end = XS.cords.exodus[which]; const weight = weightOf(which, exodus); const y = ROW[which];
      return <g key={which} className={`xs-cord ${weight}`}>
        <Strand from={peg} to={end} y={y} weight={weight} />
        {which === "measure" && knots(peg, end, XS.cords.generations).map((kx) => <circle key={kx} className="xs-knot" cx={kx} cy={y + 2} r={2.1} />)}
        <path className="xs-about" d={`M${x(end) + 7} ${y - 8}H${x(end)}V${y + 8}H${x(end) + 7}`} />
        <path className="xs-plumb" d={`M${x(end)} ${y + 8}V${bottom}`} />
        <text className="xs-cord-label" x={x(end) + 10} y={y - 8}>{which === "count" ? "480 as a count" : `480 as ${XS.cords.generations} generations`} · about {end} BC</text>
      </g>; })}
    {EXODI.map((which) => STAYS.map((reading) => { const hang = hangOf(which, reading); const y = ROW.hang[which][reading];
      const weight: Weight = exodus && exodus !== which ? "aside" : weightOf(reading, stay);
      return <g key={`${which}-${reading}`} className={`xs-cord ${weight}`}>
        <Strand from={hang.egypt[1]} to={hang.egypt[0]} y={y} weight={weight} />
        {hang.canaan && <Strand from={hang.canaan[1]} to={hang.canaan[0]} y={y} weight={weight} canaan />}
        <circle className="xs-knot" cx={x(hang.egypt[0])} cy={y} r={2.4} />
        <text className="xs-cord-label" x={x(hang.egypt[1]) - 6} y={y - 4} textAnchor="end">{reading === "egypt" ? "430 in Egypt" : "215 in Egypt, 215 before it in Canaan"} · from {hang.egypt[1]} BC</text>
      </g>; }))}
    {bars.map((b) => <g key={b.id} className="xs-bar-group"><title>{`${b.name}: ${b.spans.map(spanWord).join(" or ")}`}</title>
      {b.spans.map(([start, end], i) => <rect key={start} className={`xs-bar${i > 0 ? " alt" : ""}`} x={x(start)} y={laneY(b.lane) + 12} width={Math.max(3, x(end) - x(start))} height={11} rx={2} />)}
      <text className="xs-bar-label" x={b.labelX} y={laneY(b.lane) + 9}>{b.name}</text></g>)}
    <g className="xs-loose"><path d={cordPath(XS.chart.from, XS.chart.from - XS.cords.lengths["300"], bottom + 36)} />
      <text x={x(XS.chart.from) + unitsFor(XS.cords.lengths["300"]) + 8} y={bottom + 39}>Judges 11:26 · 300 years at this scale, not pinned: Jephthah's own year is a reconstruction</text></g>
  </svg>;
}

function Falls({ exodus }: { exodus: Exodus | null }) {
  const rows = [...D.timeline.ground, ...D.timeline.fixed].flatMap((b) => (XS.bars[b.id] ?? []).map((span, i) => ({ key: `${b.id}${i}`, name: b.name, span, alt: i > 0 })))
    .sort((a, b) => b.span[0] - a.span[0]);
  return <div className="xs-falls">
    <h3>Where each date falls</h3>
    <table>
      <thead><tr><th scope="col">Range, on the ground or in an outside record</th>{EXODI.map((w) => <th key={w} scope="col" className={exodus && exodus !== w ? "aside" : ""}>About {XS.cords.exodus[w]} BC</th>)}</tr></thead>
      <tbody>{rows.map((r) => <tr key={r.key}><th scope="row">{r.name}{r.alt ? ", low dating" : ""} <small>{spanWord(r.span)}</small></th>
        {EXODI.map((w) => <td key={w} className={exodus && exodus !== w ? "aside" : ""}>{RELATION_WORD[relation(XS.cords.exodus[w], r.span)]}</td>)}</tr>)}</tbody>
    </table>
    <p className="xs-caption">Arithmetic only: a date coming before or after a range says nothing about who did what at the site. The station records say what each find can and cannot show.</p>
  </div>;
}

function Ladder({ exodus, stay }: { exodus: Exodus | null; stay: Stay | null }) {
  return <ol className="xs-ladder" aria-label="Every year on the track, oldest first">{ladder(exodus, stay).map((row, i) => <li key={i} className={row.kind}>
    <b>{row.kind === "cord" ? `about ${row.years[0]} BC` : spanWord(row.years)}</b><span>{row.label}</span><small>{row.kind === "cord" ? "a cord's end" : row.kind === "nail" ? "an outside record" : "the ground"}</small>
  </li>)}</ol>;
}

function DebateViews({ debate, chosen }: { debate: Debate; chosen: number | null }) {
  return <div className="xs-debate">
    <h3><Checked text={debate.name} /> <small>shown, not chosen</small></h3>
    <div className="xs-views">{debate.views.map((v, i) => <article key={v.name} className={chosen === i ? "chosen" : ""}>
      <h4><Checked text={v.name} /></h4>
      <p className="xs-held"><b>Held by</b> <Prose text={v.held} /></p>
      {v.forIt && <p><b>For it</b> <Prose text={v.forIt} /></p>}
      {v.against && <p><b>Against it</b> <Prose text={v.against} /></p>}
      {v.wouldShow && <p className="xs-would"><b>What would show it</b> <Prose text={v.wouldShow} /></p>}
    </article>)}</div>
  </div>;
}

export function Track({ exodus, stay, onChange }: { exodus: Exodus | null; stay: Stay | null; onChange: Change }) {
  const jewish = D.stations[0].records.find((r) => r.id === "jewish");
  const measure = cordById.get("480measure");
  return <>
    <Head num="01" kicker="Cords and nails" title="Three numbers." turn="Two ways each."
      lead="Every exodus date hangs Scripture's numbers from one point and sees where they fall among the ground's ranges. Choose a reading of each number: its cords move; the nails and bars stay put." />
    <div className="xs-choices">
      <Choice label="Read the 480 years" verse="1 Kings 6:1" name="span480" value={exodus} onChange={onChange}
        options={[["count", "As a count of years"], ["measure", `As ${XS.cords.generations} generations`]]} />
      <Choice label="Read the 430 years" verse="Exodus 12:40" name="span430" value={stay} onChange={onChange}
        options={[["egypt", "In Egypt alone"], ["canaan", "In Egypt and Canaan"]]} />
      <p className="xs-chosen" aria-live="polite">{exodus || stay ? "Your reading is drawn solid; the other is dashed. Choose it again to set it aside." : "Nothing is chosen: both readings of each number are drawn alike."}</p>
    </div>
    <div className="xs-chart"><Chart exodus={exodus} stay={stay} /></div>
    <div className="xs-key">
      <p><Prose text={D.timeline.key} /></p>
      <p><Prose text={D.reach[2]} /> The bracket at a cord's end marks "about": its peg, Solomon's fourth year, is itself a reckoning (Old Testament chronology).</p>
      <p>{measure && <Checked text={measure.note} />} The {XS.cords.generations} knots stand for the record's {XS.cords.generations} generations and are spaced evenly as a drawing convention, not as a length for each generation. The track runs on to {XS.chart.drawnTo} BC, past the record's {XS.chart.to}, so the gates' low dating is drawn whole.</p>
    </div>
    <Ladder exodus={exodus} stay={stay} />
    <Falls exodus={exodus} />
    <div className="xs-debates">
      <DebateViews debate={debateById.get("exodusDate")!} chosen={exodus ? VIEW[exodus] : null} />
      <div>
        {jewish && <div className="xs-jewish"><p className="xs-kicker">The Jewish reading first</p><p><Prose text={jewish.evidence} /></p><OpenRecord station="egypt" record="jewish">Read the whole record</OpenRecord></div>}
        <DebateViews debate={debateById.get("sojourn")!} chosen={stay ? (stay === "egypt" ? 0 : 1) : null} />
      </div>
    </div>
  </>;
}
