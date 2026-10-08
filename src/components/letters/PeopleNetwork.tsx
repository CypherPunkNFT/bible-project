import { useState } from "react";
import { StableTip } from "@/components/StableTip";
import type { Network } from "@/data/letters/types";
import { ClaimText, Refs } from "./LetterParts";

const W = 1000;

type Placed = Network["nodes"][number] & { x: number; y: number };

/**
 * People and how the text links them. With "letter" nodes it is two columns (letters | people); otherwise the
 * first node sits at the centre and everyone else rings it.
 */
function layout(network: Network): { nodes: Placed[]; height: number } {
  const letters = network.nodes.filter((n) => n.group === "letter");
  if (letters.length) {
    const people = network.nodes.filter((n) => n.group !== "letter");
    const height = Math.max(letters.length, people.length) * 26 + 40;
    const place = (list: typeof people, x: number) => list.map((n, i) => ({ ...n, x, y: 30 + (i + 0.5) * ((height - 40) / list.length) }));
    return { nodes: [...place(letters, 260), ...place(people, 700)], height };
  }
  const [centre, ...rest] = network.nodes;
  const rings = rest.length > 18 ? 2 : 1;
  const height = rings === 2 ? 620 : 460;
  const cx = W / 2, cy = height / 2;
  const placed: Placed[] = [{ ...centre, x: cx, y: cy }];
  rest.forEach((n, i) => {
    const ring = rings === 2 ? i % 2 : 0;
    const r = (rings === 2 ? [180, 270][ring] : 170);
    const a = (i / rest.length) * Math.PI * 2 - Math.PI / 2;
    placed.push({ ...n, x: cx + Math.cos(a) * r * 1.5, y: cy + Math.sin(a) * r });
  });
  return { nodes: placed, height };
}

export function PeopleNetwork({ network }: { network: Network }) {
  const [active, setActive] = useState<string | null>(null);
  const { nodes, height } = layout(network);
  const at = new Map(nodes.map((n) => [n.id, n]));
  const linked = new Set(active ? network.edges.flatMap((e) => (e.from === active || e.to === active ? [e.from, e.to] : [])) : []);
  const node = active ? at.get(active) : undefined;
  const edgesOf = (id: string) => network.edges.filter((e) => e.from === id || e.to === id);
  const netResting = <span className="lg-muted">Point at a name to see who they are linked to, and where.</span>;
  const nodeTip = (n: Placed) => {
    const es = edgesOf(n.id);
    return <><strong>{n.label}</strong>{n.note && <span className="lg-muted"> · {n.note}</span>}<Refs refs={[...(n.refs ?? []), ...es.flatMap((e) => e.refs ?? [])]} />
      {es.some((e) => e.label) && <span className="lg-muted"> · {es.map((e) => e.label).filter(Boolean).slice(0, 4).join(" · ")}</span>}</>;
  };
  const groups = [...new Set(network.nodes.map((n) => n.group).filter(Boolean))];
  const tone = (group?: string) => (group === "letter" ? "var(--lg)" : ["var(--poetry)", "var(--prophets)", "var(--acts)", "var(--history)"][Math.max(0, groups.indexOf(group)) % 4]);

  return <figure>
    <div className="lg-figure">
      <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label={`${network.title}: ${network.nodes.length} people`}>
        {network.edges.map((e, i) => {
          const a = at.get(e.from), b = at.get(e.to);
          if (!a || !b) return null;
          const on = !active || e.from === active || e.to === active;
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--lg)" strokeWidth={on && active ? 1.6 : 1} opacity={on ? (active ? 0.8 : 0.3) : 0.05} />;
        })}
        {nodes.map((n, i) => {
          const isCentre = i === 0 && !nodes.some((m) => m.group === "letter");
          const dim = active && active !== n.id && !linked.has(n.id);
          return <g key={n.id} transform={`translate(${n.x},${n.y})`} opacity={dim ? 0.25 : 1} style={{ cursor: "pointer", transition: "opacity .2s" }}
            tabIndex={0} role="button" aria-label={n.label} onMouseEnter={() => setActive(n.id)} onFocus={() => setActive(n.id)} onClick={() => setActive(n.id)}>
            <circle r={isCentre ? 14 : n.group === "letter" ? 9 : 6} fill={isCentre ? "var(--lg)" : tone(n.group)} stroke="var(--page)" strokeWidth={1.5} className="lg-glow" />
            <text x={n.group === "letter" ? -14 : 10} y={4} textAnchor={n.group === "letter" ? "end" : "start"} className={isCentre || active === n.id ? "lg-svg-strong" : "lg-svg-text"}>{n.label}</text>
          </g>;
        })}
      </svg>
    </div>
    <StableTip show={node ? nodeTip(node) : netResting} options={[netResting, ...nodes.map(nodeTip)]} cap="10rem" />
    <figcaption className="lg-caption"><ClaimText claim={network.claim} as="span" /></figcaption>
  </figure>;
}
