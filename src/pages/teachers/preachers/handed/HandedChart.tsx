// 06 · Who passed it to whom: the chart. Every linked teacher's life as a lane (1500–today), every documented link as a
// curve between two lanes; the chosen chain is lit and numbered, the others fade back.
import type { MutableRefObject } from "react";
import type { Person } from "@/data/teachers/pages-types";
import { THIS_YEAR, familyOf, lifeEnd } from "../../shared/people";
import { curveOf, type Link } from "./model";

interface Props {
  width: number;
  lanes: Person[][];
  links: Link[];
  /** The chosen chain's people and links (null for "All links"), and each lit link's number. */
  focus: { people: Set<string>; links: Set<number> } | null;
  numbers: Map<number, number>;
  hot: number | null;
  arcs: MutableRefObject<Map<number, SVGPathElement>>;
  badges: MutableRefObject<Map<number, SVGGElement>>;
  onOpen: (id: string, origin: Element) => void;
}

/** Keeps a map of elements by key, so the chain can be drawn in imperatively. */
const track = <T extends Element>(map: Map<number, T>, key: number) => (el: T | null) => { if (el) map.set(key, el); else map.delete(key); };

export function HandedChart({ width, lanes, links, focus, numbers, hot, arcs, badges, onOpen }: Props) {
  const narrow = width < 640, padL = narrow ? 56 : 74, padR = 12, top = 30, pitch = narrow ? 14 : 17, gap = narrow ? 8 : 12;
  const X = (y: number) => padL + ((y - 1500) / (THIS_YEAR - 1500)) * (width - padL - padR);
  const laneY = new Map<string, number>();
  let y = top;
  for (const group of lanes) { for (const p of group) { laneY.set(p.id, y); y += pitch; } y += gap; }
  const height = y - gap + 6;
  const centuries = [1500, 1600, 1700, 1800, 1900, 2000];
  return <svg className={`hand-svg${focus ? " focus" : ""}`} width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Documented links between lives">
    {centuries.map((c) => <g key={c}>
      <line x1={X(c)} x2={X(c)} y1={20} y2={height} stroke="var(--line)" />
      <text x={X(c)} y={12} textAnchor="middle" fontSize={10} fill="var(--muted)">{c}</text>
    </g>)}
    {lanes.flat().map((p) => {
      const ly = laneY.get(p.id) ?? 0;
      return <g key={p.id} className={`hand-lane${focus?.people.has(p.id) ? " on" : ""}`}>
        <line x1={X(p.born)} x2={X(lifeEnd(p))} y1={ly} y2={ly} stroke={`var(${familyOf(p).tone})`} strokeWidth={3} strokeLinecap="round" />
        <text className="hand-who" x={X(p.born) - 6} y={ly + 3.5} textAnchor="end" fontSize={narrow ? 9.5 : 11} fill="var(--ink)" onClick={(e) => onOpen(p.id, e.currentTarget)}>{p.short}</text>
      </g>;
    })}
    {links.map((l) => {
      const c = curveOf(l, laneY, X), lit = Boolean(focus?.links.has(l.k)), n = numbers.get(l.k);
      const arcClass = `hand-arc${focus && lit ? " on" : ""}${hot === l.k ? " hot" : ""}`;
      return <g key={l.k} className={`hand-link${lit || !focus ? " on" : ""}`} data-k={l.k}>
        <path ref={track(arcs.current, l.k)} className={arcClass} d={c.d} />
        <circle cx={c.x1} cy={c.ya} r={2.6} fill="var(--accent)" />
        <circle cx={c.x2} cy={c.yb} r={2.6} fill="var(--accent)" />
        <g ref={track(badges.current, l.k)} className={`hand-num${n ? " on" : ""}`} transform={`translate(${c.badgeX},${(c.ya + c.yb) / 2})`}>
          <circle r={7.5} /><text textAnchor="middle" y={3.3}>{n ?? ""}</text>
        </g>
        <path className="hand-hit" d={c.d} />
      </g>;
    })}
  </svg>;
}
