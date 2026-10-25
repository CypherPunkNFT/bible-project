// The constellation (approved on the Moses mock-ups, design/README.md): the chosen person, place or topic at the centre,
// rings of what it is joined to around it. Choosing a point draws a line to every other point named in the same verses.
import { useMemo, type KeyboardEvent } from "react";
import { C, RING_NAME, linkedTo, ringRadii, short, type Point, type Ring } from "./field-layout";

interface Props { name: string; points: Point[]; only: Ring | "all"; chosen?: string; onChoose: (key: string | undefined) => void }

export function Constellation({ name, points, only, chosen, onChoose }: Props) {
  const rings = useMemo(() => ringRadii(points), [points]);
  const chosenPoint = points.find((p) => p.key === chosen);
  const near = linkedTo(points, chosenPoint);
  const press = (event: KeyboardEvent, key: string) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onChoose(key); } };
  return (
    <svg className={`cn-svg${chosenPoint ? " has-sel" : ""}`} viewBox="-90 -10 1180 1020" role="group" aria-label={`${name} and what it is joined to`} data-only={only}>
      {rings.map(({ ring, r }) => <g key={ring}><circle className="cn-ring" cx={C} cy={C} r={r} /><text className="cn-ringlabel" x={C} y={C - r + 4}>{RING_NAME[ring]}</text></g>)}
      <g className="cn-spokes">{points.map((p) => <line key={p.key + p.ring} className={`is-${p.ring}${p.key === chosen ? " is-on" : ""}`} x1={C} y1={C} x2={p.x} y2={p.y} />)}</g>
      <g className="cn-links">{chosenPoint && points.filter((p) => near.has(p.key)).map((p) => (
        <path key={`${chosenPoint.key}-${p.key}`} className={`is-${chosenPoint.ring}`} pathLength={1}
          d={`M${chosenPoint.x.toFixed(1)} ${chosenPoint.y.toFixed(1)} Q${C} ${C} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`} />))}</g>
      <g className="cn-nodes">{points.map((p, i) => {
        const cos = Math.cos(p.angle);
        const state = p.key === chosen ? " is-on" : near.has(p.key) ? " is-linked" : "";
        return (
          <g key={p.key + p.ring} className={`cn-node is-${p.ring}${state}`} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}
            tabIndex={0} role="button" aria-pressed={p.key === chosen} aria-label={`${RING_NAME[p.ring]}: ${p.label}`}
            onClick={() => onChoose(p.key === chosen ? undefined : p.key)} onKeyDown={(e) => press(e, p.key)}>
            <g className="cn-pop" style={{ animationDelay: `${120 + i * 14}ms` }}>
              <circle className="cn-halo" r={15} />
              {p.ring === "l" ? <rect className="cn-dot" x={-6} y={-6} width={12} height={12} rx={2} transform="rotate(45)" />
                : p.ring === "x" ? <rect className="cn-dot" x={-6} y={-7} width={12} height={14} rx={2} />
                : <circle className="cn-dot" r={p.ring === "t" ? 6 : 9} />}
              {(p.ring === "p" || p.ring === "fam") && <text className="cn-initial" y={4}>{p.label[0]}</text>}
              <text className="cn-label" textAnchor={cos < -0.2 ? "end" : cos > 0.2 ? "start" : "middle"}
                x={(cos * 15).toFixed(1)} y={(Math.sin(p.angle) * 18 + 4).toFixed(1)}>{short(p.label)}</text>
            </g>
          </g>);
      })}</g>
      <g className="cn-core" role="button" tabIndex={0} aria-label={`Back to ${name}`} onClick={() => onChoose(undefined)} onKeyDown={(e) => press(e, "")}>
        <circle className="cn-core-ring" cx={C} cy={C} r={64} /><circle cx={C} cy={C} r={50} />
        <text x={C} y={C + 7}>{short(name, 14)}</text>
      </g>
    </svg>
  );
}
