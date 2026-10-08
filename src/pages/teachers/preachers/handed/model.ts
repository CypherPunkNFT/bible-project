// 06 · Who passed it to whom: the documented links, the chains a reader can follow, and the lanes the chart draws.
import type { PeopleData, Person } from "@/data/teachers/pages-types";
import { lifeEnd } from "../../shared/people";

export interface Link { k: number; from: string; to: string; note: string; a: Person; b: Person }
export interface Chain { key: string; label: string; ids?: string[] }

const CHAIN_LIST: { key: string; label: string; ids?: string[] }[] = [
  { key: "princeton", label: "The Princeton chain", ids: ["archibald-alexander", "charles-hodge", "b-b-warfield", "j-gresham-machen", "john-murray"] },
  { key: "geneva", label: "From Calvin's Geneva", ids: ["john-calvin", "heinrich-bullinger", "john-knox", "francis-turretin", "charles-hodge"] },
  { key: "dutch", label: "The Dutch line", ids: ["abraham-kuyper", "herman-bavinck", "louis-berkhof", "geerhardus-vos", "john-murray"] },
  { key: "awakening", label: "Whitefield and Edwards", ids: ["george-whitefield", "jonathan-edwards", "l13-david-brainerd", "john-newton", "j-c-ryle", "john-piper"] },
  { key: "puritans", label: "Puritans and their readers", ids: ["william-perkins", "william-ames", "richard-sibbes", "thomas-goodwin", "john-owen", "j-i-packer", "martyn-lloyd-jones"] },
  { key: "london", label: "Spurgeon's forebears", ids: ["john-bunyan", "john-gill", "charles-spurgeon"] },
  { key: "all", label: "All links" },
];

/** The chains, with every name checked against the data (a missing one is reported and left out, never invented). */
export function chainsFor(byId: Map<string, Person>): Chain[] {
  return CHAIN_LIST.map((chain) => {
    if (!chain.ids) return chain;
    const ids = chain.ids.map((x) => `author-${x}`);
    const missing = ids.filter((x) => !byId.has(x));
    if (missing.length) console.error(`Handed: chain "${chain.key}" names ${missing.join(", ")}, which the people data does not have`);
    return { ...chain, ids: ids.filter((x) => byId.has(x)) };
  });
}

export function linksFrom(data: PeopleData, byId: Map<string, Person>): Link[] {
  return data.links.flatMap((l, k) => {
    const a = byId.get(l.from), b = byId.get(l.to);
    if (!a || !b) { console.error(`Handed: link ${k} joins ${l.from} and ${l.to}; one of them is not in the people data`); return []; }
    return [{ ...l, k, a, b }];
  });
}

/** A chain's links in birth order (all links for "All links"). */
export const linksOf = (chain: Chain, links: Link[]) =>
  (chain.ids ? links.filter((l) => chain.ids?.includes(l.from) && chain.ids.includes(l.to)) : [...links])
    .sort((m, n) => m.a.born - n.a.born || m.b.born - n.b.born);
export const overlap = (l: Link) => ({ s: Math.max(l.a.born, l.b.born), e: Math.min(lifeEnd(l.a), lifeEnd(l.b)) });
/** Years between one life and the next, or 0 where the lives overlapped. */
export const gapOf = (l: Link) => { const { s, e } = overlap(l); return e < s ? l.b.born - lifeEnd(l.a) : 0; };

/** Lanes: people grouped by the links that join them (each group in birth order), so each chain reads as a staircase. */
export function lanes(links: Link[]): Person[][] {
  const parent = new Map<string, string>(), people = new Map<string, Person>();
  const find = (x: string) => { let r = x; while (parent.get(r) !== r) r = parent.get(r) ?? r; return r; };
  for (const l of links) for (const p of [l.a, l.b]) if (!parent.has(p.id)) { parent.set(p.id, p.id); people.set(p.id, p); }
  for (const l of links) parent.set(find(l.from), find(l.to));
  const groups = new Map<string, Person[]>();
  for (const [id, p] of people) { const r = find(id); groups.set(r, [...(groups.get(r) ?? []), p]); }
  return [...groups.values()].map((g) => g.sort((m, n) => m.born - n.born)).sort((m, n) => m[0].born - n[0].born);
}

export interface Curve { d: string; x1: number; x2: number; ya: number; yb: number; badgeX: number }
/** Where lives overlapped: a bowed line between the two lanes in their shared years; otherwise from one death to the
 *  next birth. `badgeX` is where the numbered badge sits on it. */
export function curveOf(l: Link, laneY: Map<string, number>, X: (year: number) => number): Curve {
  const ya = laneY.get(l.from) ?? 0, yb = laneY.get(l.to) ?? 0, { s, e } = overlap(l);
  if (e >= s) {
    const x = X((s + e) / 2), k = Math.max(10, Math.min(46, Math.abs(yb - ya) * 0.35));
    return { d: `M${x},${ya} C${x + k},${ya} ${x + k},${yb} ${x},${yb}`, x1: x, x2: x, ya, yb, badgeX: x + k * 0.75 };
  }
  const x1 = X(lifeEnd(l.a)), x2 = X(l.b.born), m = (x2 - x1) / 2;
  return { d: `M${x1},${ya} C${x1 + m},${ya} ${x2 - m},${yb} ${x2},${yb}`, x1, x2, ya, yb, badgeX: (x1 + x2) / 2 };
}
