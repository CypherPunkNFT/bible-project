// What came first?: each category's generated file turned into what the dealer reads (design §5.3, §6). A pair
// category becomes its items, every askable pair with its band, the pairs by band and each item's partners by band
// (Who's older?'s buildPool, generalised). Bible Firsts becomes its questions by band. The pairs come only from
// orderOf, the one rule the build shares, so the game can never ask a pair the build did not count as certain.
import type { WhosOlderData } from "../whos-older/game";
import { BANDS, bandOf, type Band } from "./bands";
import { livedItems } from "./categories/lived";
import { expandBeforeSaul, type BeforeSaul } from "./categories/ruled";
import { RULES, allOrders, buildIndex, pairKey, type Fact, type Item, type Order, type PairCategory, type Span } from "./order";

/** An item with what its card and reveal show. Only the Item fields decide pairing. */
export interface ShownItem extends Item {
  refs?: Span[];
  /** The card's second line (people, rulers, buildings, deaths). */
  tag?: string;
  /** When it was: a full sentence (people, rulers, buildings, deaths; an event's dating line). */
  when?: string;
  brief?: string;
  /** A page on the site about it (people). */
  href?: string;
  /** Books: the library section, shown as the card's second line. */
  section?: string;
}

export type BookNames = Record<string, [string, string]>;

export interface Journey { id: string; traveller: string; travellerId?: string; title: string; span: Span[]; origin?: string }

export interface PairFile {
  stamp: string;
  books?: BookNames;
  items: ShownItem[];
  facts?: Fact[];
  blocked?: [string, string][];
  beforeSaul?: BeforeSaul;
  journeys?: Journey[];
}

export interface FirstsQuestion {
  id: string;
  question: string;
  tier: 1 | 2 | 3;
  answer: string;
  options: string[];
  refs: Span[];
  why: string;
}

export interface FirstsFile { stamp: string; books: BookNames; questions: FirstsQuestion[] }

export type PoolPair = Order<ShownItem> & { band: Band };

export interface PairPool {
  key: PairCategory;
  stamp: string;
  books: BookNames;
  items: ShownItem[];
  byId: Map<string, ShownItem>;
  pairs: PoolPair[];
  byKey: Map<string, PoolPair>;
  byBand: Record<Band, PoolPair[]>;
  partners: Map<string, Record<Band, PoolPair[]>>;
  /** Items that are first in every one of their pairs, or last in every one: they never stay (design §6.2). */
  giveaways: Set<string>;
  journeys: Map<string, Journey>;
}

export interface FirstsPool {
  key: "firsts";
  stamp: string;
  books: BookNames;
  questions: FirstsQuestion[];
  byId: Map<string, FirstsQuestion>;
  byBand: Record<Band, FirstsQuestion[]>;
}

export type Pools = { [K in PairCategory]?: PairPool } & { firsts?: FirstsPool };

const emptyBands = <T>(): Record<Band, T[]> => ({ easy: [], medium: [], hard: [] });

/** Who's older?'s own giveaway: a person with no real earliest year is the answer against everyone. */
const noEarliestYear = (item: Pick<Item, "shown" | "lo">) => !item.shown || item.lo === null;

export function buildPairPool(key: PairCategory, file: PairFile): PairPool {
  const facts = [...(file.facts ?? []), ...(file.beforeSaul ? expandBeforeSaul(file.items, file.facts ?? [], file.beforeSaul) : [])];
  const orders = allOrders(file.items, buildIndex(facts, file.blocked ?? []), RULES[key]);
  const pairs: PoolPair[] = orders.map((order) => ({ ...order, band: bandOf(key, order) }));
  const byBand = emptyBands<PoolPair>();
  const partners = new Map(file.items.map((item) => [item.id, emptyBands<PoolPair>()]));
  const wins = new Map<string, number>();
  const losses = new Map<string, number>();
  for (const pair of pairs) {
    byBand[pair.band].push(pair);
    partners.get(pair.first.id)![pair.band].push(pair);
    partners.get(pair.second.id)![pair.band].push(pair);
    wins.set(pair.first.id, (wins.get(pair.first.id) ?? 0) + 1);
    losses.set(pair.second.id, (losses.get(pair.second.id) ?? 0) + 1);
  }
  const giveaways = new Set(file.items.filter((item) => !wins.get(item.id) || !losses.get(item.id)
    || (key === "lived" && noEarliestYear(item))).map((item) => item.id));
  return { key, stamp: file.stamp, books: file.books ?? {}, items: file.items, byId: new Map(file.items.map((i) => [i.id, i])), pairs,
    byKey: new Map(pairs.map((p) => [pairKey(p.first.id, p.second.id), p])), byBand, partners, giveaways,
    journeys: new Map((file.journeys ?? []).map((j) => [j.id, j])) };
}

const TIER_BAND: Record<number, Band> = { 1: "easy", 2: "medium", 3: "hard" };

export function buildFirstsPool(file: FirstsFile): FirstsPool {
  const byBand = emptyBands<FirstsQuestion>();
  for (const q of file.questions) byBand[TIER_BAND[q.tier] ?? "hard"].push(q);
  return { key: "firsts", stamp: file.stamp, books: file.books, questions: file.questions, byId: new Map(file.questions.map((q) => [q.id, q])), byBand };
}

/** Who lived first's items from Who's older?'s file, unchanged (design §4.1). */
export const livedFile = (data: WhosOlderData): PairFile => ({ stamp: data.stamp, books: data.books, items: livedItems(data), facts: data.facts, blocked: data.blocked });

/** Books: a position in the 66-book order, and the library section for the card (design §4.7). */
export function booksFile(file: { stamp: string; items: { id: string; label: string; position: number; testament: "old" | "new"; section: string }[] }): PairFile {
  return { stamp: file.stamp, items: file.items.map((b) => ({ id: b.id, label: b.label, tier: 1, lo: null, hi: null, shown: true, position: b.position, testament: b.testament, section: b.section })) };
}

export { BANDS };
