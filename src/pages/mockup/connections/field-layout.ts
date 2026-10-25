// Where each point of the constellation sits, and which points share verses (used by Constellation.tsx and Panel.tsx).
import type { Catalog } from "@/lib/types";
import type { Entity, LinkedChapter, Neighbour } from "./graph-data";

export type Ring = "fam" | "p" | "l" | "t" | "x";
export interface Point {
  key: string; ring: Ring; label: string; weight: number; evidence: number[];
  row?: Neighbour; chapter?: LinkedChapter; relation?: string; x: number; y: number; angle: number;
}

export const RING_NAME: Record<Ring, string> = { fam: "Family", p: "People", l: "Places", t: "Topics", x: "Passages" };
const SHOWN: Record<Ring, number> = { fam: 10, p: 14, l: 12, t: 12, x: 14 };
export const C = 500;
export const short = (text: string, n = 20) => (text.length > n ? `${text.slice(0, n - 1)}…` : text);

export function chapterName(catalog: Catalog, chapter: number): string {
  const book = catalog.books.find((b) => b.num === Math.floor(chapter / 1000));
  return `${book?.name ?? "Book"} ${chapter % 1000}`;
}

/** The points of every ring, placed evenly round their circle, each ring starting a little further round. */
export function layoutPoints(entity: Entity, catalog: Catalog, passages: LinkedChapter[]): Point[] {
  const rows: Omit<Point, "x" | "y" | "angle">[] = [
    ...entity.fam.slice(0, SHOWN.fam).map(([relation, id, name]) => ({ key: `p:${id}`, ring: "fam" as const, label: name, weight: 0, evidence: [], relation })),
    ...(["p", "l", "t"] as const).flatMap((ring) => entity[ring].slice(0, SHOWN[ring]).map((row) => ({ key: `${ring}:${row[0]}`, ring, label: row[1], weight: row[2], evidence: row[3], row }))),
    ...passages.slice(0, SHOWN.x).map((chapter) => ({ key: `x:${chapter[0]}`, ring: "x" as const, label: chapterName(catalog, chapter[0]), weight: chapter[2], evidence: chapter[3].map((pair) => pair[0]), chapter })),
  ];
  const rings = (["fam", "p", "l", "t", "x"] as const).filter((ring) => rows.some((r) => r.ring === ring));
  const radius = (k: number) => (rings.length === 1 ? 300 : 135 + (330 * k) / (rings.length - 1));
  return rings.flatMap((ring, k) => {
    const list = rows.filter((r) => r.ring === ring);
    return list.map((row, i) => {
      // A gap at the top of every ring keeps its name clear; each ring starts a little further round, so labels interleave.
      const angle = ((-90 + 14 + (332 * (i + 0.2 + ((k * 0.37) % 0.6))) / list.length) * Math.PI) / 180;
      return { ...row, angle, x: C + Math.cos(angle) * radius(k), y: C + Math.sin(angle) * radius(k) };
    });
  });
}

export function ringRadii(points: Point[]): { ring: Ring; r: number }[] {
  const seen = new Map<Ring, number>();
  for (const p of points) if (!seen.has(p.ring)) seen.set(p.ring, Math.hypot(p.x - C, p.y - C));
  return [...seen].map(([ring, r]) => ({ ring, r }));
}

/** Points named in at least one of the same verses as the chosen one. */
export function linkedTo(points: Point[], chosen: Point | undefined): Set<string> {
  if (!chosen || !chosen.evidence.length) return new Set();
  const verses = new Set(chosen.evidence);
  return new Set(points.filter((p) => p.key !== chosen.key && p.evidence.some((v) => verses.has(v))).map((p) => p.key));
}
