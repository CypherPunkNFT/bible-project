// 01 Four houses: the plans laid over one another at one scale, centred on the inner room, with the chosen house lit; its
// measurements in cubits with metric estimates; its record in three parts. Then the site's stance, and the houses on a straight
// line of time (the tabernacle not placed). Every number drawn is the build script's, checked against the record and the Berean.
import { formatNumber } from "@/lib/site-format";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { axisYear, D, findHouse, metres, tagsOf, TD, yearWord, type House, type Shape } from "./model";
import { Head, Prose, RefButton, Refs, Tags, ThreeParts } from "./parts";

const KIND_WORD: Record<Shape["kind"], string> = { scripture: "Scripture gives it", berean: "Scripture gives it", inferred: "inferred", mishnah: "the Mishnah gives it" };
const CLOSE = { x: -34, y: -31, w: 118, h: 62 };

function shapeClass(shape: Shape, chosen: string): string {
  return `tw-shape tw-k-${shape.kind}${shape.house === chosen ? " on" : ""}`;
}

/** The close view: every house's rooms in cubits, the inner room's centre at 0,0, east to the right. */
function ClosePlan({ chosen }: { chosen: string }) {
  const shapes = TD.plans.filter((p) => p.kind !== "mishnah");
  const lit = shapes.filter((p) => p.house === chosen);
  return <svg className="tw-plan" viewBox={`${CLOSE.x} ${CLOSE.y} ${CLOSE.w} ${CLOSE.h}`} role="img"
    aria-label={`Plans of the four houses at one scale, centred on the inner room; ${findHouse(chosen).name} is lit.`}>
    <path className="tw-grid" d={Array.from({ length: 12 }, (_, i) => `M${-30 + i * 10} ${CLOSE.y + 2}v${CLOSE.h - 9}`).join("")} />
    {shapes.filter((p) => p.house !== chosen).map((p) => <rect key={p.id} className={shapeClass(p, chosen)} x={p.x} y={p.y} width={p.w} height={p.h} />)}
    {lit.map((p) => <rect key={p.id} className={shapeClass(p, chosen)} x={p.x} y={p.y} width={p.w} height={p.h} />)}
    {chosen === "second" && <text className="tw-plan-note" x="25" y="-16" textAnchor="middle">No plan survives: nothing is drawn</text>}
    {lit.map((p) => <text key={p.id} className="tw-plan-label" x={p.x + p.w - 1} y={p.y + p.h - 1.4} textAnchor="end">{p.part}{p.kind === "inferred" ? " · inferred" : ""}</text>)}
    <rect className="tw-room" x="-1.2" y="-1.2" width="2.4" height="2.4" />
    <path className="tw-axis" d={`M-30 ${CLOSE.y + CLOSE.h - 5}h50`} />
    <text className="tw-axis-t" x="-30" y={CLOSE.y + CLOSE.h - 1.4}>{`Scale: ${formatNumber(50)} cubits, about ${metres(50)} m`}</text>
    <text className="tw-axis-t" x={CLOSE.x + CLOSE.w - 2} y={CLOSE.y + 2.6} textAnchor="end">east →</text>
  </svg>;
}

/** The wide view: the Mishnah's 500-cubit square beside the tabernacle's court and Solomon's house, all at one scale. */
function WidePlan() {
  const square = TD.plans.find((p) => p.id === "her-square")!;
  const court = TD.plans.find((p) => p.id === "tab-court")!;
  const house = TD.plans.find((p) => p.id === "sol-house")!;
  return <svg className="tw-plan" viewBox="-20 -40 780 580" role="img"
    aria-label={`The Mishnah's square of ${square.w} cubits beside the tabernacle's court of ${court.w} by ${court.h} and Solomon's house of ${house.w} by ${house.h}, at one scale.`}>
    <rect className="tw-shape tw-k-mishnah on" x="0" y="0" width={square.w} height={square.h} />
    <text className="tw-plan-label tw-big" x="250" y="250" textAnchor="middle">{`The Mishnah's square, ${square.w} cubits a side`}</text>
    <text className="tw-plan-label tw-big" x="250" y="280" textAnchor="middle">where the house stood in it is not drawn</text>
    <rect className="tw-shape tw-k-scripture on" x="560" y="0" width={court.w} height={court.h} />
    <text className="tw-plan-label tw-big" x="560" y="80">Tabernacle court</text>
    <rect className="tw-shape tw-k-scripture on" x="560" y="130" width={house.w} height={house.h} />
    <text className="tw-plan-label tw-big" x="560" y="182">Solomon's house</text>
    <path className="tw-axis" d="M0 525h500" />
    <text className="tw-axis-t tw-big" x="0" y="560">0</text><text className="tw-axis-t tw-big" x="500" y="560" textAnchor="end">{`500 cubits, about ${metres(500)} m`}</text>
  </svg>;
}

type Row = { part: string; size: string; metric: string; kind: string; verse?: string };
function rowsFor(house: House): Row[] {
  if (house.id === "second") {
    return [{ part: "The decree's house", size: `${TD.decree.h} high, ${TD.decree.w} wide; no length`, metric: `about ${metres(TD.decree.w)} m`, kind: "Scripture gives it, as a decree, not a survey", verse: TD.decree.verse }];
  }
  const rows: Row[] = TD.plans.filter((p) => p.house === house.id).map((p) => ({
    part: p.part, size: `${p.w} × ${p.h}`, metric: `about ${metres(p.w)} × ${metres(p.h)} m`, kind: KIND_WORD[p.kind], verse: p.verse,
  }));
  if (house.id === "solomon") rows.splice(2, 0, { part: "Hall", size: `${TD.hall.l} long`, metric: `about ${metres(TD.hall.l)} m`, kind: KIND_WORD.scripture, verse: TD.hall.verse });
  return rows;
}

function Measures({ house }: { house: House }) {
  return <table className="tw-measures">
    <caption>{`${house.name}: what is measured, and who measures it`}</caption>
    <thead><tr><th scope="col">Part</th><th scope="col">Cubits</th><th scope="col">Metres, an estimate</th><th scope="col">Witness</th></tr></thead>
    <tbody>{rowsFor(house).map((r) => <tr key={r.part}><th scope="row">{r.part}</th><td>{r.size}</td><td>{r.metric}</td>
      <td>{r.kind}{r.verse && <> · <RefButton label={r.verse} /></>}</td></tr>)}</tbody>
  </table>;
}

export function Houses({ chosen, scale, onChange }: { chosen: string; scale: "close" | "wide"; onChange: (values: Record<string, string | null>) => void }) {
  const house = findHouse(chosen);
  return <>
    <Head num="01" kicker="Four houses" title="One holy room." turn="Four houses."
      lead="Choose a house to light its plan. Solid lines are measurements Scripture or the Mishnah gives; dashed lines are this study's inference, and say so." />
    <div className="tw-houses">
      <ul className="tw-house-list" aria-label="The four houses">
        {D.houses.map((h) => <li key={h.id}><button type="button" className="tw-house" aria-pressed={h.id === house.id} onClick={() => onChange({ house: h.id })}>
          <b>{String(h.num).padStart(2, "0")}</b><span>{h.name}</span></button></li>)}
      </ul>
      <figure className="tw-plan-fig">
        <div className="tw-scale" role="group" aria-label="Scale">
          <button type="button" aria-pressed={scale === "close"} onClick={() => onChange({ scale: null })}>The houses</button>
          <button type="button" aria-pressed={scale === "wide"} onClick={() => onChange({ scale: "wide" })}>The courts, 500 cubits</button>
        </div>
        {scale === "wide" ? <WidePlan /> : <ClosePlan chosen={house.id} />}
        <figcaption className="tw-caption">{scale === "wide"
          ? "The Mishnah's square does not match the walls in the ground, which make a larger, uneven platform (see section 03). It is drawn at its own number, not placed."
          : "The small square marks the inner room's centre, where every house kept its most holy place. The tent's place inside its court is not given; it is drawn in the western half, as most reconstructions draw it."}</figcaption>
      </figure>
    </div>
    <div className="tw-house-record">
      <h3><Checked text={house.name} /> <Tags kinds={tagsOf(`house:${house.id}`)} /></h3>
      <Measures house={house} />
      <ThreeParts evidence={house.evidence} inference={house.inference} limit={house.limit} />
      <Refs labels={house.verses} />
    </div>
  </>;
}

/** The site's stance, under the four houses (the design note's place for it). */
export function Stance() {
  const s = D.stance;
  return <aside className="tw-stance" aria-label={s.head}>
    <div>
      <p className="tw-kicker">{s.head}</p>
      <p className="tw-confession"><Checked text={s.confession} /><small>{s.confessionSource}</small></p>
      <Refs labels={s.verses} lead="The text itself" />
    </div>
    <div>
      <p className="tw-para"><Prose text={s.body} /></p>
      <p className="tw-para tw-muted"><Prose text={s.meaning} /></p>
    </div>
  </aside>;
}

/** The houses on one straight line of time. The tabernacle has no bar: its start depends on the exodus, which is not dated here. */
export function TimeStrip() {
  const { from, to, rows } = D.timeline;
  const span = axisYear(to) - axisYear(from);
  const at = (year: number) => ((axisYear(year) - axisYear(from)) / span) * 100;
  const ticks = [-1500, -1000, -500, 1];
  return <figure className="tw-time">
    <figcaption className="tw-kicker">{`When each house stood · ${yearWord(from)} to ${yearWord(to)}`}</figcaption>
    <ol>
      {rows.map((r) => <li key={r.id} className={`tw-time-row tw-time-${r.kind}`}>
        <span className="tw-time-name">{r.name}</span>
        <span className="tw-time-track">
          {r.start === null || r.end === null
            ? <span className="tw-time-none">Not placed</span>
            : <span className="tw-time-bar" style={{ left: `${at(r.start)}%`, width: `${Math.max(at(r.end) - at(r.start), 0.6)}%` }} />}
        </span>
        <span className="tw-time-note"><Prose text={r.note} /></span>
      </li>)}
    </ol>
    <div className="tw-time-axis" aria-hidden="true">{ticks.map((y) => <span key={y} style={{ left: `${at(y)}%` }}>{yearWord(y)}</span>)}</div>
  </figure>;
}
