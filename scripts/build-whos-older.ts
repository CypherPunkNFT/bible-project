// Who's older?: builds src/data/whos-older/whos-older.json (what the game loads) and
// docs/features/whos-older/review-sheet.md (the owner's review sheet) from the three hand-kept source files in
// src/data/whos-older/ and the site's own people data (design §4). Run by hand after editing a source file:
//   node --experimental-strip-types scripts/build-whos-older.ts
// It writes nothing and exits 1 on any contradiction, naming the people involved.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { BANDS, EXCLUDED_IDS, FACT_KINDS, allPairs, buildIndex, checkYear, labelsClash, pairKey, type Band, type Fact,
  type FactKind, type Span, type Tier } from "../src/pages/games/whos-older/pairing.ts";
import { factContradictions, pageBounds, windowCovers, type PageBounds } from "./whos-older/checks.ts";
import { reviewSheet, type SheetWarning } from "./whos-older/review-sheet.ts";
import { Bsb, SITE, loadBooks, loadPeople, loadPeoplePages, loadPersonFile, loadSlugs, loadTheographicBirths,
  type PersonRow } from "./whos-older/site-data.ts";

const FOLDER = path.join(SITE, "src", "data", "whos-older");
export const SOURCE_FILES = ["characters.source.json", "order-facts.source.json", "blocked-pairs.source.json"];
const OUT = path.join(FOLDER, "whos-older.json");
const SHEET = path.join(SITE, "docs", "features", "whos-older", "review-sheet.md");
const ABRAHAM = "abraham-gen-11-26";
const MIN_PARTNERS = 8;
const MIN_PER_BAND = 300;
const QUOTE_MAX_VERSES = 3;
const PERIOD_ORDER = ["early-world", "patriarchs", "exodus", "conquest", "judges", "united-kingdom", "divided-kingdom", "exile",
  "return", "life-of-christ", "early-church"];

interface SourceCharacter {
  id: string; label: string; tag: string; tier: Tier; born: { lo: number | null; hi: number | null }; shown?: boolean;
  when: string; basis: Span[]; pageAge?: [number, number]; pageSkip?: string; systems?: Record<string, number>;
}
interface SourceFact { first: string; second: string; kind: FactKind; refs: Span[]; why: string }
interface SourceBlocked { a: string; b: string; reason: string }

export interface Character {
  id: string; label: string; tag: string; tier: Tier; lo: number | null; hi: number | null; shown: boolean;
  when: string; brief: string; href: string;
}
interface OutFact extends Fact { quote?: string }

const errors: string[] = [];
const warnings: SheetWarning[] = [];
const notices: string[] = [];

const sourceText = SOURCE_FILES.map((name) => fs.readFileSync(path.join(FOLDER, name), "utf8"));
const charactersSource = JSON.parse(sourceText[0]) as { characters: SourceCharacter[]; resolutions?: Record<string, string> };
const factsSource = JSON.parse(sourceText[1]) as { facts: SourceFact[] };
const blockedSource = JSON.parse(sourceText[2]) as { blocked: SourceBlocked[] };
const resolutions = charactersSource.resolutions ?? {};

const people = loadPeople();
const slugs = loadSlugs();
const books = loadBooks();
const bsb = new Bsb(books);
const pages = loadPeoplePages();

function checkSpans(where: string, spans: unknown): spans is Span[] {
  if (!Array.isArray(spans) || !spans.length) { errors.push(`${where}: expected at least one verse span, got ${JSON.stringify(spans)}`); return false; }
  for (const span of spans) {
    const ok = Array.isArray(span) && span.length === 2 && span[0] <= span[1] && bsb.verse(span[0]) !== null && bsb.verse(span[1]) !== null;
    if (!ok) { errors.push(`${where}: verse span ${JSON.stringify(span)} is not in the BSB text`); return false; }
  }
  return true;
}

function checkWindow(c: SourceCharacter) {
  const { lo, hi } = c.born ?? {};
  try {
    if (lo !== null) checkYear(lo as number);
    if (hi === null) throw new Error("a latest bound is required (hi: null is not expected in the pool)");
    checkYear(hi as number);
    if (lo !== null && !(lo! < hi!)) throw new Error(`lo ${lo} must be before hi ${hi}`);
  } catch (error) {
    errors.push(`${c.id}: birth window ${JSON.stringify(c.born)}: ${(error as Error).message}`);
  }
  if (c.pageAge && !(Array.isArray(c.pageAge) && c.pageAge.length === 2 && c.pageAge[0] <= c.pageAge[1])) {
    errors.push(`${c.id}: pageAge must be [min, max], got ${JSON.stringify(c.pageAge)}`);
  }
}

// Checks 1–3: ids, labels, windows.
const seenLabels = new Map<string, string>();
const seenIds = new Set<string>();
for (const c of charactersSource.characters) {
  const row = people.get(c.id);
  if (!row) errors.push(`${c.id} (${c.label}): not in data/study/people.json`);
  else if (row.g) errors.push(`${c.id} (${c.label}): is a group, not a person`);
  if (EXCLUDED_IDS.includes(c.id)) errors.push(`${c.id} (${c.label}): is excluded from the game (design §3.3)`);
  if (seenIds.has(c.id)) errors.push(`${c.id}: listed twice`);
  seenIds.add(c.id);
  for (const field of ["label", "tag", "when"] as const) if (!c[field]?.trim()) errors.push(`${c.id}: ${field} is empty`);
  if (![1, 2, 3].includes(c.tier)) errors.push(`${c.id}: tier must be 1, 2 or 3, got ${c.tier}`);
  const key = c.label.trim().toLowerCase();
  if (seenLabels.has(key)) errors.push(`label "${c.label}" is used by both ${seenLabels.get(key)} and ${c.id}`);
  seenLabels.set(key, c.id);
  checkWindow(c);
  checkSpans(`${c.id} basis`, c.basis);
}
const abraham = charactersSource.characters.find((c) => c.id === ABRAHAM);
for (const c of charactersSource.characters.filter((c) => c.shown === false)) {
  if (!abraham || c.born.hi === null || abraham.born.lo === null || !(c.born.hi < abraham.born.lo)) {
    errors.push(`${c.id}: an early-Genesis (shown: false) window must end before Abraham's earliest year, got ${JSON.stringify(c.born)}`);
  }
}

const href = (id: string) => `/people/${slugs.get(id) ?? id}`;
let pool: Character[] = charactersSource.characters.map((c) => ({
  id: c.id, label: c.label, tag: c.tag, tier: c.tier, lo: c.born.lo, hi: c.born.hi, shown: c.shown !== false,
  when: c.when, brief: people.get(c.id)?.b ?? "", href: href(c.id),
}));
const byId = () => new Map(pool.map((c) => [c.id, c]));
const label = (id: string) => byId().get(id)?.label ?? people.get(id)?.n ?? id;
/** A label without its bracketed qualifier, for sentences: "Manasseh (son of Joseph)" -> "Manasseh". */
const shortName = (id: string) => label(id).replace(/\s*\(.*\)$/, "");

// Hand facts, then parent and grandparent facts derived from the family links (§4.4).
const handFacts: Fact[] = [];
for (const f of factsSource.facts) {
  const where = `fact ${f.first} > ${f.second}`;
  if (!byId().has(f.first) || !byId().has(f.second)) { errors.push(`${where}: both people must be in the pool`); continue; }
  if (!FACT_KINDS.includes(f.kind)) errors.push(`${where}: kind must be one of ${FACT_KINDS.join(", ")}, got ${f.kind}`);
  if (!f.why?.trim()) errors.push(`${where}: why is empty`);
  if (checkSpans(where, f.refs)) handFacts.push({ first: f.first, second: f.second, kind: f.kind, refs: f.refs, why: f.why });
}
const handKeys = new Set(handFacts.map((f) => pairKey(f.first, f.second)));
const derivedFacts: Fact[] = [];
const relation = (id: string, generation: 1 | 2) => {
  const female = loadPersonFile(id)?.s === "F";
  return generation === 1 ? (female ? "mother" : "father") : female ? "grandmother" : "grandfather";
};
function addDerived(elder: string, child: string, generation: 1 | 2) {
  if (!byId().has(elder) || elder === child || handKeys.has(pairKey(elder, child))) return;
  if (derivedFacts.some((f) => pairKey(f.first, f.second) === pairKey(elder, child))) return;
  derivedFacts.push({ first: elder, second: child, kind: generation === 1 ? "parent" : "grandparent", refs: [], derived: true,
    why: `${shortName(elder)} was ${shortName(child)}'s ${relation(elder, generation)}.` });
}
for (const child of pool) {
  for (const parent of loadPersonFile(child.id)?.pa ?? []) {
    addDerived(parent, child.id, 1);
    for (const grandparent of loadPersonFile(parent)?.pa ?? []) addDerived(grandparent, child.id, 2);
  }
}
const facts: Fact[] = [...handFacts, ...derivedFacts];

// Check 4: every fact agrees with the windows. Check 4a: no contradictions or loops.
for (const f of facts) {
  const a = byId().get(f.first)!;
  const b = byId().get(f.second)!;
  if (a.lo !== null && b.hi !== null && a.lo > b.hi) {
    errors.push(`${f.derived ? "derived " : ""}${f.kind} fact ${a.label} before ${b.label} contradicts the windows: ${a.label}'s earliest birth (${a.lo}) is after ${b.label}'s latest (${b.hi})`);
  }
}
errors.push(...factContradictions(facts, label));

const blocked: [string, string][] = [];
for (const b of blockedSource.blocked) {
  for (const id of [b.a, b.b]) if (!people.has(id)) errors.push(`blocked pair ${b.a} / ${b.b}: ${id} is not in data/study/people.json`);
  if (!b.reason?.trim()) errors.push(`blocked pair ${b.a} / ${b.b}: reason is empty`);
  blocked.push([b.a, b.b]);
}

// Check 6: the people-pages' reign dates, turned into birth bounds.
const bounds = new Map<string, PageBounds>();
for (const c of charactersSource.characters) {
  if (c.pageSkip) continue;
  const firstKing = pages.prophetKings.get(c.id);
  const found = pageBounds(pages.rulers.get(c.id), firstKing ? pages.rulers.get(firstKing) : undefined, c.pageAge);
  if (!found) { if (c.pageAge) notices.push(`${c.label}: pageAge is set but the people-page gives no dated reign`); continue; }
  bounds.set(c.id, found);
  if (!windowCovers({ lo: c.born.lo, hi: c.born.hi }, found)) {
    errors.push(`${c.label}: window ${c.born.lo}..${c.born.hi} is narrower than the people-page allows (${found.how}): it must reach ${found.lo}..${found.hi}`);
  }
}

// Check 8: enough partners per person (else dropped) and enough pairs per band.
let index = buildIndex(facts, blocked);
let pairs = allPairs(pool, index);
for (;;) {
  const partners = new Map<string, number>();
  for (const p of pairs) for (const id of [p.first.id, p.second.id]) partners.set(id, (partners.get(id) ?? 0) + 1);
  const short = pool.filter((c) => (partners.get(c.id) ?? 0) < MIN_PARTNERS);
  if (!short.length) break;
  for (const c of short) notices.push(`${c.label}: only ${partners.get(c.id) ?? 0} certain partners (at least ${MIN_PARTNERS} needed), left out`);
  const dropped = new Set(short.map((c) => c.id));
  pool = pool.filter((c) => !dropped.has(c.id));
  pairs = allPairs(pool, index);
}
const finalFacts = facts.filter((f) => byId().has(f.first) && byId().has(f.second));
index = buildIndex(finalFacts, blocked);
const perBand = Object.fromEntries(BANDS.map((band) => [band, pairs.filter((p) => p.band === band).length])) as Record<Band, number>;
for (const band of BANDS) if (perBand[band] < MIN_PER_BAND) errors.push(`only ${perBand[band]} ${band} pairs (at least ${MIN_PER_BAND} needed)`);
for (const p of pairs) if (labelsClash(p.first.label, p.second.label)) errors.push(`labels could be misread: ${p.first.label} / ${p.second.label}`);

// Check 5: the site's periods. Check 7: Theographic. Warnings, listed at the top of the review sheet.
const row = (id: string) => people.get(id) as PersonRow;
for (const p of pairs) {
  if (p.reason.kind !== "windows") continue;
  const [a, b] = [PERIOD_ORDER.indexOf(row(p.first.id).p), PERIOD_ORDER.indexOf(row(p.second.id).p)];
  if (a >= 0 && b >= 0 && a > b) {
    warnings.push({ id: `period:${p.first.id}>${p.second.id}`, needsNote: true,
      text: `The windows put ${p.first.label} before ${p.second.label}, but people.json files ${p.first.label} under "${row(p.first.id).p}", after ${p.second.label}'s "${row(p.second.id).p}".` });
  }
}
const theographic = loadTheographicBirths();
const theoYear = new Map<string, number>();
if (!theographic) notices.push("Theographic's held copy was not found; its cross-check was skipped");
else {
  for (const c of pool) {
    const year = theographic.get(row(c.id).n);
    if (year === undefined) continue;
    theoYear.set(c.id, year);
    if ((c.lo !== null && year < c.lo) || (c.hi !== null && year > c.hi)) {
      warnings.push({ id: `theographic-year:${c.id}`, needsNote: false, text: `Theographic gives ${c.label} a birth year of ${year}, outside the window ${c.lo}..${c.hi}.` });
    }
  }
  for (const p of pairs) {
    const [a, b] = [theoYear.get(p.first.id), theoYear.get(p.second.id)];
    if (a !== undefined && b !== undefined && a > b) {
      warnings.push({ id: `theographic-order:${p.first.id}>${p.second.id}`, needsNote: true, text: `Theographic has ${p.second.label} (${b}) born before ${p.first.label} (${a}), against a certain pair.` });
    }
  }
}

if (errors.length) {
  console.error(`who's older: ${errors.length} problem(s); nothing was written.\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

// The quotes: the first span of each hand fact, in the BSB.
const outFacts: OutFact[] = finalFacts.map((f) => {
  if (f.derived) return f;
  const [start, end] = f.refs[0];
  if (end - start >= QUOTE_MAX_VERSES || Math.floor(start / 1000) !== Math.floor(end / 1000)) {
    errors.push(`fact ${f.first} > ${f.second}: the first span ${start}-${end} is quoted, so it must be at most ${QUOTE_MAX_VERSES} verses in one chapter`);
  }
  const quote = Array.from({ length: end - start + 1 }, (_, n) => bsb.verse(start + n)).filter(Boolean).join(" ");
  return { ...f, quote };
});
if (errors.length) { console.error(`who's older:\n- ${errors.join("\n- ")}`); process.exit(1); }

const usedBooks = [...new Set(outFacts.flatMap((f) => f.refs.flatMap(([s]) => [Math.floor(s / 1_000_000)])))].sort((a, b) => a - b);
const sources = crypto.createHash("sha256").update(sourceText.join("\u0000")).digest("hex").slice(0, 12);
const body = {
  about: "Generated by scripts/build-whos-older.ts from src/data/whos-older/*.source.json and the site's people data; do not edit.",
  sources,
  books: Object.fromEntries(usedBooks.map((num) => [num, [books.get(num)!.code, books.get(num)!.name]])),
  characters: pool,
  facts: outFacts,
  blocked,
};
const stamp = crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex").slice(0, 12);
const { about, ...rest } = body;
const file = { about, stamp, ...rest };
const lines = (items: unknown[]) => items.map((item) => `  ${JSON.stringify(item)}`).join(",\n");
const text = `{\n${Object.entries(file).map(([key, value]) => (Array.isArray(value)
  ? `"${key}": [\n${lines(value)}\n]` : `"${key}": ${JSON.stringify(value)}`)).join(",\n")}\n}\n`;
fs.writeFileSync(OUT, text);

fs.writeFileSync(SHEET, reviewSheet({
  characters: charactersSource.characters, pool, facts: finalFacts, blocked: blockedSource.blocked, perBand,
  pairCount: pairs.length, warnings, resolutions, notices, bounds, theoYear, periods: new Map(pool.map((c) => [c.id, row(c.id).p])),
}));

const unresolved = warnings.filter((w) => w.needsNote && !resolutions[w.id]).length;
console.log(`who's older: ${pool.length} people, ${handFacts.length} hand facts + ${derivedFacts.length} from family links, ` +
  `${pairs.length} pairs (easy ${perBand.easy}, medium ${perBand.medium}, hard ${perBand.hard}); stamp ${stamp}.`);
console.log(`  ${warnings.length} warning(s), ${unresolved} needing a note; ${notices.length} notice(s). Review sheet: ${path.relative(SITE, SHEET)}`);
for (const notice of notices) console.log(`  notice: ${notice}`);
