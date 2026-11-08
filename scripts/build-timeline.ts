// Timeline sort: builds src/data/timeline/timeline.json (what the game loads), daily.json (the Daily schedule) and
// docs/features/timeline-sort/review-sheet.md (the owner's review sheet) from the three hand-kept source files in
// src/data/timeline/ and the site's own data (design §4). Run by hand after editing a source file:
//   node --experimental-strip-types scripts/build-timeline.ts [--epoch YYYY-MM-DD] [--freeze-days N]
// It writes nothing and exits 1 on any contradiction, naming the events involved. It never changes a Daily puzzle up to
// --freeze-days (14) ahead of the build date, nor any past one.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DAILY_CARDS, dayProblems, extendDays, type TimelineSchedule } from "../src/pages/games/timeline/daily-rules.ts";
import { ERA_KEYS, buildOrderIndex, pairKey, type Era, type OrderFact, type Span, type Tier, type TimelineEvent } from "../src/pages/games/timeline/order.ts";
import { checkYear } from "../src/pages/games/whos-older/pairing.ts";
import { anchorRange, contains, type Anchor, type Range } from "./timeline/anchors.ts";
import { harmonySections, rankEvents, roundsWith, settledContested, theographicYears, thinPacks } from "./timeline/checks.ts";
import { reviewSheet, type SheetWarning } from "./timeline/review-sheet.ts";
import { Bsb, SITE, loadBooks, loadPeople, loadPeoplePages, loadSlugs, readJson } from "./whos-older/site-data.ts";

const FOLDER = path.join(SITE, "src", "data", "timeline");
export const SOURCE_FILES = ["events.source.json", "facts.source.json", "contested.source.json"];
const OUT = path.join(FOLDER, "timeline.json");
const DAILY = path.join(FOLDER, "daily.json");
const SHEET = path.join(SITE, "docs", "features", "timeline-sort", "review-sheet.md");
const ABRAM_CALLED = "abram-called";
const LABEL_MAX = 48;
const QUOTE_MAX_VERSES = 3;
const MIN_ROUNDS_WITH = 20;
const MIN_ROUNDS_PER_PACK = 200;
const FROZEN_AHEAD = 14;
const YEARS_AHEAD_DAYS = 3 * 365;

interface SourceEvent {
  id: string; label: string; era: Era; tier: Tier; when: Range; shown?: boolean; dating: string; refs: Span[];
  people?: string[]; anchor?: Anchor; retired?: boolean;
}
interface SourceFact { first: string; second: string; refs: Span[]; why: string; close?: boolean }
interface SourceContested { a: string[]; b: string[]; reason: string }

const errors: string[] = [];
const warnings: SheetWarning[] = [];
const notices: string[] = [];
const fail = (message: string): never => { console.error(`timeline sort: ${message}`); process.exit(1); };
const argument = (name: string) => { const at = process.argv.indexOf(`--${name}`); return at > 0 ? process.argv[at + 1] : undefined; };

const sourceText = SOURCE_FILES.map((name) => fs.readFileSync(path.join(FOLDER, name), "utf8"));
const eventsSource = JSON.parse(sourceText[0]) as { events: SourceEvent[]; resolutions?: Record<string, string> };
const factsSource = JSON.parse(sourceText[1]) as { facts: SourceFact[] };
const contestedSource = JSON.parse(sourceText[2]) as { contested: SourceContested[] };
const resolutions = eventsSource.resolutions ?? {};

const people = loadPeople();
const slugs = loadSlugs();
const books = loadBooks();
const bsb = new Bsb(books);
const { rulers } = loadPeoplePages();
const whosOlder = readJson<{ characters: { id: string; born: Range }[] }>(path.join(SITE, "src", "data", "whos-older", "characters.source.json"));
const births = new Map(whosOlder.characters.map((c) => [c.id, c.born]));

const bookName = (verse: number) => books.get(Math.floor(verse / 1_000_000))?.name ?? "?";
const refText = ([start, end]: Span) => `${bookName(start)} ${Math.floor(start / 1000) % 1000}:${start % 1000}${end > start ? `–${Math.floor(end / 1000) % 1000 === Math.floor(start / 1000) % 1000 ? "" : `${Math.floor(end / 1000) % 1000}:`}${end % 1000}` : ""}`;

function checkSpans(where: string, spans: unknown): spans is Span[] {
  if (!Array.isArray(spans) || !spans.length) { errors.push(`${where}: expected at least one verse span, got ${JSON.stringify(spans)}`); return false; }
  for (const span of spans) {
    const ok = Array.isArray(span) && span.length === 2 && span[0] <= span[1] && bsb.verse(span[0]) !== null && bsb.verse(span[1]) !== null;
    if (!ok) { errors.push(`${where}: verse span ${JSON.stringify(span)} is not in the BSB text`); return false; }
  }
  return true;
}

/** The first span's words, at most three verses in one chapter: shown in the reveal (§8.3). */
function quoteOf(where: string, [start, end]: Span): string {
  if (end - start >= QUOTE_MAX_VERSES || Math.floor(start / 1000) !== Math.floor(end / 1000)) {
    errors.push(`${where}: the first span ${refText([start, end])} is quoted, so it must be at most ${QUOTE_MAX_VERSES} verses in one chapter`);
  }
  const quote = Array.from({ length: Math.min(end - start + 1, QUOTE_MAX_VERSES) }, (_, n) => bsb.verse(start + n)).filter(Boolean).join(" ");
  if (!quote.trim()) errors.push(`${where}: the first span ${refText([start, end])} has no BSB words to quote`);
  return quote;
}

function describeAnchor(anchor: Anchor): string {
  switch (anchor.kind) {
    case "person-age": return `${anchor.person} aged ${anchor.age[0]}–${anchor.age[1]}`;
    case "reign-year": return `${anchor.ruler}, year ${anchor.year[0]}–${anchor.year[1]} of the reign`;
    case "outside": return `outside date ${anchor.years[0]}..${anchor.years[1]}`;
    default: return anchor.note;
  }
}

/** Labels told apart by more than punctuation, case and little words (§3.1). */
const labelKey = (label: string) => label.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w && !["the", "a", "an", "of", "to"].includes(w)).join(" ");

// Checks 1–3: ids, labels, windows, anchors, verses, people.
const seenIds = new Set<string>();
const seenLabels = new Map<string, string>();
const anchorText = new Map<string, string>();
for (const e of eventsSource.events) {
  const where = `${e.id} (${e.label})`;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id ?? "")) errors.push(`${where}: id must be lower-case words joined by hyphens`);
  if (seenIds.has(e.id)) errors.push(`${e.id}: listed twice`);
  seenIds.add(e.id);
  if (!e.label?.trim() || e.label.length > LABEL_MAX) errors.push(`${where}: label must be 1–${LABEL_MAX} characters, got ${e.label?.length ?? 0}`);
  const key = labelKey(e.label ?? "");
  if (seenLabels.has(key)) errors.push(`labels "${e.label}" (${e.id}) and ${seenLabels.get(key)} read the same`);
  seenLabels.set(key, `"${e.label}" (${e.id})`);
  if (!ERA_KEYS.includes(e.era)) errors.push(`${where}: era must be one of ${ERA_KEYS.join(", ")}, got ${e.era}`);
  if (![1, 2, 3].includes(e.tier)) errors.push(`${where}: tier must be 1, 2 or 3, got ${e.tier}`);
  if (!e.dating?.trim()) errors.push(`${where}: dating is empty`);
  const { lo, hi } = e.when ?? { lo: undefined, hi: undefined };
  try {
    if (lo === undefined || hi === undefined) throw new Error("when needs lo and hi (null for an open edge)");
    if (lo !== null) checkYear(lo);
    if (hi !== null) checkYear(hi);
    if (lo !== null && hi !== null && !(lo < hi)) throw new Error(`lo ${lo} must be before hi ${hi}`);
  } catch (error) {
    errors.push(`${where}: window ${JSON.stringify(e.when)}: ${(error as Error).message}`);
  }
  if (checkSpans(`${where} refs`, e.refs)) quoteOf(where, e.refs[0]);
  for (const id of e.people ?? []) {
    const row = people.get(id);
    if (!row) errors.push(`${where}: person ${id} is not in data/study/people.json`);
    else if (row.g) errors.push(`${where}: ${id} is a group, not a person`);
  }
  if (e.anchor) {
    const { range, error, notice } = anchorRange(e.anchor, { births, rulers });
    if (error) errors.push(`${where}: ${error}`);
    if (notice) notices.push(`${e.label}: ${notice}`);
    if (range && e.when && !contains(e.when, range)) errors.push(`${where}: window ${e.when.lo}..${e.when.hi} is narrower than its ${e.anchor.kind} anchor allows (${range.lo}..${range.hi})`);
    anchorText.set(e.id, `${describeAnchor(e.anchor)}${range ? `, giving ${range.lo}..${range.hi}` : ""}`);
  } else anchorText.set(e.id, "");
}
const abram = eventsSource.events.find((e) => e.id === ABRAM_CALLED);
if (!abram || abram.when.lo === null) errors.push(`${ABRAM_CALLED}: the call of Abram must be in the pool with an earliest year (early-Genesis windows end before it)`);
for (const e of eventsSource.events.filter((e) => e.shown === false)) {
  if (abram?.when.lo != null && !(e.when.hi !== null && e.when.hi < abram.when.lo)) errors.push(`${e.id}: an early-Genesis (shown: false) window must end before ${abram.when.lo}, got ${JSON.stringify(e.when)}`);
}

const known = new Map(eventsSource.events.map((e) => [e.id, e]));
const name = (id: string) => known.get(id)?.label ?? id;

// Facts (§4.4) and check 4: every fact agrees with the windows.
const facts: OrderFact[] = [];
const factKeys = new Set<string>();
for (const f of factsSource.facts) {
  const where = `fact ${f.first} > ${f.second}`;
  const [a, b] = [known.get(f.first), known.get(f.second)];
  if (!a || !b) { errors.push(`${where}: both events must be in the pool`); continue; }
  if (f.first === f.second) { errors.push(`${where}: an event cannot come before itself`); continue; }
  if (factKeys.has(pairKey(f.first, f.second))) { errors.push(`${where}: the pair has two facts; keep one`); continue; }
  factKeys.add(pairKey(f.first, f.second));
  if (!f.why?.trim()) errors.push(`${where}: why is empty`);
  if (a.when.lo !== null && b.when.hi !== null && a.when.lo > b.when.hi) errors.push(`${where} contradicts the windows: ${a.label} cannot be earlier than ${a.when.lo}, after ${b.label}'s latest year ${b.when.hi}`);
  if (checkSpans(where, f.refs)) facts.push({ first: f.first, second: f.second, refs: f.refs, why: f.why, close: f.close === true });
}

const contested: [string, string][] = [];
for (const c of contestedSource.contested) {
  const where = `contested ${c.a?.join(",")} / ${c.b?.join(",")}`;
  if (!c.reason?.trim()) errors.push(`${where}: reason is empty`);
  for (const id of [...(c.a ?? []), ...(c.b ?? [])]) if (!known.has(id)) errors.push(`${where}: ${id} is not in the pool`);
  for (const a of c.a ?? []) for (const b of c.b ?? []) if (a !== b && known.has(a) && known.has(b)) contested.push([a, b]);
}
if (errors.length) fail(`${errors.length} problem(s); nothing was written.\n- ${errors.join("\n- ")}`);

// Check 5: no loops, and every contested pair uncertain under the full chain. Then the whole-pool order (§5.1).
const drafts = eventsSource.events.map((e) => ({ id: e.id, label: e.label, era: e.era, tier: e.tier, lo: e.when.lo, hi: e.when.hi, shown: e.shown !== false, ...(e.retired ? { retired: true } : {}) }));
const ranked = rankEvents(drafts, facts);
if ("loop" in ranked) fail(`windows and facts contradict each other in a loop: ${ranked.loop.map(name).join(" before ")}; nothing was written.`);
const settled = settledContested(drafts, facts, contested);
if (settled.length) fail(`facts or windows settle these contested pairs, so a fact claims more than the evidence allows:\n- ${settled.join("\n- ")}`);
const rankOf = new Map((ranked as { order: string[] }).order.map((id, i) => [id, i]));
let events: TimelineEvent[] = drafts.map((d) => ({ ...d, rank: rankOf.get(d.id)! })).sort((a, b) => a.rank - b.rank);

// Check 6: agreement with Who's older? — a fact between two births must not contradict its windows.
const birthOf = new Map(eventsSource.events.filter((e) => e.anchor?.kind === "person-age" && e.anchor.age[0] === 0 && e.anchor.age[1] === 0).map((e) => [e.id, (e.anchor as { person: string }).person]));
for (const f of facts) {
  const [p, q] = [birthOf.get(f.first), birthOf.get(f.second)];
  const [bp, bq] = [p && births.get(p), q && births.get(q)];
  if (bp && bq && bq.hi !== null && bp.lo !== null && bq.hi < bp.lo) errors.push(`fact ${f.first} > ${f.second}: Who's older? has ${q} certainly born before ${p}`);
}

// Check 9: every event in enough different rounds (else left out), and enough rounds per level and era pack.
let index = buildOrderIndex(events, facts, contested);
const dropped = new Set<string>();
for (const event of index.active) {
  const count = roundsWith(index, event, 5, MIN_ROUNDS_WITH);
  if (count < MIN_ROUNDS_WITH) { dropped.add(event.id); notices.push(`${event.label}: only ${count} different valid five-card rounds (at least ${MIN_ROUNDS_WITH} needed), left out`); }
}
if (dropped.size) {
  events = events.filter((e) => !dropped.has(e.id));
  index = buildOrderIndex(events, facts.filter((f) => !dropped.has(f.first) && !dropped.has(f.second)), contested.filter(([a, b]) => !dropped.has(a) && !dropped.has(b)));
}
errors.push(...thinPacks(index, MIN_ROUNDS_PER_PACK));

// Checks 7 and 8: Theographic and Robertson's harmony, warnings with resolution notes.
const theo = theographicYears(eventsSource.events);
if (!theo) notices.push("Theographic's held copy was not found; its cross-check was skipped");
else {
  for (const a of index.active) for (const b of index.active) {
    const [ya, yb] = [theo.get(a.id), theo.get(b.id)];
    if (ya && yb && a.rank < b.rank && ya.year > yb.year && (a.hi !== null && b.lo !== null && a.hi < b.lo || index.facts.get(pairKey(a.id, b.id))?.first === a.id)) {
      warnings.push({ id: `theographic-order:${a.id}>${b.id}`, text: `Theographic dates ${b.label} (${yb.year}, "${yb.title}") before ${a.label} (${ya.year}, "${ya.title}"), against a certain order.` });
    }
  }
}
const harmony = harmonySections();
if (!harmony) notices.push("Robertson's harmony (data/study/harmony.json) was not found; its cross-check was skipped");
else {
  for (const f of facts) {
    if (known.get(f.first)?.era !== "jesus" || known.get(f.second)?.era !== "jesus") continue;
    const [sa, sb] = [harmony.get(known.get(f.first)!.refs[0][0]), harmony.get(known.get(f.second)!.refs[0][0])];
    if (sa !== undefined && sb !== undefined && sa > sb) warnings.push({ id: `harmony-order:${f.first}>${f.second}`, text: `Robertson's harmony places ${name(f.second)} (section ${sb + 1}) before ${name(f.first)} (section ${sa + 1}), against the fact "${f.why}"` });
  }
}
if (errors.length) fail(`${errors.length} problem(s); nothing was written.\n- ${errors.join("\n- ")}`);

// The Daily schedule (§6.1): frozen days kept (extended first with the browser's fallback), the rest worked out.
const DAY_MS = 86_400_000;
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const dayNumber = (key: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) fail(`expected a date as YYYY-MM-DD, got ${JSON.stringify(key)}`);
  return Date.UTC(Number(match![1]), Number(match![2]) - 1, Number(match![3])) / DAY_MS;
};
const existing = fs.existsSync(DAILY) ? readJson<TimelineSchedule>(DAILY) : null;
const freezeDays = Number(argument("freeze-days") ?? FROZEN_AHEAD);
if (!Number.isInteger(freezeDays) || freezeDays < 2) fail(`--freeze-days must be a whole number of at least 2 (every time zone needs that), got ${argument("freeze-days")}`);
const epochFlag = argument("epoch");
if (existing && epochFlag && epochFlag !== existing.epoch) fail(`daily.json already starts on ${existing.epoch}; changing it to ${epochFlag} would renumber every puzzle. Before launch, delete daily.json and build again; after launch, never.`);
const epoch = existing?.epoch ?? epochFlag ?? localToday();
const today = dayNumber(localToday()) - dayNumber(epoch) + 1;
const frozenThrough = Math.max(0, today + freezeDays);
const days: string[][] = existing ? existing.days.map((day) => [...day]) : [];
days.forEach((day, i) => { if (i < frozenThrough) for (const id of day) if (!index.byId.has(id)) fail(`puzzle #${i + 1} is frozen and uses ${id}: mark the event retired instead of deleting it`); });
if (existing && days.length < frozenThrough) extendDays(index, days, frozenThrough, existing.days.length);
days.length = Math.min(days.length, frozenThrough);
const kept = days.length;
const total = Math.max(frozenThrough, today) + YEARS_AHEAD_DAYS;
extendDays(index, days, total, Math.max(kept, 1));
for (let i = kept; i < days.length; i++) {
  const problems = dayProblems(index, days[i], days.slice(Math.max(0, i - 60), i));
  if (problems.length) errors.push(`puzzle #${i + 1}: ${problems.join("; ")}`);
}
if (days.some((day) => day.length !== DAILY_CARDS)) errors.push("a Daily puzzle does not have six events");
if (errors.length) fail(`the Daily schedule breaks its rules; nothing was written.\n- ${errors.slice(0, 20).join("\n- ")}`);

// Write: timeline.json, daily.json, the review sheet.
const href = (id: string) => `/people/${slugs.get(id) ?? id}`;
const usedBooks = [...new Set([...eventsSource.events.flatMap((e) => e.refs), ...facts.flatMap((f) => f.refs)].map(([start]) => Math.floor(start / 1_000_000)))].sort((a, b) => a - b);
const sources = crypto.createHash("sha256").update(sourceText.join("\u0000")).digest("hex").slice(0, 12);
const outEvents = events.map((event) => {
  const source = known.get(event.id)!;
  return { ...event, dating: source.dating, refs: source.refs, quote: quoteOf(event.id, source.refs[0]),
    people: (source.people ?? []).map((id) => ({ name: people.get(id)!.n, href: href(id) })) };
});
const keptIds = new Set(events.map((e) => e.id));
const body = {
  about: "Generated by scripts/build-timeline.ts from src/data/timeline/*.source.json and the site's data; do not edit.",
  sources,
  books: Object.fromEntries(usedBooks.map((num) => [num, [books.get(num)!.code, books.get(num)!.name]])),
  events: outEvents,
  facts: facts.filter((f) => keptIds.has(f.first) && keptIds.has(f.second)),
  contested: contested.filter(([a, b]) => keptIds.has(a) && keptIds.has(b)),
};
const stamp = sources;
const { about, ...rest } = body;
const lines = (items: unknown[]) => items.map((item) => `  ${JSON.stringify(item)}`).join(",\n");
const text = `{\n${Object.entries({ about, stamp, ...rest }).map(([key, value]) => (Array.isArray(value)
  ? `"${key}": [\n${lines(value)}\n]` : `"${key}": ${JSON.stringify(value)}`)).join(",\n")}\n}\n`;
fs.writeFileSync(OUT, text);
fs.writeFileSync(DAILY, `{"epoch":${JSON.stringify(epoch)},"builtOn":${JSON.stringify(localToday())},"frozenThrough":${frozenThrough},"days":[\n${days.map((day) => JSON.stringify(day)).join(",\n")}\n]}\n`);
fs.writeFileSync(SHEET, reviewSheet({
  events: eventsSource.events.map((e) => ({ id: e.id, label: e.label, era: e.era, tier: e.tier, lo: e.when.lo, hi: e.when.hi, shown: e.shown !== false,
    dating: e.dating, anchor: anchorText.get(e.id) ?? "", theographic: theo?.get(e.id) ? `${theo.get(e.id)!.year} ("${theo.get(e.id)!.title}")` : "",
    retired: e.retired, dropped: dropped.has(e.id) })),
  facts: facts.map((f) => ({ first: f.first, second: f.second, why: f.why, refs: f.refs.map(refText).join("; "), close: f.close })),
  contested: contestedSource.contested, warnings, resolutions, notices, stamp, dailyDays: days.length, frozenThrough,
}));

const unresolved = warnings.filter((w) => !resolutions[w.id]).length;
console.log(`timeline sort: ${events.length} events (${dropped.size} left out), ${body.facts.length} facts, ${body.contested.length} contested pairs; ` +
  `${days.length} Daily puzzles from ${epoch} (frozen through #${frozenThrough}); stamp ${stamp}.`);
console.log(`  ${warnings.length} warning(s), ${unresolved} needing a note; ${notices.length} notice(s). Review sheet: ${path.relative(SITE, SHEET)}`);
