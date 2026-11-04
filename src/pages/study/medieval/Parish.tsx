// Section 05: a walk through a parish church, west to east, on an illustrative floor plan of no one church. Each of six stops gives the rule, what
// this study draws from the records, and how little shows whether it was kept. The list is the interface. Where a stop touches baptism or the Supper,
// the site's own word stands beside the report and is marked as the site's.
import { D, findSpot, PLAN_STOPS, type Spot } from "./model";
import { Cite, Head, Picture, Quote } from "./parts";

function FloorPlan({ spot, onSpot }: { spot: Spot; onSpot: (id: string) => void }) {
  const walk = D.parish.stations.map((s) => PLAN_STOPS[s.id].join(" ")).join("L");
  return <svg className="mv-plan" viewBox="0 0 640 270" role="img" aria-label="An illustrative floor plan of a parish church, seen from above, with a yard around it, a nave, and a smaller chancel to the east. Six numbered stops run from the yard to the altar. The list beside it gives each.">
    <rect className="mv-yard" x="14" y="24" width="612" height="226" rx="38" />
    <path className="mv-walls" d="M140 92H430V110H560V170H430V188H140Z" />
    <path className="mv-arch" d="M430 110V126M430 154V170" />
    <path className="mv-door" d="M192 188h28" />
    <circle className="mv-fontbowl" cx="186" cy="132" r="17" />
    <path className="mv-mural" d="M240 96H394" />
    <path className="mv-altartable" d="M544 122H556V158H544Z" />
    <text className="mv-compass" x="24" y="16">West</text><text className="mv-compass" x="616" y="16" textAnchor="end">East</text>
    <path className="mv-walk" d={`M${walk}`} />
    {D.parish.stations.map((s) => { const [x, y] = PLAN_STOPS[s.id], on = s.id === spot.id; return <g key={s.id} className={`mv-stop${on ? " on" : ""}`} onClick={() => onSpot(s.id)}>
      <circle cx={x} cy={y} r="14" /><text x={x} y={y + 5} textAnchor="middle">{Number(s.n)}</text>
    </g>; })}
  </svg>;
}

export function Parish({ spotId, onChange }: { spotId: string | null; onChange: (values: Record<string, string | null>) => void }) {
  const spot = findSpot(spotId), choose = (id: string) => onChange({ at: id });
  return <>
    <Head num="05" kicker="A walk to the altar" title={<>Six steps through a parish.<em> A rule at each. A silence after.</em></>}
      lead="Most people's whole church was one building, and most of them left no word about it. So this walk has rules and a few inspectors' notes, and says where those stop." />
    <div className="mv-parish">
      <div><FloorPlan spot={spot} onSpot={choose} /><p className="mv-caption">{D.parish.note}</p></div>
      <ol className="mv-spotlist">{D.parish.stations.map((s) => <li key={s.id}><button type="button" aria-pressed={s.id === spot.id} onClick={() => choose(s.id)}><b>{Number(s.n)}</b><strong>{s.name}</strong></button></li>)}</ol>
    </div>
    <div className={`mv-spotrecord${spot.picture ? " withpic" : ""}`} aria-live="polite">
      <div>
        <h3>{spot.name}</h3>
        <dl className="mv-three">
          <div><dt>The rule, in its own words</dt><dd>{spot.rule}</dd></div>
          <div><dt>What this study draws from the record</dt><dd>{spot.record}</dd></div>
          <div><dt>Where the evidence stops</dt><dd>{spot.limit}</dd></div>
        </dl>
        <Cite ids={spot.sources} />
      </div>
      {spot.picture && <Picture id={spot.picture} />}
    </div>
    {spot.stand && <aside className="mv-stand">
      <div><p className="mv-kicker">Where this site stands</p><p className="mv-para">{spot.stand}</p></div>
      <div>{(spot.standVerses ?? []).map((label) => <Quote key={label} label={label} />)}</div>
    </aside>}
  </>;
}
