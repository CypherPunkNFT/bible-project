// The connections graph built by scripts/build-graph.py into data/graph/ (local preview only until the owner approves it):
// an index of every person, place and topic, and 128 bundles holding each one's neighbourhood.
import { slugOf } from "@/lib/people-slugs";

export type Kind = "p" | "l" | "t";
/** [id, name, shared verses, up to three of those verses] */
export type Neighbour = [string, string, number, number[]];
/** [chapter (book * 1000 + chapter), votes, cross-references, up to three [own verse, other verse, votes]] */
export type LinkedChapter = [number, number, number, [number, number, number][]];

export interface Entity {
  k: Kind; id: string; n: string; d?: string; e?: string; v: number; b: Record<string, number>;
  fam: [string, string, string][];
  p: Neighbour[]; pN: number; l: Neighbour[]; lN: number; t: Neighbour[]; tN: number;
  x: LinkedChapter[]; xN: number; xo: LinkedChapter[]; xoN: number;
  see?: [string, string][];
}

/** key ("p:jesus-isa-7-14") -> [name, verses, description] */
export interface GraphIndex { bundles: number; entities: Record<string, [string, number, string]> }

export const KIND_NAME: Record<Kind, string> = { p: "Person", l: "Place", t: "Topic" };

const cache = new Map<string, Promise<unknown>>();

function load<T>(path: string): Promise<T> {
  let pending = cache.get(path) as Promise<T> | undefined;
  if (!pending) {
    pending = fetch(`/data/graph/${path}`, { cache: "no-cache" }).then(async (response) => {
      if (!response.ok) throw new Error(`connections data /data/graph/${path}: HTTP ${response.status} (run scripts/build-graph.py)`);
      return (await response.json()) as T;
    });
    pending.catch(() => cache.delete(path));
    cache.set(path, pending);
  }
  return pending;
}

export const loadGraphIndex = () => load<GraphIndex>("index.json");

/** FNV-1a over the key's UTF-8 bytes, the same as bundle_of() in scripts/build-graph.py. */
export function bundleOf(key: string, bundles: number): number {
  let hash = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(key)) hash = Math.imul(hash ^ byte, 0x01000193) >>> 0;
  return hash % bundles;
}

export async function loadEntity(kind: Kind, id: string): Promise<Entity | undefined> {
  const index = await loadGraphIndex();
  const key = `${kind}:${id}`;
  if (!index.entities[key]) return undefined;
  const bundle = await load<Record<string, Entity>>(`n/${bundleOf(key, index.bundles)}.json`);
  return bundle[key];
}

export const isKind = (value: string | undefined): value is Kind => value === "p" || value === "l" || value === "t";

/** The thing's own page on the site. */
export function pageHref(kind: Kind, id: string): string {
  if (kind === "p") return `/people/${slugOf(id) ?? id}`;
  if (kind === "l") return `/study/atlas/map?place=${id}`;
  return `/topics/${id}`;
}

export const fieldHref = (kind: Kind, id: string) => `/connections_mockup/${kind}/${id}`;
