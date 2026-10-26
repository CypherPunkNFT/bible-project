// One constellation for any category: Moses at the centre, one ring per relationship, each in its own colour. Choosing a
// point draws a line to every other point it is joined to (a shared verse, or someone its own words name).
import { useMemo, type CSSProperties, type KeyboardEvent } from "react";
import { C, short } from "./field-layout";
import type { CategoryKey, RingDef } from "./around-data";
import { joinedTo, type Placed } from "./ring-layout";

/** `onCore`: what choosing the centre does (Moses's section opens his full connections); without it, it clears the choice. */
interface Props { name: string; kind: CategoryKey; rings: RingDef[]; points: Placed[]; only: string; chosen?: string; onChoose: (key: string | undefined) => void; onCore?: () => void }

function Mark({ kind, label }: { kind: CategoryKey; label: string }) {
  if (kind === "l") return <rect className="cn-dot" x={-6} y={-6} width={12} height={12} rx={2} transform="rotate(45)" />;
  if (kind === "x") return <rect className="cn-dot" x={-6} y={-7} width={12} height={14} rx={2} />;
  if (kind === "t") return <circle className="cn-dot" r={6} />;
  return <><circle className="cn-dot is-filled" r={10} /><text className="cn-initial" y={4}>{label[0]}</text></>;
}

export function RingField({ name, kind, rings, points, only, chosen, onChoose, onCore }: Props) {
  const radii = useMemo(() => {
    const seen = new Map<string, number>();
    for (const p of points) if (!seen.has(p.ring)) seen.set(p.ring, Math.hypot(p.x - C, p.y - C));
    return rings.filter((r) => seen.has(r.key)).map((r) => ({ ...r, r: seen.get(r.key) ?? 0 }));
  }, [rings, points]);
  const tone = useMemo(() => new Map(rings.map((r) => [r.key, r.tone])), [rings]);
  const chosenPoint = points.find((p) => p.key === chosen);
  const near = joinedTo(points, chosenPoint);
  const press = (event: KeyboardEvent, key: string) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onChoose(key || undefined); } };
  return (
    <svg className={`cn-svg ar-svg${chosenPoint ? " has-sel" : ""}`} viewBox="-90 -10 1180 1020" role="group" aria-label={`${name} and what is around him`} data-only="all">
      {radii.map(({ key, label, r }) => <g key={key}><circle className="cn-ring" cx={C} cy={C} r={r} /><text className="cn-ringlabel" x={C} y={C - r + 4}>{label}</text></g>)}
      <g className="cn-links">{chosenPoint && points.filter((p) => near.has(p.key)).map((p) => (
        <path key={`${chosenPoint.key}-${p.key}`} style={{ stroke: tone.get(chosenPoint.ring) }} pathLength={1}
          d={`M${chosenPoint.x.toFixed(1)} ${chosenPoint.y.toFixed(1)} Q${C} ${C} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`} />))}</g>
      <g className="cn-nodes">{points.map((p, i) => {
        const cos = Math.cos(p.angle);
        const state = p.key === chosen ? " is-on" : near.has(p.key) ? " is-linked" : "";
        const dim = only !== "all" && p.ring !== only ? " is-dim" : "";
        return (
          <g key={`${p.ring}:${p.key}`} className={`cn-node${state}${dim}`} style={{ "--cn-tone": tone.get(p.ring) } as CSSProperties}
            transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`} tabIndex={dim ? -1 : 0} role="button" aria-pressed={p.key === chosen}
            aria-label={`${rings.find((r) => r.key === p.ring)?.label}: ${p.label}`}
            onClick={() => onChoose(p.key === chosen ? undefined : p.key)} onKeyDown={(e) => press(e, p.key)}>
            <g className="cn-pop" style={{ animationDelay: `${80 + i * 12}ms` }}>
              <circle className="cn-halo" r={16} />
              <Mark kind={kind} label={p.label} />
              <text className="cn-label" textAnchor={cos < -0.2 ? "end" : cos > 0.2 ? "start" : "middle"}
                x={(cos * 16).toFixed(1)} y={(Math.sin(p.angle) * 19 + 4).toFixed(1)}>{short(p.label)}</text>
            </g>
          </g>);
      })}</g>
      <g className="cn-core" role="button" tabIndex={0} aria-label={onCore ? `Open all of ${name}'s connections` : `Back to ${name}`}
        onClick={() => (onCore ? onCore() : onChoose(undefined))} onKeyDown={(e) => { if (onCore && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onCore(); } else press(e, ""); }}>
        <circle className="cn-core-ring" cx={C} cy={C} r={64} /><circle cx={C} cy={C} r={50} />
        <text x={C} y={C + 7}>{short(name, 14)}</text>
      </g>
    </svg>
  );
}
