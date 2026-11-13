// What was built first? and Who died first? (categories 4 and 6, design §4.4 and §4.6): hand-kept items whose windows
// are computed from an anchor (a Timeline event, a ruler's reign, a Who's older? birth window plus an age), so the same
// date is never typed twice. Each item's deciding verse must contain its `match` word in the site's Berean text.
import path from "node:path";
import { addYears, anchorRange, type Anchor, type Range } from "../timeline/anchors.ts";
import { type Fact, type Item, type PairCategory, type Span, type Tier } from "../../src/pages/games/what-came-first/order.ts";
import { SITE, loadPeople, loadPeoplePages, readJson } from "../whos-older/site-data.ts";
import { Log, checkBandMinimum, checkBlocked, checkFactAgreement, checkHandFacts, checkMatch, checkSpans, checkUniqueLabels,
  checkWindow, independentCheck, readSource, settlePool, sourcesHash, usedBooks, type LeftOut, type Pool, type SourceBlocked,
  type SourceFact } from "./common.ts";

type HandAnchor = Anchor | { kind: "event"; event: string } | { kind: "reign-end"; ruler: string } | { kind: "lifespan" };
interface SourceHandItem { id: string; label: string; tag: string; tier: Tier; refs?: Span[]; death?: Span[]; match: string;
  anchor?: HandAnchor; window?: HandAnchor; shown?: boolean; when: string }
interface HandSource { items?: SourceHandItem[]; people?: SourceHandItem[]; facts: SourceFact[]; blocked: SourceBlocked[]; leftOut?: LeftOut[] }

export type HandItem = Item & { tag: string; when: string; refs: Span[] };
export interface HandResult {
  log: Log; pool: Pool<HandItem>; facts: Fact[]; blocked: [string, string][]; leftOut: LeftOut[]; source: HandSource;
  notes: Map<string, string>; body: Record<string, unknown> & { about: string };
}

interface TimelineEvent { id: string; lo: number | null; hi: number | null; shown: boolean }
const LIFESPAN_MAX = 130; // Jehoiada, 2 Chronicles 24:15: the longest recorded life after Moses
const MOSES = "moses-exo-2-10";

const births = new Map<string, Range & { shown: boolean }>(readJson<{ characters: { id: string; born: Range; shown?: boolean }[] }>(
  path.join(SITE, "src", "data", "whos-older", "characters.source.json")).characters.map((c) => [c.id, { ...c.born, shown: c.shown !== false }]));
const events = new Map(readJson<{ events: TimelineEvent[] }>(path.join(SITE, "src", "data", "timeline", "timeline.json")).events.map((e) => [e.id, e]));
const rulers = loadPeoplePages().rulers;

/** The window an anchor gives, in historians' years, and whether it may be shown; or an error message. */
function windowOf(anchor: HandAnchor | undefined, personId: string): { range?: Range; shown?: boolean; error?: string; how: string } {
  if (!anchor) return { error: "an anchor is required", how: "" };
  switch (anchor.kind) {
    case "event": {
      const e = events.get(anchor.event);
      return e ? { range: { lo: e.lo, hi: e.hi }, shown: e.shown, how: `Timeline event ${anchor.event}` } : { error: `event ${anchor.event} is not in timeline.json`, how: "" };
    }
    case "reign-end": {
      const ends = (rulers.get(anchor.ruler)?.reigns ?? []).map((r) => -r.end);
      if (!ends.length) return { error: `reign-end: ${anchor.ruler} has no dated reign on the people-pages`, how: "" };
      return { range: { lo: addYears(Math.min(...ends), -1), hi: addYears(Math.max(...ends), 1) }, shown: true, how: `end of ${anchor.ruler}'s reign on every system, widened a year` };
    }
    case "lifespan": {
      const born = births.get(personId);
      const moses = births.get(MOSES)!;
      if (!born || born.lo === null || born.hi === null) return { error: `lifespan: ${personId} has no Who's older? birth window`, how: "" };
      if (moses.lo === null || born.lo < moses.lo) return { error: `lifespan is only for people born after the Exodus generation; ${personId}'s birth window starts ${born.lo}`, how: "" };
      return { range: { lo: born.lo, hi: addYears(born.hi, LIFESPAN_MAX) }, shown: true, how: `Who's older? birth window plus 0 to ${LIFESPAN_MAX} years` };
    }
    default: {
      const found = anchorRange(anchor, { births, rulers });
      if (found.error) return { error: found.error, how: "" };
      const shown = anchor.kind === "person-age" ? births.get(anchor.person)?.shown ?? true : true;
      const how = anchor.kind === "person-age" ? `Who's older? birth window of ${anchor.person} plus ${anchor.age.join(" to ")} years`
        : anchor.kind === "reign-year" ? `${anchor.ruler}'s accession on every system, regnal year ${anchor.year.join(" to ")}`
        : anchor.kind === "outside" ? "a hand window" : `no years: ${anchor.note}`;
      return { range: found.range ?? { lo: null, hi: null }, shown, how };
    }
  }
}

export function buildHand(category: Extract<PairCategory, "built" | "died">, file: string, minPartners: number, minPerBand: number): HandResult {
  const log = new Log(category);
  const { text, data: source } = readSource<HandSource>(file);
  const people = loadPeople();
  const notes = new Map<string, string>();
  const items: HandItem[] = [];
  for (const s of (category === "built" ? source.items : source.people) ?? []) {
    const refs = (category === "built" ? s.refs : s.death) ?? [];
    if (!checkSpans(log, `${s.id} verse`, refs)) continue;
    checkMatch(log, `${s.id} verse`, refs, s.match);
    if (!s.when?.trim() || !s.tag?.trim()) log.error(`${s.id}: when and tag are required`);
    if (category === "died" && !people.has(s.id)) log.error(`${s.id} (${s.label}): not in data/study/people.json`);
    const found = windowOf(category === "built" ? s.anchor : s.window, s.id);
    if (found.error) { log.error(`${s.id} (${s.label}): ${found.error}`); continue; }
    const { lo, hi } = found.range!;
    checkWindow(log, s.id, lo, hi);
    const born = births.get(s.id);
    if (category === "died" && born?.lo != null && lo !== null && lo < born.lo) log.error(`${s.label}: death window starts ${lo}, before the birth window (${born.lo})`);
    notes.set(s.id, found.how);
    items.push({ id: s.id, label: s.label, tag: s.tag, tier: s.tier, lo, hi, shown: s.shown ?? found.shown ?? true, when: s.when, refs });
  }
  checkUniqueLabels(log, items);
  const hidden = items.filter((i) => !i.shown);
  const earliestShown = Math.min(...items.filter((i) => i.shown && i.lo !== null).map((i) => i.lo!));
  for (const i of hidden) if (i.hi === null || i.hi >= earliestShown) log.error(`${i.label}: an early-Genesis (not shown) window must end before every shown window starts (${earliestShown})`);

  const byId = new Map(items.map((i) => [i.id, i as Item]));
  const facts = checkHandFacts(log, source.facts, byId);
  checkFactAgreement(log, facts, byId);
  const blocked = checkBlocked(log, source.blocked, (id) => byId.has(id));
  for (const l of source.leftOut ?? []) if (!l.name?.trim() || !l.reason?.trim()) log.error(`left-out entry needs a name and a reason: ${JSON.stringify(l)}`);

  const pool = settlePool(log, category, items, facts, blocked, minPartners);
  checkBandMinimum(log, pool.perBand, minPerBand);
  independentCheck(log, pool.orders, facts, blocked);
  const kept = new Set(pool.items.map((i) => i.id));
  const keptFacts = facts.filter((f) => kept.has(f.first) && kept.has(f.second));
  const keptBlocked = blocked.filter(([a, b]) => kept.has(a) && kept.has(b));
  const body = {
    about: `Generated by scripts/build-what-came-first.ts from src/data/what-came-first/${file} and the site's data; do not edit.`,
    sources: sourcesHash([text]),
    category,
    books: usedBooks([...pool.items.flatMap((i) => i.refs), ...keptFacts.flatMap((f) => f.refs)]),
    items: pool.items,
    facts: keptFacts,
    blocked: keptBlocked,
  };
  return { log, pool, facts: keptFacts, blocked: keptBlocked, leftOut: source.leftOut ?? [], source, notes, body };
}
