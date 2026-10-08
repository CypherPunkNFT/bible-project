// The landing's constellation: where each of the scholars' marks sits. Two compositions: a wide one beside the copy,
// and a tall one for phones. Each field gathers round its own centre; its scholars start on a small spiral in order of
// birth (so the line through them reads as a gentle curl), then a few hundred rounds of gentle pushing keep marks from
// touching (deterministic, done once per layout). Finally the picture is cropped to its own bounds so it fills the stage.
import type { Field, Scholar, ScholarsData } from "@/data/teachers/pages-types";
import { byBirth } from "../marks/facts";

export type LayoutName = "wide" | "tall";
interface LayoutSpec { size: number; gap: number; centres: Record<Field, [number, number]> }
const LAYOUTS: Record<LayoutName, LayoutSpec> = {
  wide: { size: 58, gap: 76, centres: { texts: [190, 250], history: [470, 150], theology: [680, 160], reference: [600, 420], places: [340, 510] } },
  tall: { size: 50, gap: 58, centres: { texts: [118, 215], history: [300, 140], theology: [318, 352], reference: [268, 560], places: [100, 560] } },
};

export interface SkyNode { s: Scholar; x: number; y: number; hx: number; hy: number }
export interface SkyField { field: Field; own: SkyNode[]; mx: number; my: number; bottom: number; r: number }
export interface Sky { name: LayoutName; w: number; h: number; size: number; nodes: SkyNode[]; fields: SkyField[] }

function seed(data: ScholarsData, spec: LayoutSpec): SkyNode[] {
  const nodes: SkyNode[] = [], born = byBirth(data.scholars);
  for (const field of Object.keys(data.fields) as Field[]) {
    const [cx, cy] = spec.centres[field], b = spec.gap / (2 * Math.PI);
    let theta = Math.PI * 1.25;
    born.filter((s) => s.field === field).forEach((s, i) => {
      const r = i ? b * theta : 0, a = theta + cx * 0.013;
      const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
      nodes.push({ s, hx: x, hy: y, x, y });
      if (i) theta += spec.gap / Math.max(r, spec.gap * 0.7);
    });
  }
  return nodes;
}

function relax(nodes: SkyNode[], gap: number) {
  for (let round = 0; round < 300; round++) {
    for (const n of nodes) { n.x += (n.hx - n.x) * 0.03; n.y += (n.hy - n.y) * 0.03; }
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j], min = a.s.field === b.s.field ? gap : gap + 30;
      let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d >= min) continue;
      if (d < 0.01) { dx = 1; dy = 0; d = 1; }
      const push = (min - d) / 2;
      a.x -= dx / d * push; a.y -= dy / d * push; b.x += dx / d * push; b.y += dy / d * push;
    }
  }
}

function groups(data: ScholarsData, nodes: SkyNode[], size: number): SkyField[] {
  return (Object.keys(data.fields) as Field[]).map((field) => {
    const own = nodes.filter((n) => n.s.field === field);
    const mx = own.reduce((a, n) => a + n.x, 0) / own.length, my = own.reduce((a, n) => a + n.y, 0) / own.length;
    return { field, own, mx, my, bottom: Math.max(...own.map((n) => n.y)), r: Math.max(...own.map((n) => Math.hypot(n.x - mx, n.y - my))) + size };
  }).filter((f) => f.own.length > 0);
}

export function buildSky(data: ScholarsData, name: LayoutName): Sky {
  const spec = LAYOUTS[name], nodes = seed(data, spec);
  relax(nodes, spec.gap);
  const pad = 14, half = spec.size / 2 + 6, labelRoom = 40;
  const minX = Math.min(...nodes.map((n) => n.x)) - half - pad, maxX = Math.max(...nodes.map((n) => n.x)) + half + pad;
  const minY = Math.min(...nodes.map((n) => n.y)) - half - pad, maxY = Math.max(...nodes.map((n) => n.y)) + half + labelRoom;
  for (const n of nodes) { n.x -= minX; n.y -= minY; }
  return { name, w: Math.round(maxX - minX), h: Math.round(maxY - minY), size: spec.size, nodes, fields: groups(data, nodes, spec.size) };
}

/** Each mark's own slow drift loop (offsets, duration, phase), varied by its place in the list. */
export const driftStyle = (i: number) => ({
  "--fx": `${((i * 37) % 7 - 3) * 0.9}px`, "--fy": `${((i * 53) % 7 - 3) * 0.9}px`, "--dur": `${9 + (i * 13) % 7}s`, "--fd": `-${(i * 1.7) % 9}s`,
});
