// Who's older?'s model as Who lived first? reads it (What came first?, design §5.4): the data's types, the pool of
// askable pairs and the seeded generator. The game itself (the run, dealing and the screens) moved to
// ../what-came-first/, which deals Who lived first from this same file. explain.ts and the data test still use these.
import { allPairs, buildIndex, pairKey, type Band, type Fact, type Order, type Person, type Tier } from "./pairing";

export interface Character extends Person { tag: string; when: string; brief: string; href: string; tier: Tier }
export interface WhosOlderData {
  stamp: string;
  sources: string;
  books: Record<string, [string, string]>;
  characters: Character[];
  facts: Fact[];
  blocked: [string, string][];
}

export type PoolPair = Order<Character> & { band: Band };

export interface Pool {
  data: WhosOlderData;
  byId: Map<string, Character>;
  pairs: PoolPair[];
  byKey: Map<string, PoolPair>;
  byBand: Record<Band, PoolPair[]>;
  /** Each person's partners, by band. */
  partners: Map<string, Record<Band, PoolPair[]>>;
}

export function buildPool(data: WhosOlderData): Pool {
  const pairs = allPairs(data.characters, buildIndex(data.facts, data.blocked));
  const byBand = { easy: [], medium: [], hard: [] } as Record<Band, PoolPair[]>;
  const partners = new Map<string, Record<Band, PoolPair[]>>(data.characters.map((c) => [c.id, { easy: [], medium: [], hard: [] }]));
  for (const pair of pairs) {
    byBand[pair.band].push(pair);
    partners.get(pair.first.id)![pair.band].push(pair);
    partners.get(pair.second.id)![pair.band].push(pair);
  }
  return { data, byId: new Map(data.characters.map((c) => [c.id, c])), pairs, byKey: new Map(pairs.map((p) => [pairKey(p.first.id, p.second.id), p])), byBand, partners };
}

/** mulberry32: a small seeded generator. Returns a number in [0, 1) and the next state. */
export function random(seed: number): [number, number] {
  const next = (seed + 0x6d2b79f5) | 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}
