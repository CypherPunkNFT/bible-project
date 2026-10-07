import type { FamilyEdge } from "./genealogy";
import type { RingNode } from "./circular-genealogy-edit";
export interface StudyNode extends RingNode { name: string; generation: number }
export interface StudyArrangement { offsets: Record<string, number>; scale: number; ringScales?: Record<number, number> }
export function compareArrangement(nodes: StudyNode[], edges: FamilyEdge[], arrangement: StudyArrangement) {
  const degrees = (radians: number) => Math.atan2(Math.sin(radians), Math.cos(radians)) * 180 / Math.PI;
  const metrics = (offsets: Record<string, number>, scale: number, ringScales?: Record<number, number>) => {
    const positions = nodes.map(n => ({ ...n, angle: n.angle + (offsets[n.id] ?? 0), x: Math.cos(n.angle + (offsets[n.id] ?? 0)) * n.radius * (ringScales?.[n.generation] ?? scale), y: Math.sin(n.angle + (offsets[n.id] ?? 0)) * n.radius * (ringScales?.[n.generation] ?? scale) }));
    let minimumClearance: number | null = null;
    for (let i = 0; i < positions.length; i++) for (let j = 0; j < i; j++) {
      const a = positions[i], b = positions[j], gap = Math.hypot(a.x - b.x, a.y - b.y) - a.size - b.size;
      minimumClearance = Math.min(minimumClearance ?? Infinity, gap);
    }
    const byId = new Map(positions.map(n => [n.id, n]));
    const spans = edges.filter(e => e.kind === "parent").flatMap(e => {
      const a = byId.get(e.from), b = byId.get(e.to);
      return a && b && a.radius && b.radius ? [Math.abs(degrees(a.angle - b.angle))] : [];
    });
    return { minimumDiscClearance: minimumClearance, meanParentChildAngularSeparationDegrees: spans.length ? spans.reduce((a, b) => a + b, 0) / spans.length : null,
      ringOrder: [...new Set(nodes.map(n => n.generation))].sort((a,b) => a-b).map(generation => ({ generation, ids: positions.filter(n => n.generation === generation).sort((a,b) => ((a.angle % (Math.PI*2) + Math.PI*2) % (Math.PI*2)) - ((b.angle % (Math.PI*2) + Math.PI*2) % (Math.PI*2))).map(n => n.id) })) };
  };
  return { baselineAtDefaultSize: metrics({}, 3), baselineAtEditedSize: metrics({}, arrangement.scale, arrangement.ringScales), edited: metrics(arrangement.offsets, arrangement.scale, arrangement.ringScales),
    movedPeople: nodes.filter(n => Math.abs(degrees(arrangement.offsets[n.id] ?? 0)) > .001).map(n => ({ id: n.id, name: n.name, generation: n.generation, rotationDegrees: degrees(arrangement.offsets[n.id]), visibleDescendantCount: descendantCount(n.id, edges) })),
    people: nodes.map(n => ({ ...n, originalAngle: n.angle, finalAngle: n.angle + (arrangement.offsets[n.id] ?? 0), originalRadius: n.radius * 3, finalRadius: n.radius * (arrangement.ringScales?.[n.generation] ?? arrangement.scale) })) };
}
function descendantCount(id: string, edges: FamilyEdge[]) {
  const seen = new Set([id]), queue = [id];
  for (let i = 0; i < queue.length; i++) for (const e of edges) if (e.kind === "parent" && e.from === queue[i] && !seen.has(e.to)) { seen.add(e.to); queue.push(e.to); }
  return seen.size - 1;
}
