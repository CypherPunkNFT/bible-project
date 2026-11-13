// What came first? build: the checks every category shares (design §4.0, §11) and the writer of the generated files.
// Nothing here decides an order on its own: that is src/pages/games/what-came-first/order.ts, which the game uses too.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { checkYear } from "../../src/pages/games/whos-older/pairing.ts";
import { BANDS, bandOf, type Band } from "../../src/pages/games/what-came-first/bands.ts";
import { RULES, allOrders, buildIndex, pairKey, type Fact, type Item, type Order, type PairCategory, type PairIndex,
  type Span } from "../../src/pages/games/what-came-first/order.ts";
import { factContradictions } from "../whos-older/checks.ts";
import { Bsb, SITE, loadBooks, type Book } from "../whos-older/site-data.ts";

export const FOLDER = path.join(SITE, "src", "data", "what-came-first");
export const QUOTE_MAX_VERSES = 3;

export const books: Map<number, Book> = loadBooks();
export const bsb = new Bsb(books);

/** One category's problems (fatal: nothing is written) and notices (reported, not fatal). */
export class Log {
  readonly errors: string[] = [];
  readonly notices: string[] = [];
  readonly category: string;
  constructor(category: string) { this.category = category; }
  error(text: string) { this.errors.push(text); }
  notice(text: string) { this.notices.push(text); }
}

export const readSource = <T>(name: string): { text: string; data: T } => {
  const text = fs.readFileSync(path.join(FOLDER, name), "utf8");
  return { text, data: JSON.parse(text) as T };
};

/** The Berean words of a list of spans, joined; "" when any verse is missing. */
export function spanText(spans: readonly Span[]): string {
  const words: string[] = [];
  for (const [start, end] of spans) {
    for (let id = start; id <= end; id++) {
      const verse = bsb.verse(id);
      if (verse === null && Math.floor(id / 1000) !== Math.floor(end / 1000)) { id = (Math.floor(id / 1000) + 1) * 1000; continue; }
      if (verse !== null) words.push(verse);
    }
  }
  return words.join(" ");
}

/** Every span is [first, last] with both ends in the BSB text. */
export function checkSpans(log: Log, where: string, spans: unknown): spans is Span[] {
  if (!Array.isArray(spans) || !spans.length) { log.error(`${where}: expected at least one verse span, got ${JSON.stringify(spans)}`); return false; }
  for (const span of spans) {
    const ok = Array.isArray(span) && span.length === 2 && Number.isInteger(span[0]) && Number.isInteger(span[1]) && span[0] <= span[1]
      && bsb.verse(span[0]) !== null && bsb.verse(span[1]) !== null;
    if (!ok) { log.error(`${where}: verse span ${JSON.stringify(span)} is not in the BSB text`); return false; }
  }
  return true;
}

const normalise = (text: string) => text.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"');

/** The word or phrase `match` must stand in the spans' Berean text (the site's own Bible), or the item is refused. */
export function checkMatch(log: Log, where: string, spans: Span[], match: unknown): boolean {
  if (typeof match !== "string" || !match.trim()) { log.error(`${where}: match is empty (a word from the verse is required)`); return false; }
  if (!normalise(spanText(spans)).includes(normalise(match.trim()))) {
    log.error(`${where}: "${match}" is not in the BSB text of ${JSON.stringify(spans)}`);
    return false;
  }
  return true;
}

/** A fact's first span is quoted in the reveal: at most three verses, one chapter, with words. */
export function checkQuoteSpan(log: Log, where: string, refs: Span[]) {
  const [start, end] = refs[0];
  if (end - start >= QUOTE_MAX_VERSES || Math.floor(start / 1000) !== Math.floor(end / 1000)) {
    log.error(`${where}: the first span ${start}-${end} is quoted, so it must be at most ${QUOTE_MAX_VERSES} verses in one chapter`);
  } else if (!spanText([refs[0]]).trim()) log.error(`${where}: the first span ${start}-${end} has no BSB words to quote`);
}

export function checkWindow(log: Log, where: string, lo: number | null, hi: number | null) {
  try {
    if (lo !== null) checkYear(lo);
    if (hi !== null) checkYear(hi);
    if (lo !== null && hi !== null && lo > hi) throw new Error(`lo ${lo} is after hi ${hi}`);
  } catch (error) {
    log.error(`${where}: window ${lo}..${hi}: ${(error as Error).message}`);
  }
}

export interface SourceFact { first: string; second: string; refs: Span[]; why: string; kind?: string }
export interface SourceBlocked { a: string; b: string; reason: string }
export interface LeftOut { name: string; reason: string }

/** Hand facts: both items exist, verses real and quotable, a reason given. */
export function checkHandFacts(log: Log, facts: readonly SourceFact[], byId: ReadonlyMap<string, Item>): Fact[] {
  const out: Fact[] = [];
  for (const f of facts) {
    const where = `fact ${f.first} > ${f.second}`;
    if (!byId.has(f.first) || !byId.has(f.second)) { log.error(`${where}: both items must be in the category`); continue; }
    if (!f.why?.trim()) log.error(`${where}: why is empty`);
    if (!checkSpans(log, where, f.refs)) continue;
    checkQuoteSpan(log, where, f.refs);
    out.push({ first: f.first, second: f.second, kind: f.kind ?? "stated", refs: f.refs, why: f.why });
  }
  return out;
}

/** A fact must never contradict the windows or positions, and facts must not point both ways or loop. */
export function checkFactAgreement(log: Log, facts: readonly Fact[], byId: ReadonlyMap<string, Item>) {
  const label = (id: string) => byId.get(id)?.label ?? id;
  for (const f of facts) {
    const a = byId.get(f.first);
    const b = byId.get(f.second);
    if (!a || !b) continue;
    if (a.lo !== null && b.hi !== null && a.lo > b.hi) {
      log.error(`fact ${a.label} before ${b.label} contradicts the windows: ${a.label} starts ${a.lo}, after ${b.label}'s latest ${b.hi}`);
    }
    if (a.position !== undefined && b.position !== undefined && a.position >= b.position) {
      log.error(`fact ${a.label} before ${b.label} contradicts their positions (${a.position} and ${b.position})`);
    }
  }
  for (const problem of factContradictions(facts as never, label)) log.error(problem);
}

export function checkBlocked(log: Log, blocked: readonly SourceBlocked[], known: (id: string) => boolean): [string, string][] {
  const out: [string, string][] = [];
  for (const b of blocked) {
    for (const id of [b.a, b.b]) if (!known(id)) log.error(`blocked pair ${b.a} / ${b.b}: ${id} is not an item of this category`);
    if (!b.reason?.trim()) log.error(`blocked pair ${b.a} / ${b.b}: reason is empty`);
    if (b.a === b.b) log.error(`blocked pair ${b.a} / ${b.b}: the same item twice`);
    out.push([b.a, b.b]);
  }
  return out;
}

export function checkUniqueLabels(log: Log, items: readonly Item[]) {
  const ids = new Set<string>();
  const labels = new Map<string, string>();
  for (const item of items) {
    if (ids.has(item.id)) log.error(`${item.id}: listed twice`);
    ids.add(item.id);
    if (!item.label?.trim()) log.error(`${item.id}: label is empty`);
    if (![1, 2, 3].includes(item.tier)) log.error(`${item.id}: tier must be 1, 2 or 3, got ${item.tier}`);
    const key = `${item.group ?? ""}|${item.label.trim().toLowerCase()}`;
    if (labels.has(key)) log.error(`label "${item.label}" is used by both ${labels.get(key)} and ${item.id}`);
    labels.set(key, item.id);
  }
}

export type BandCounts = Record<Band, number>;
export interface Pool<I extends Item> { items: I[]; index: PairIndex; orders: (Order<I> & { band: Band })[]; perBand: BandCounts; dropped: string[] }

/** Items with fewer than `minPartners` askable partners are left out (repeatedly, as each removal can starve another). */
export function settlePool<I extends Item>(log: Log, category: PairCategory, start: readonly I[], facts: readonly Fact[],
  blocked: readonly [string, string][], minPartners: number): Pool<I> {
  let items = [...start];
  const dropped: string[] = [];
  const rules = RULES[category];
  for (;;) {
    const index = buildIndex(facts, blocked);
    const orders = allOrders(items, index, rules);
    const partners = new Map<string, number>();
    for (const o of orders) for (const id of [o.first.id, o.second.id]) partners.set(id, (partners.get(id) ?? 0) + 1);
    const short = items.filter((item) => (partners.get(item.id) ?? 0) < minPartners);
    if (!short.length) {
      const banded = orders.map((o) => ({ ...o, band: bandOf(category, o) }));
      const perBand = Object.fromEntries(BANDS.map((band) => [band, banded.filter((o) => o.band === band).length])) as BandCounts;
      return { items, index, orders: banded, perBand, dropped };
    }
    for (const item of short) {
      log.notice(`${item.label}: only ${partners.get(item.id) ?? 0} certain partners (at least ${minPartners} needed), left out`);
      dropped.push(item.label);
    }
    const gone = new Set(short.map((item) => item.id));
    items = items.filter((item) => !gone.has(item.id));
  }
}

export function checkBandMinimum(log: Log, perBand: BandCounts, minimum: number) {
  for (const band of BANDS) if (perBand[band] < minimum) log.error(`only ${perBand[band]} ${band} pairs (at least ${minimum} needed)`);
}

/** The second check, written apart from orderOf: every askable pair rests on a fact, strict windows or positions in
 *  one group, and none is a blocked pair. */
export function independentCheck(log: Log, orders: readonly Order[], facts: readonly Fact[], blocked: readonly [string, string][]) {
  const factKeys = new Map(facts.map((f) => [pairKey(f.first, f.second), f]));
  const blockedKeys = new Set(blocked.map(([a, b]) => pairKey(a, b)));
  for (const { first, second, reason } of orders) {
    const key = pairKey(first.id, second.id);
    if (blockedKeys.has(key)) log.error(`blocked pair asked: ${first.label} / ${second.label}`);
    const fact = factKeys.get(key);
    const byFact = fact !== undefined && fact.first === first.id;
    const byWindows = first.hi !== null && second.lo !== null && first.hi < second.lo;
    const byPosition = first.position !== undefined && second.position !== undefined && first.group === second.group && first.position < second.position;
    if (!(byFact || byWindows || byPosition)) log.error(`pair ${first.label} before ${second.label} (${reason.kind}) rests on no fact, window or position`);
  }
}

/** Book numbers -> [reader code, name], for the verse links of the spans used. */
export function usedBooks(spans: readonly Span[]): Record<string, [string, string]> {
  const nums = [...new Set(spans.map(([start]) => Math.floor(start / 1_000_000)))].sort((a, b) => a - b);
  return Object.fromEntries(nums.map((num) => [String(num), [books.get(num)!.code, books.get(num)!.name]]));
}

/** Writes a generated file: `about`, then its stamp (a hash of its own content, as whos-older.json's is), then the
 *  rest, one array entry per line. Returns the stamp. */
export function writeGenerated(file: string, body: { about: string } & Record<string, unknown>): string {
  const stamp = crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex").slice(0, 12);
  const { about, ...rest } = body;
  const full = { about, stamp, ...rest };
  const lines = (items: unknown[]) => items.map((item) => `  ${JSON.stringify(item)}`).join(",\n");
  const text = `{\n${Object.entries(full).map(([key, value]) => (Array.isArray(value)
    ? (value.length ? `"${key}": [\n${lines(value)}\n]` : `"${key}": []`) : `"${key}": ${JSON.stringify(value)}`)).join(",\n")}\n}\n`;
  fs.writeFileSync(path.join(FOLDER, file), text);
  return stamp;
}

export const sourcesHash = (texts: readonly string[]) => crypto.createHash("sha256").update(texts.join("\u0000")).digest("hex").slice(0, 12);
