// Where did they go first? (category 5, design §4.5): stops of one traveller's one journey, in the order of first
// arrival. Every arrival verse must name the place (its `match`) in the site's Berean text, the verses must run in the
// journey's order, and two stops that arrive in one verse need the wording that orders them or a block.
import path from "node:path";
import { pairKey, type Item, type Span, type Tier } from "../../src/pages/games/what-came-first/order.ts";
import { SITE, loadPeople, readJson } from "../whos-older/site-data.ts";
import { Log, checkBandMinimum, checkMatch, checkSpans, checkUniqueLabels, independentCheck, readSource, settlePool,
  sourcesHash, usedBooks, type LeftOut, type Pool } from "./common.ts";

const MIN_STOPS = 3;
const MIN_PARTNERS = 2;
const MIN_PER_BAND = 50;

interface SourceStop { id: string; place: string; placeId: string | null; arrive: Span[]; match?: string; tier: Tier; sameVerse?: string; note?: string }
interface SourceJourney { id: string; traveller: string; travellerId: string | null; title: string; span: Span[]; origin: { place: string; refs: Span[] }; stops: SourceStop[] }
interface JourneysSource { journeys: SourceJourney[]; blocked: { journey: string; a: string; b: string; reason: string }[]; leftOut: LeftOut[] }

export type StopItem = Item & { placeId: string | null; refs: Span[] };
export interface JourneysResult {
  log: Log; pool: Pool<StopItem>; blocked: [string, string][]; source: JourneysSource; journeys: number;
  body: Record<string, unknown> & { about: string };
}

export function buildJourneys(): JourneysResult {
  const log = new Log("went");
  const { text, data: source } = readSource<JourneysSource>("journeys.source.json");
  const people = loadPeople();
  const places = new Set(readJson<{ id: string }[]>(path.join(SITE, "src", "data", "map-quest", "places.json")).map((p) => p.id));
  const items: StopItem[] = [];
  const journeyOf = new Map<string, string>();
  const sameVerse = new Map<string, string>();
  for (const j of source.journeys) {
    const where = `journey ${j.id}`;
    if (j.travellerId !== null && !people.has(j.travellerId)) log.error(`${where}: traveller ${j.travellerId} is not in data/study/people.json`);
    if (!j.traveller?.trim() || !j.title?.trim()) log.error(`${where}: traveller and title are required`);
    checkSpans(log, `${where} span`, j.span);
    checkSpans(log, `${where} origin`, j.origin?.refs);
    if (j.stops.length < MIN_STOPS) log.error(`${where}: ${j.stops.length} stops (at least ${MIN_STOPS} needed)`);
    let previous: { verse: number; id: string } | null = null;
    j.stops.forEach((s, index) => {
      const at = `${where} stop ${s.id}`;
      if (s.place.trim().toLowerCase() === j.origin.place.trim().toLowerCase()) log.error(`${at}: the journey's origin is never a stop`);
      if (s.placeId !== null && !places.has(s.placeId)) log.error(`${at}: place ${s.placeId} is not in places.json`);
      if (!checkSpans(log, at, s.arrive)) return;
      checkMatch(log, at, s.arrive, s.match ?? s.place);
      const verse = s.arrive[0][0];
      if (previous && verse < previous.verse) log.error(`${at}: arrives at ${verse}, before the stop listed ahead of it (${previous.id}, ${previous.verse})`);
      if (previous && verse === previous.verse) sameVerse.set(pairKey(previous.id, s.id), s.sameVerse ?? "");
      previous = { verse, id: s.id };
      journeyOf.set(s.id, j.id);
      items.push({ id: s.id, label: s.place, tier: s.tier, lo: null, hi: null, shown: true, position: index + 1, group: j.id, placeId: s.placeId, refs: s.arrive });
    });
  }
  checkUniqueLabels(log, items);
  const ids = new Set<string>();
  for (const item of items) { if (ids.has(item.id)) log.error(`stop id ${item.id} is used twice`); ids.add(item.id); }

  const blocked: [string, string][] = [];
  for (const b of source.blocked) {
    if (journeyOf.get(b.a) !== b.journey || journeyOf.get(b.b) !== b.journey) log.error(`blocked pair ${b.a} / ${b.b}: both must be stops of ${b.journey}`);
    if (!b.reason?.trim()) log.error(`blocked pair ${b.a} / ${b.b}: reason is empty`);
    blocked.push([b.a, b.b]);
  }
  const blockedKeys = new Set(blocked.map(([a, b]) => pairKey(a, b)));
  for (const [key, wording] of sameVerse) {
    if (!wording.trim() && !blockedKeys.has(key)) log.error(`stops ${key.replace("|", " and ")} arrive in one verse: give "sameVerse" wording that orders them, or block the pair`);
  }
  for (const l of source.leftOut) if (!l.name?.trim() || !l.reason?.trim()) log.error(`left-out entry needs a name and a reason: ${JSON.stringify(l)}`);

  const pool = settlePool(log, "went", items, [], blocked, MIN_PARTNERS);
  checkBandMinimum(log, pool.perBand, MIN_PER_BAND);
  independentCheck(log, pool.orders, [], blocked);
  for (const o of pool.orders) if (o.first.group !== o.second.group) log.error(`stops of two journeys paired: ${o.first.id} / ${o.second.id}`);
  const kept = new Set(pool.items.map((i) => i.id));
  const body = {
    about: "Generated by scripts/build-what-came-first.ts from src/data/what-came-first/journeys.source.json; do not edit.",
    sources: sourcesHash([text]),
    category: "went",
    books: usedBooks(pool.items.flatMap((i) => i.refs)),
    journeys: source.journeys.map((j) => ({ id: j.id, traveller: j.traveller, travellerId: j.travellerId, title: j.title, span: j.span, origin: j.origin.place })),
    items: pool.items,
    facts: [],
    blocked: blocked.filter(([a, b]) => kept.has(a) && kept.has(b)),
  };
  return { log, pool, blocked, source, journeys: source.journeys.length, body };
}
