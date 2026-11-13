// Who ruled first? (category 3, design §4.3): windows computed from the site's ruler pages, never typed by hand;
// successions derived from the pages; the hard rule that a succession, synchronism or stated fact is used only if every
// dating system that dates both rulers puts the first ruler's start strictly before the second's.
import fs from "node:fs";
import path from "node:path";
import { expandBeforeSaul, type BeforeSaul } from "../../src/pages/games/what-came-first/categories/ruled.ts";
import { pairKey, type Fact, type Item, type Span, type Tier } from "../../src/pages/games/what-came-first/order.ts";
import { labelsClash } from "../../src/pages/games/whos-older/pairing.ts";
import { addYears } from "../timeline/anchors.ts";
import { SITE, loadPeople, readJson } from "../whos-older/site-data.ts";
import { Log, checkBandMinimum, checkBlocked, checkFactAgreement, checkHandFacts, checkSpans, checkUniqueLabels,
  independentCheck, readSource, settlePool, sourcesHash, spanText, usedBooks, type LeftOut, type Pool, type SourceBlocked,
  type SourceFact } from "./common.ts";

const MIN_PARTNERS = 8;
const MIN_PER_BAND = 200;
const SYSTEM_NAMES: Record<string, string> = { "thiele-mcfall": "Thiele–McFall", albright: "Albright", ussher: "Ussher" };
const systemName = (system: string) => SYSTEM_NAMES[system] ?? system.replace(/^other:/, "") ?? system;
const SUCCESSION_WORDS = /in his place|in his stead|succeeded|became king|began to reign|reigned|made him king|anointed|after|throne|judged|king over|raised up|rose up|died|did evil/i;

interface PageDate { system: string; label?: string; from?: number; to?: number }
/** A dating system: the named ones as they are; "other" entries by their author (the label's first word), since two
 *  "other" entries agree on a system only when one author dates both. */
const systemOf = (d: PageDate) => (d.system === "other" ? `other:${(d.label ?? "").split(/[\s(,]+/)[0]}` : d.system);
interface Page { id: string; name: string; otherNames?: string[]; predecessor?: string; successor?: string; dates?: PageDate[]; records?: { length?: { years: number } }[] }
interface YearNote { year: number; reason: string }
interface SourceRuler { id: string; label: string; tag: string; tier: Tier; noPage?: string; succession?: { refs: Span[]; name?: string }; addFrom?: YearNote[]; ignoreFrom?: YearNote[] }
interface RulersSource { rulers: SourceRuler[]; beforeSaul: Omit<BeforeSaul, "saul">; facts: (SourceFact & { sameYear?: string })[]; blocked: SourceBlocked[]; leftOut: LeftOut[] }

export type RulerItem = Item & { tag: string; when: string; refs: Span[] };
export interface RulerNote { id: string; how: string }
export interface Refusal { first: string; second: string; kind: string; system: string; detail: string }
export interface RulersResult {
  log: Log; pool: Pool<RulerItem>; facts: Fact[]; expanded: Fact[]; blocked: [string, string][]; source: RulersSource;
  notes: Map<string, string>; refusals: Refusal[]; settledByWindows: number; body: Record<string, unknown> & { about: string };
}

const historian = (pageYear: number) => -pageYear; // pages: BC positive, AD negative
const yearText = (year: number) => (year < 0 ? `${-year} BC` : `AD ${year}`);

function loadPages(): Map<string, Page> {
  const folder = path.join(SITE, "src", "data", "people-pages");
  const pages = new Map<string, Page>();
  for (const name of fs.readdirSync(folder).filter((f) => f.startsWith("rulers-") && f.endsWith(".json"))) {
    for (const page of readJson<{ rulers: Page[] }>(path.join(folder, name)).rulers) pages.set(page.id, page);
  }
  return pages;
}

/** Each dated entry's start, in the page's numbering: `from`, or `to` plus the reign's length when only the end is given. */
function starts(page: Page): { system: string; year: number }[] {
  const length = page.records?.find((r) => r.length)?.length?.years;
  return (page.dates ?? []).flatMap((d) => {
    const year = d.from ?? (d.to !== undefined && length !== undefined ? d.to + length : undefined);
    return year === undefined ? [] : [{ system: systemOf(d), year }];
  });
}

/** The verse a ruler's page id names (e.g. abijah-1ki-14-31 -> 1 Kings 14:31), or null. */
function idVerse(id: string, codes: Map<string, number>): number | null {
  const match = id.match(/-([1-3]?[a-z]{2,3})-(\d+)-(\d+)$/);
  const book = match ? codes.get(match[1].toUpperCase()) : undefined;
  return book && match ? book * 1_000_000 + Number(match[2]) * 1000 + Number(match[3]) : null;
}

export function buildRulers(codes: Map<string, number>): RulersResult {
  const log = new Log("ruled");
  const { text, data: source } = readSource<RulersSource>("rulers.source.json");
  const pages = loadPages();
  const people = loadPeople();
  const notes = new Map<string, string>();
  const systemStarts = new Map<string, Map<string, number[]>>();
  const inPool = new Set(source.rulers.map((r) => r.id));

  const predecessorsOf = (id: string) => [...pages.values()].filter((p) => p.successor === id).map((p) => p.id)
    .concat(pages.get(id)?.predecessor ? [pages.get(id)!.predecessor!] : []);

  const items: RulerItem[] = [];
  for (const r of source.rulers) {
    const page = pages.get(r.id);
    if (!page && !(r.noPage && people.has(r.id))) { log.error(`${r.id} (${r.label}): no ruler page, and not marked noPage with a people id`); continue; }
    const ignored = new Set((r.ignoreFrom ?? []).map((n) => n.year));
    for (const n of [...(r.ignoreFrom ?? []), ...(r.addFrom ?? [])]) if (!n.reason?.trim()) log.error(`${r.id}: a year note needs its reason`);
    const own = page ? starts(page).filter((s) => !ignored.has(s.year)) : [];
    const bySystem = new Map<string, number[]>();
    for (const s of own) bySystem.set(s.system, [...(bySystem.get(s.system) ?? []), historian(s.year)]);
    systemStarts.set(r.id, bySystem);
    const years = [...own.map((s) => s.year), ...(r.addFrom ?? []).map((n) => n.year)];
    const predecessorEnds = own.length ? [...new Set(predecessorsOf(r.id))].flatMap((p) => (pages.get(p)?.dates ?? [])
      .flatMap((d) => (d.to !== undefined ? [d.to] : []))) : [];
    const all = [...years, ...predecessorEnds].map(historian);
    const lo = all.length ? addYears(Math.min(...all), -1) : null;
    const hi = all.length ? addYears(Math.max(...all), 1) : null;
    const verse = idVerse(r.id, codes);
    const refs: Span[] = verse ? [[verse, verse]] : [];
    if (!checkSpans(log, `${r.id} account verse`, refs)) continue;
    const named = own.filter((s) => s.system !== "bible").map((s) => `${systemName(s.system)} ${yearText(historian(s.year))}`);
    notes.set(r.id, all.length ? [`from the page: ${named.join(", ") || "none"}`,
      ...(r.addFrom ?? []).map((n) => `added ${yearText(historian(n.year))} (${n.reason})`),
      ...(r.ignoreFrom ?? []).map((n) => `ignored ${yearText(historian(n.year))} (${n.reason})`),
      ...(predecessorEnds.length ? [`predecessor's end: ${[...new Set(predecessorEnds)].map((y) => yearText(historian(y))).join(", ")}`] : []),
      "widened one year each side"].join("; ") : (r.noPage ?? "no years on the page: ordered only by verses"));
    const plain = [...new Set(all)].sort((a, b) => a - b);
    const when = !plain.length ? "Scripture gives no years for this rule; its order comes from the verses."
      : plain.length === 1 ? `Began to rule about ${yearText(plain[0])}.`
      : `Began to rule between about ${yearText(plain[0])} and ${yearText(plain[plain.length - 1])}, depending on the dating system.`;
    items.push({ id: r.id, label: r.label, tag: r.tag, tier: r.tier, lo, hi, shown: true, when, refs });
  }
  checkUniqueLabels(log, items);
  const byId = new Map(items.map((i) => [i.id, i as Item]));
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    if (labelsClash(items[i].label, items[j].label)) log.notice(`labels ${items[i].label} / ${items[j].label} could be misread, so never asked together`);
  }

  const blocked = checkBlocked(log, source.blocked, (id) => inPool.has(id));
  const blockedKeys = new Set(blocked.map(([a, b]) => pairKey(a, b)));
  const handFacts = checkHandFacts(log, source.facts, byId);
  const sameYear = new Map(source.facts.filter((f) => f.sameYear).map((f) => [pairKey(f.first, f.second), f.sameYear!]));
  const handKeys = new Set(handFacts.map((f) => pairKey(f.first, f.second)));

  // Successions from the pages, needed only where the windows do not already settle the order.
  const succession: Fact[] = [];
  let settledByWindows = 0;
  const seen = new Set<string>();
  for (const page of pages.values()) {
    for (const [first, second] of [[page.predecessor, page.id], [page.id, page.successor]] as [string | undefined, string | undefined][]) {
      if (!first || !second || !byId.has(first) || !byId.has(second)) continue;
      const key = pairKey(first, second);
      if (seen.has(key) || blockedKeys.has(key) || handKeys.has(key)) continue;
      seen.add(key);
      const [a, b] = [byId.get(first)!, byId.get(second)!];
      if (a.hi !== null && b.lo !== null && a.hi < b.lo) { settledByWindows++; continue; }
      const ruler = source.rulers.find((r) => r.id === second)!;
      const refs = ruler.succession?.refs ?? (items.find((i) => i.id === second)!.refs);
      if (!checkSpans(log, `succession ${first} > ${second}`, refs)) continue;
      const words = spanText(refs);
      const names = [ruler.succession?.name ?? "", b.label.split(/[\s,(]+/)[0], pages.get(second)?.name ?? "", ...(pages.get(second)?.otherNames ?? [])].filter(Boolean);
      if (!names.some((n) => words.includes(n)) || !SUCCESSION_WORDS.test(words)) {
        log.error(`succession ${a.label} > ${b.label}: the verse ${JSON.stringify(refs)} does not name ${b.label} with a word of succession; give a "succession" verse`);
        continue;
      }
      succession.push({ first, second, kind: "succession", refs, why: `${b.label} came after ${a.label}.`, derived: true });
    }
  }

  // The hard rule (§4.3): every dating system that dates both puts the first ruler's start strictly before the second's.
  const refusals: Refusal[] = [];
  const facts: Fact[] = [];
  for (const f of [...handFacts, ...succession]) {
    const key = pairKey(f.first, f.second);
    const a = systemStarts.get(f.first) ?? new Map();
    const b = systemStarts.get(f.second) ?? new Map();
    const shared = [...a.keys()].filter((s) => s !== "bible" && b.has(s));
    let problem: Refusal | null = null;
    for (const system of shared) {
      const [late, early] = [Math.max(...a.get(system)!), Math.min(...b.get(system)!)];
      if (late < early) continue;
      if (late === early && sameYear.has(key)) continue;
      problem = { first: f.first, second: f.second, kind: f.kind, system: systemName(system),
        detail: late === early ? `both in ${yearText(late)}` : `${byId.get(f.second)!.label} ${yearText(early)} before ${byId.get(f.first)!.label} ${yearText(late)}` };
      break;
    }
    if (!problem) { facts.push(f); continue; }
    if (blockedKeys.has(key)) refusals.push(problem);
    else log.error(`${f.kind} fact ${byId.get(f.first)!.label} > ${byId.get(f.second)!.label} fails on ${problem.system} (${problem.detail}): block the pair with its reason, or give a stated fact with "sameYear"`);
  }

  const rule: BeforeSaul = { ...source.beforeSaul, saul: "saul-1sa-9-2" };
  for (const id of rule.ids) if (!byId.has(id)) log.error(`beforeSaul: ${id} is not a ruler in the pool`);
  for (const id of rule.ids) if (byId.get(id)?.lo != null) log.error(`beforeSaul: ${id} has a window; only rulers without years are expanded`);
  if (checkSpans(log, "beforeSaul", rule.refs)) checkHandFacts(log, [{ first: rule.ids[0], second: rule.saul, refs: rule.refs, why: rule.why }], byId);
  const expanded = expandBeforeSaul(items, facts, rule);
  for (const f of expanded) if (byId.get(f.second)!.lo === null && f.second !== rule.saul && !facts.some((g) => g.first === rule.saul && g.second === f.second)) {
    log.error(`beforeSaul reaches ${f.second}, which has no window and no fact after Saul`);
  }
  const allFacts = [...facts, ...expanded];
  checkFactAgreement(log, allFacts, byId);

  const pool = settlePool(log, "ruled", items, allFacts, blocked, MIN_PARTNERS);
  checkBandMinimum(log, pool.perBand, MIN_PER_BAND);
  independentCheck(log, pool.orders, allFacts, blocked);
  const kept = new Set(pool.items.map((i) => i.id));
  const keptFacts = facts.filter((f) => kept.has(f.first) && kept.has(f.second));
  const keptBlocked = blocked.filter(([a, b]) => kept.has(a) && kept.has(b));
  const body = {
    about: "Generated by scripts/build-what-came-first.ts from src/data/what-came-first/rulers.source.json and the site's ruler pages (src/data/people-pages/); do not edit.",
    sources: sourcesHash([text, ...[...pages.values()].map((p) => JSON.stringify([p.id, p.dates, p.predecessor, p.successor]))]),
    category: "ruled",
    books: usedBooks([...pool.items.flatMap((i) => i.refs), ...keptFacts.flatMap((f) => f.refs), ...rule.refs]),
    beforeSaul: { ...rule, ids: rule.ids.filter((id) => kept.has(id)) },
    items: pool.items,
    facts: keptFacts,
    blocked: keptBlocked,
  };
  return { log, pool, facts: keptFacts, expanded: expanded.filter((f) => kept.has(f.first) && kept.has(f.second)), blocked: keptBlocked,
    source, notes, refusals, settledByWindows, body };
}
