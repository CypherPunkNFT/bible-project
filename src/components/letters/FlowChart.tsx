import type { MouseEvent, ReactNode } from "react";
import { StableTip } from "@/components/StableTip";
import type { Flow } from "@/data/letters/types";
import { useKeep } from "./letter-hooks";
import { ClaimText, KeepX, Refs } from "./LetterParts";

const W = 1000;
const NODE = 12;
const GAP = 8;
const LEFT = 150;
const RIGHT = W - 150;

type Node = { name: string; total: number; y: number; h: number };

/** Stack names top to bottom, each as tall as its share of the total. */
function stack(totals: Map<string, number>, unit: number): Map<string, Node> {
  let y = 20;
  const nodes = new Map<string, Node>();
  for (const [name, total] of totals) { const h = Math.max(4, total * unit); nodes.set(name, { name, total, y, h }); y += h + GAP; }
  return nodes;
}

/** Where the quotations come from: Old Testament books on the left, flowing into the letter (or its chapters) on the right. */
export function FlowChart({ flow }: { flow: Flow }) {
  const keep = useKeep<string>();
  const { active, kept } = keep;
  const sum = (key: "source" | "target") => {
    const m = new Map<string, number>();
    for (const l of flow.links) m.set(l[key], (m.get(l[key]) ?? 0) + l.value);
    return m;
  };
  const sources = new Map([...sum("source")].sort((a, b) => b[1] - a[1]));
  const targets = sum("target"); // keep the data's order (chapters / letters in canonical order)
  const total = flow.links.reduce((s, l) => s + l.value, 0);
  const tallest = Math.max(sources.size, targets.size);
  // Each quotation gets a few pixels, shrinking for big totals (all 21 letters) so the chart stays about 500px tall.
  const unit = Math.min(6, Math.max(1.5, (480 - tallest * GAP) / Math.max(1, total)));
  const left = stack(sources, unit), right = stack(targets, unit);
  const height = Math.max(...[...left.values(), ...right.values()].map((n) => n.y + n.h)) + 20;
  const usedL = new Map<string, number>(), usedR = new Map<string, number>();
  const focusOf = (name: string) => flow.links.filter((l) => l.source === name || l.target === name).sort((a, b) => b.value - a.value);
  // Hidden sizing copies carry the "let go" mark too, so keeping an item never makes the box grow.
  const keptMark = <KeepX onRelease={() => undefined} />;
  const flowResting = <span className="lg-muted">{total} quotations. Point at a book or a chapter to see the passages; click one to keep them open.</span>;
  const flowTip = (name: string, isKept: boolean, mark: ReactNode) => <>
    <strong>{name}</strong> <span className="lg-muted">· {focusOf(name).reduce((s, l) => s + l.value, 0)}{isKept ? "" : " · click to keep these open"}</span>{mark}
    <ul className="lg-flow-list">{focusOf(name).map((l) => <li key={`${l.source}→${l.target}`}>
      <b>{l.source === name ? l.target : l.source} · {l.value}</b><Refs refs={l.refs} limit={Infinity} />
    </li>)}</ul>
  </>;
  const node = (name: string) => ({
    className: keep.peek(name) ? "lg-peek" : undefined, style: { cursor: "pointer" }, tabIndex: 0, role: "button", "aria-pressed": kept === name,
    ...keep.bind(name),
  });
  const release = <tspan className="lg-flow-x" role="button" aria-label="Let go"
    onClick={(e: MouseEvent) => { e.stopPropagation(); keep.release(); }}>{"  ✕"}</tspan>;

  return <figure>
    <div className="lg-figure">
      <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label={`${flow.title}: ${total} quotations from ${sources.size} Old Testament books`}>
        {flow.links.map((l, i) => {
          const s = left.get(l.source)!, t = right.get(l.target)!;
          const h = l.value * unit;
          const sy = s.y + (usedL.get(l.source) ?? 0), ty = t.y + (usedR.get(l.target) ?? 0);
          usedL.set(l.source, (usedL.get(l.source) ?? 0) + h); usedR.set(l.target, (usedR.get(l.target) ?? 0) + h);
          const mid = (LEFT + RIGHT) / 2;
          const on = !active || l.source === active || l.target === active;
          return <path key={i} d={`M${LEFT + NODE},${sy} C${mid},${sy} ${mid},${ty} ${RIGHT},${ty} L${RIGHT},${ty + h} C${mid},${ty + h} ${mid},${sy + h} ${LEFT + NODE},${sy + h} Z`}
            fill="var(--lg)" opacity={on ? (active ? 0.55 : 0.28) : 0.06} style={{ transition: "opacity .25s" }} />;
        })}
        {[...left.values()].map((n) => <g key={`s${n.name}`} {...node(n.name)} aria-label={`${n.name}: ${n.total}`}>
          <rect x={LEFT} y={n.y} width={NODE} height={n.h} rx={3} fill="var(--lg)" className="lg-glow" />
          <text x={LEFT - 8} y={n.y + n.h / 2 + 4} textAnchor="end" className={active === n.name ? "lg-svg-strong" : "lg-svg-text"}>{n.name} · {n.total}{kept === n.name && release}</text>
        </g>)}
        {[...right.values()].map((n) => <g key={`t${n.name}`} {...node(n.name)} aria-label={`${n.name}: ${n.total}`}>
          <rect x={RIGHT} y={n.y} width={NODE} height={n.h} rx={3} fill="var(--lg)" opacity=".8" />
          <text x={RIGHT + NODE + 8} y={n.y + n.h / 2 + 4} className={active === n.name ? "lg-svg-strong" : "lg-svg-text"}>{n.name} · {n.total}{kept === n.name && release}</text>
        </g>)}
      </svg>
    </div>
    <StableTip show={active ? flowTip(active, Boolean(kept), kept && <KeepX onRelease={keep.release} />) : flowResting}
      options={[flowResting, ...[...sources.keys(), ...targets.keys()].map((name) => flowTip(name, false, keptMark))]} cap="14rem" />
    <figcaption className="lg-caption"><ClaimText claim={flow.claim} as="span" /></figcaption>
  </figure>;
}
