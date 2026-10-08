// The drawer's "where and when" parts: the life ring (1500 to today), the mini map of every place they lived, and the
// life strip. The strip and the map point at each other: pointing at a stay lights its dot (`lit` is the place index).
import type { PeopleData, Person } from "@/data/teachers/pages-types";
import { THIS_YEAR, lifeEnd } from "../../shared/people";
import { initials } from "./helpers";
import { lifeSegments, placeMapOf } from "./map";

const RING_START = 1500;

/** A ring standing for 1500 to today with the person's own lifetime drawn in their family colour. */
export function LifeRing({ person, size }: { person: Person; size: number }) {
  const r = 26, c = 32, span = THIS_YEAR - RING_START;
  const angle = (year: number) => -Math.PI / 2 + ((year - RING_START) / span) * Math.PI * 2;
  const point = (year: number) => [c + r * Math.cos(angle(year)), c + r * Math.sin(angle(year))];
  const [x1, y1] = point(person.born), [x2, y2] = point(lifeEnd(person));
  const large = (lifeEnd(person) - person.born) / span > 0.5 ? 1 : 0;
  return <svg className="drw-ring" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="32" r={r} style={{ fill: "none", stroke: "var(--line)", strokeWidth: 3 }} />
    <path d={`M${x1.toFixed(2)} ${y1.toFixed(2)}A${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`}
      style={{ fill: "none", stroke: "var(--tone)", strokeWidth: 5, strokeLinecap: "round" }} />
    <text x="32" y="37.5" textAnchor="middle" style={{ fill: "var(--ink)", font: "600 15px var(--serif)" }}>{initials(person)}</text>
  </svg>;
}

export function PlaceMap({ data, person, lit }: { data: PeopleData; person: Person; lit: number | null }) {
  const model = placeMapOf(data, person);
  if (!model) return null;
  const { k } = model;
  return <>
    <svg className="drw-map" viewBox={model.viewBox} role="img" aria-label={`Map of the places ${person.short} lived`}>
      <path className="drw-land" d={model.land} />
      {model.route.length > 1 && <polyline className="drw-route" pathLength={1} points={model.route.map((q) => q.join(",")).join(" ")} style={{ strokeWidth: `${2 * k}px` }} />}
      {model.points.map((q, i) => {
        const birth = i === 0 && person.birthplaceKnown !== false;
        return <circle key={i} className={`drw-pt${birth ? " drw-birth" : ""}${lit === i ? " drw-lit" : ""}`} data-place={i} cx={q[0]} cy={q[1]} r={(i === 0 ? 5 : 4) * k} />;
      })}
      <g className="drw-labels">
        {model.labels.map((label) => <text key={label.key} x={label.x} y={label.y} textAnchor={label.anchor} style={{ fontSize: `${label.size}px` }}>{label.text}</text>)}
      </g>
    </svg>
    <p className="drw-note">{person.birthplaceKnown === false
      ? `Birthplace not recorded; the map starts at the earliest place known, ${person.places[0][0]}.`
      : "Filled dot: birthplace. The line follows each move in order."}</p>
  </>;
}

export function LifeStrip({ person, lit }: { person: Person; lit: number | null }) {
  const end = lifeEnd(person), span = Math.max(1, end - person.born);
  return <>
    <div className="drw-strip">
      {lifeSegments(person, end).map((s) => <button key={`${s.index}-${s.from}`} type="button" data-place={s.index} className={lit === s.index ? "drw-lit" : undefined}
        style={{ flex: `${Math.max(1, s.to - s.from)} 1 0` }} title={`${s.name}, from ${s.from}`}>
        <i /><span>{s.name}</span><small>{s.from}</small>
      </button>)}
    </div>
    <div className="drw-strip-ends"><span>Born {person.circa ? "c. " : ""}{person.born}</span><span>{person.died ? `Died ${person.died} · about ${span} years` : "Living"}</span></div>
  </>;
}
