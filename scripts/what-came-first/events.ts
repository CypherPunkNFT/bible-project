// What happened first? (category 2, design §4.2): the adapter that brings in the Timeline sort game's events, order
// facts and contested pairs (src/data/timeline/timeline.json, read only), adds this game's own blocks from
// events.source.json, checks them and returns what events.json holds.
import path from "node:path";
import { pairKey, type Fact, type Item, type Span, type Tier } from "../../src/pages/games/what-came-first/order.ts";
import { SITE, readJson } from "../whos-older/site-data.ts";
import { Log, checkBandMinimum, checkBlocked, checkFactAgreement, checkUniqueLabels, independentCheck, readSource,
  settlePool, sourcesHash, usedBooks, type Pool, type SourceBlocked } from "./common.ts";

const MIN_PARTNERS = 8;
const MIN_PER_BAND = 300;
/** The owner's exclusions (brief §1), guarded so a Timeline event added later cannot slip past them. */
const MIRACLE = /^Jesus (heals|feeds|raises|calms|walks on the water|turns water)/i;
const PLAGUE = /\b(blood|frogs?|gnats|flies|livestock|boils|hail|locusts|darkness|firstborn)\b/i;
const WRITING = /\b(writes|wrote|written)\b/i;

interface TimelineEvent { id: string; label: string; tier: Tier; lo: number | null; hi: number | null; shown: boolean; dating: string; refs: Span[]; people: string[] }
interface TimelineFile { stamp: string; events: TimelineEvent[]; facts: { first: string; second: string; refs: Span[]; why: string; close?: boolean }[]; contested: [string, string][] }
interface EventsSource { excluded: { id: string; reason: string }[]; blockedGroups: { name: string; ids: string[]; reason: string }[]; blocked: SourceBlocked[] }

export type EventItem = Item & { dating: string; refs: Span[]; people: string[] };
export interface EventsResult {
  log: Log; pool: Pool<EventItem>; facts: Fact[]; blocked: [string, string][]; body: Record<string, unknown> & { about: string };
  source: EventsSource; contested: number; groupPairs: number; timelineEvents: number;
}

export function buildEvents(): EventsResult {
  const log = new Log("happened");
  const timeline = readJson<TimelineFile>(path.join(SITE, "src", "data", "timeline", "timeline.json"));
  const { text, data: source } = readSource<EventsSource>("events.source.json");
  const known = new Map(timeline.events.map((e) => [e.id, e]));
  const has = (id: string) => known.has(id);

  for (const e of source.excluded) if (!has(e.id) || !e.reason?.trim()) log.error(`excluded ${e.id}: not a Timeline event, or no reason`);
  const excluded = new Set(source.excluded.map((e) => e.id));
  const groupMembers = (name: string) => new Set(source.blockedGroups.find((g) => g.name === name)?.ids ?? []);
  const blocked: [string, string][] = timeline.contested.map(([a, b]) => [a, b]);
  let groupPairs = 0;
  for (const group of source.blockedGroups) {
    if (!group.reason?.trim()) log.error(`blocked group ${group.name}: reason is empty`);
    for (const id of group.ids) if (!has(id)) log.error(`blocked group ${group.name}: ${id} is not a Timeline event`);
    for (let i = 0; i < group.ids.length; i++) for (let j = i + 1; j < group.ids.length; j++) { blocked.push([group.ids[i], group.ids[j]]); groupPairs++; }
  }
  blocked.push(...checkBlocked(log, source.blocked, has));

  // The guards (§4.2): every miracle of Jesus and every plague in its group; no event about writing a book.
  const miracles = groupMembers("Jesus's miracles");
  const plagues = groupMembers("the plagues");
  for (const e of timeline.events) {
    if (excluded.has(e.id)) continue;
    if (MIRACLE.test(e.label) && !miracles.has(e.id)) log.error(`${e.id} ("${e.label}") is a miracle of Jesus outside the miracles group`);
    if (PLAGUE.test(e.label) && !plagues.has(e.id)) log.error(`${e.id} ("${e.label}") names a plague but is outside the plagues group`);
    if (WRITING.test(e.label)) log.error(`${e.id} ("${e.label}") is about writing; which book was written first is left out`);
  }

  const items: EventItem[] = timeline.events.filter((e) => !excluded.has(e.id)).map((e) => ({
    id: e.id, label: e.label, tier: e.tier, lo: e.lo, hi: e.hi, shown: e.shown, dating: e.dating, refs: e.refs, people: e.people,
  }));
  const ids = new Set(items.map((e) => e.id));
  const facts: Fact[] = timeline.facts.filter((f) => ids.has(f.first) && ids.has(f.second))
    .map((f) => ({ first: f.first, second: f.second, kind: "stated", refs: f.refs, why: f.why, ...(f.close ? { close: true } : {}) }));
  const byId = new Map(items.map((e) => [e.id, e as Item]));
  checkUniqueLabels(log, items);
  checkFactAgreement(log, facts, byId);

  // A blocked group that would never have produced a pair is dead weight: say so.
  const factKeys = new Set(facts.map((f) => pairKey(f.first, f.second)));
  for (const group of source.blockedGroups) {
    const live = group.ids.some((a, i) => group.ids.slice(i + 1).some((b) => {
      const [x, y] = [known.get(a)!, known.get(b)!];
      const windows = x && y && x.shown && y.shown && ((x.hi !== null && y.lo !== null && x.hi < y.lo) || (y.hi !== null && x.lo !== null && y.hi < x.lo));
      return factKeys.has(pairKey(a, b)) || windows;
    }));
    if (!live) log.notice(`blocked group ${group.name} would never have produced a pair`);
  }

  const pool = settlePool(log, "happened", items, facts, blocked, MIN_PARTNERS);
  checkBandMinimum(log, pool.perBand, MIN_PER_BAND);
  independentCheck(log, pool.orders, facts, blocked);
  const kept = new Set(pool.items.map((e) => e.id));
  const keptFacts = facts.filter((f) => kept.has(f.first) && kept.has(f.second));
  const keptBlocked = blocked.filter(([a, b]) => kept.has(a) && kept.has(b));
  const body = {
    about: "Generated by scripts/build-what-came-first.ts from src/data/timeline/timeline.json and src/data/what-came-first/events.source.json; do not edit.",
    sources: sourcesHash([timeline.stamp, text]),
    category: "happened",
    books: usedBooks([...pool.items.flatMap((e) => e.refs), ...keptFacts.flatMap((f) => f.refs)]),
    items: pool.items,
    facts: keptFacts,
    blocked: keptBlocked,
  };
  return { log, pool, facts: keptFacts, blocked: keptBlocked, body, source, contested: timeline.contested.length, groupPairs, timelineEvents: timeline.events.length };
}
