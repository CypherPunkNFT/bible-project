// The year wheel: the stone's eight seasons drawn as twelve months. The list of buttons beside it is the keyboard and screen reader
// control; the arcs only repeat it for a pointer, so they stay out of the tab order and the wheel reads as one described image.
import { arcPath, D, months, seasonById, seasonMiddle, wheelPoint } from "./model";

const OUTER = 164, INNER = 106, RING = 96;

function Chords({ chords }: { chords: [string, string][] }) {
  return <g className="fy-chords">{chords.map(([from, to]) => {
    const a = seasonById.get(from), b = seasonById.get(to);
    if (!a || !b) { console.error(`The farming year page: the chord ${from} to ${to} names a season that is not in the record`); return null; }
    const [ax, ay] = wheelPoint(seasonMiddle(a), INNER - 3), [bx, by] = wheelPoint(seasonMiddle(b), INNER - 3);
    return <g key={`${from}-${to}`}><path d={`M${ax.toFixed(2)} ${ay.toFixed(2)}Q200 200 ${bx.toFixed(2)} ${by.toFixed(2)}`} /><circle cx={ax} cy={ay} r="4" /><circle cx={bx} cy={by} r="4" /></g>;
  })}</g>;
}

export function Wheel({ lit, chosen, chords, centre, label, onPick }: {
  lit: string[]; chosen?: string; chords?: [string, string][]; centre?: [string, string]; label: string; onPick?: (id: string) => void;
}) {
  return <svg className="fy-wheel" viewBox="0 0 400 400" role="img" aria-label={label}>
    {months().map((month, i) => {
      const [x, y] = wheelPoint(i, 183), [ax, ay] = wheelPoint(i, OUTER + 2), [bx, by] = wheelPoint(i, OUTER + 9);
      return <g key={month}><path className="fy-tick" d={`M${ax.toFixed(2)} ${ay.toFixed(2)}L${bx.toFixed(2)} ${by.toFixed(2)}`} /><text className="fy-month" x={x} y={y} textAnchor="middle" dominantBaseline="middle">{month}</text></g>;
    })}
    {D.seasons.map((season, i) => {
      const on = lit.includes(season.id), [x, y] = wheelPoint(seasonMiddle(season), (OUTER + INNER) / 2);
      return <g key={season.id} className={`fy-arc${on ? " on" : ""}${chosen === season.id ? " chosen" : ""}${onPick ? " can" : ""}`} onClick={onPick ? () => onPick(season.id) : undefined}>
        <path d={arcPath(season.start, season.months, OUTER, INNER)} />
        <text x={x} y={y} textAnchor="middle" dominantBaseline="central">{i + 1}</text>
      </g>;
    })}
    <circle className="fy-ring" cx="200" cy="200" r={RING} />
    {D.seasons.map((season) => {
      const month = (season.start + D.placing.laterMonths) % 12;
      const [ax, ay] = wheelPoint(month, RING - 6), [bx, by] = wheelPoint(month, RING + 6);
      return <path key={season.id} className="fy-ring-tick" d={`M${ax.toFixed(2)} ${ay.toFixed(2)}L${bx.toFixed(2)} ${by.toFixed(2)}`} />;
    })}
    {chords && <Chords chords={chords} />}
    {centre && !chords && <g className="fy-wheel-centre"><text x="200" y="192" textAnchor="middle">{centre[0]}</text><text className="sub" x="200" y="216" textAnchor="middle">{centre[1]}</text></g>}
  </svg>;
}

/** The small wheel beside a passage: only the lit arcs, nothing to read inside it. */
export function MiniWheel({ lit }: { lit: string[] }) {
  return <svg className="fy-mini" viewBox="30 30 340 340" aria-hidden="true">
    {D.seasons.map((season) => <path key={season.id} className={lit.includes(season.id) ? "on" : ""} d={arcPath(season.start, season.months, 164, 90)} />)}
  </svg>;
}

export function WheelKey() {
  return <ul className="fy-wheelkey">
    <li><svg viewBox="0 0 26 12" width="26" height="12" aria-hidden="true"><path d="M0 6h26" /></svg> Solid arcs: this study's placing, counted from one scholar's start for ingathering.</li>
    <li><svg viewBox="0 0 26 12" width="26" height="12" aria-hidden="true"><path d="M0 6h26" strokeDasharray="3 3" /></svg> Dashed ring: the same divisions a month later, as on a guide's page.</li>
    <li>Month names mark the middle of each month. They are this study's, and none is on the stone.</li>
  </ul>;
}
