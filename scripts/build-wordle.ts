// Bible Wordle's data (docs/features/bible-wordle/design.md §4–§6), run by hand when the curation changes:
//   node --experimental-strip-types scripts/build-wordle.ts [--epoch YYYY-MM-DD] [--freeze-days N]
// Reads src/data/wordle/curation.json, the existing daily.json, the BSB, WEB, KJV and ASV, the cross-references,
// the people files and the ENABLE word list, and writes answers.json, daily.json and guesses.json beside the curation,
// all three together and only after every check has passed. Days up to N (default 14) days after today stay exactly
// as they are in the existing daily.json, so a build put live within that time never changes a puzzle anyone played.
//
// ENABLE (public domain): downloaded once from ENABLE_URL on 2026-11-07 into <sources>/enable/enable1.txt, where
// <sources> is found as scripts/bible/paths.py finds it (BIBLE_SOURCES, else sources/ in the site, else ../sources).
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { REPEAT_DAYS, easterDate, extendPlan, fillPlan, makePlan, poolOf, problemOn, scheduleProblems, setDay,
  type Category, type PoolWord, type Tier, type WordleSchedule } from "../src/pages/games/wordle/daily-rules.ts";
import { verseHasWord, wordPattern } from "../src/pages/games/wordle/verse-match.ts";

const ENABLE_URL = "https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt";
const ENABLE_SHA256 = "3f16130220645692ed49c7134e24a18504c2ca55b3c012f7290e3e77c63b1a89";
const SITE = path.resolve(import.meta.dirname, "..");
const DATA = path.join(SITE, "src/data/wordle");
const YEARS_AHEAD_DAYS = 3 * 366;
const FROZEN_AHEAD = 14;
const MIN_ACTIVE = 400;
const MIN_BSB_USES = 3;
const MIN_PERSON_MENTIONS = 10;
const SHORT_VERSE_WORDS = 30;
const CATEGORIES: readonly Category[] = ["person", "place", "creature", "object", "idea", "action"];

interface CuratedAnswer { word: string; category: Category; tier: Tier; verse?: number; person?: string; retired?: boolean; note?: string }
interface Curation { answers: CuratedAnswer[]; blocked: string[]; usSpellings: string[]; pins: Record<string, string>; easter?: string }
interface Verse { id: number; text: string; words: number }
interface AnswerEntry { c: Category; t: Tier; v: number; p?: string; pid?: string; r?: 1 }

const problems: string[] = [];
const fail = (message: string): never => { console.error(`bible wordle: ${message}`); process.exit(1); };
const readJson = <T>(file: string): T => JSON.parse(fs.readFileSync(file, "utf8")) as T;
const argument = (name: string): string | undefined => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

/** Calendar days of a Y-M-D date, counted on the calendar (no clock or daylight-saving involved). */
function dayNumber(date: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return fail(`expected a date as YYYY-MM-DD, got ${JSON.stringify(date)}`);
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86_400_000;
}
const dateKey = (day: number) => new Date(day * 86_400_000).toISOString().slice(0, 10);
function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function sourcesDir(): string {
  if (process.env.BIBLE_SOURCES) return path.resolve(process.env.BIBLE_SOURCES);
  const inside = path.join(SITE, "sources");
  return fs.existsSync(inside) && fs.statSync(inside).isDirectory() ? inside : path.join(SITE, "..", "sources");
}

/** ENABLE's five-letter words, after checking the download is the one recorded above. */
function readEnable(): string[] {
  const file = path.join(sourcesDir(), "enable", "enable1.txt");
  if (!fs.existsSync(file)) fail(`the ENABLE word list is missing at ${file}; download it from ${ENABLE_URL}`);
  const bytes = fs.readFileSync(file);
  const sha = createHash("sha256").update(bytes).digest("hex");
  if (sha !== ENABLE_SHA256) fail(`${file} has SHA-256 ${sha}, expected ${ENABLE_SHA256}; restore the recorded download`);
  return bytes.toString("utf8").split(/\r?\n/).filter((line) => /^[a-z]{5}$/.test(line));
}

/** Every verse of one Bible folder under data/plain, with its id (book number, chapter, verse). */
function readBible(slug: string, bookNumbers: ReadonlyMap<string, number>): Verse[] {
  const folder = path.join(SITE, "data/plain", slug);
  const verses: Verse[] = [];
  for (const file of fs.readdirSync(folder).filter((name) => name.endsWith(".json")).sort()) {
    const book = bookNumbers.get(file.slice(0, -5)) ?? 0;
    for (const [reference, text] of Object.entries(readJson<Record<string, string>>(path.join(folder, file)))) {
      const [chapter, verse] = reference.split(":").map(Number);
      verses.push({ id: book * 1_000_000 + chapter * 1000 + verse, text, words: text.split(/\s+/).filter(Boolean).length });
    }
  }
  return verses;
}

const fiveLetterWords = (verses: readonly Verse[]): Set<string> =>
  new Set(verses.flatMap((verse) => (verse.text.match(/[A-Za-z]+/g) ?? []).filter((w) => w.length === 5).map((w) => w.toLowerCase())));

/** Cross-reference votes per verse id: how well known a verse is. */
function readVotes(bookNumbers: ReadonlyMap<string, number>): Map<number, number> {
  const votes = new Map<number, number>();
  const root = path.join(SITE, "data/xref");
  for (const book of fs.readdirSync(root)) {
    const number = bookNumbers.get(book);
    if (!number) continue;
    for (const file of fs.readdirSync(path.join(root, book))) {
      const chapter = readJson<Record<string, [number, number, number][]>>(path.join(root, book, file));
      for (const [reference, rows] of Object.entries(chapter)) {
        const [c, v] = reference.split(":").map(Number);
        votes.set(number * 1_000_000 + c * 1000 + v, rows.reduce((sum, row) => sum + row[2], 0));
      }
    }
  }
  return votes;
}

/** The automatic verse (§5): among verses of 30 words or fewer with the word, the best known; else the shortest. */
function pickVerse(word: string, bsb: readonly Verse[], votes: ReadonlyMap<number, number>): number | null {
  const hits = bsb.filter((verse) => verseHasWord(verse.text, word));
  if (!hits.length) return null;
  const short = hits.filter((verse) => verse.words <= SHORT_VERSE_WORDS);
  const score = (verse: Verse) => (short.length ? votes.get(verse.id) ?? 0 : -verse.words);
  return (short.length ? short : hits).reduce((best, verse) => (score(verse) > score(best) ? verse : best)).id;
}

const bsbUses = (word: string, bsb: readonly Verse[]): number =>
  bsb.reduce((sum, verse) => sum + (verse.text.match(wordPattern(word)) ?? []).length, 0);

interface Inputs {
  curation: Curation; bsb: Verse[]; bsbById: Map<number, Verse>; bsbLower: Set<string>; votes: Map<number, number>;
  people: Map<string, { c: number }>; slugs: Record<string, string>;
}

/** One answer's §4.1 rules and its generated entry (problems are collected, so one run lists them all). */
function answerEntry(answer: CuratedAnswer, inputs: Inputs): AnswerEntry | null {
  const { word, category, tier } = answer;
  const say = (problem: string) => { problems.push(`${word}: ${problem}`); return null; };
  if (!/^[a-z]{5}$/.test(word)) return say("an answer must be exactly five letters a-z, in lower case");
  if (!CATEGORIES.includes(category)) return say(`unknown category ${JSON.stringify(category)}`);
  if (![1, 2, 3].includes(tier)) return say(`tier must be 1, 2 or 3, not ${JSON.stringify(tier)}`);
  if (inputs.curation.usSpellings.includes(word)) return say("is an American-only spelling (usSpellings): it may be guessed but never be an answer");
  if (inputs.curation.blocked.includes(word)) return say("is on the blocked list");
  const uses = bsbUses(word, inputs.bsb);
  if (uses < MIN_BSB_USES) return say(`appears ${uses} times in the BSB; an answer needs at least ${MIN_BSB_USES}`);
  if (word.endsWith("s") && !word.endsWith("ss") && inputs.bsbLower.has(word.slice(0, -1))) return say(`looks like the plural of ${word.slice(0, -1)}`);
  if (word.endsWith("ed") && (inputs.bsbLower.has(word.slice(0, -2)) || inputs.bsbLower.has(word.slice(0, -1)))) return say("looks like a past tense");
  const named = category === "person" || category === "place";
  if (named && answer.verse === undefined) return say(`a ${category} needs a verse chosen by hand`);
  const verse = answer.verse ?? pickVerse(word, inputs.bsb, inputs.votes);
  if (verse === null) return say("is in no BSB verse");
  const text = inputs.bsbById.get(verse)?.text;
  if (text === undefined) return say(`verse ${verse} is not in the BSB`);
  if (!verseHasWord(text, word)) return say(`verse ${verse} does not contain the word: ${text}`);
  const entry: AnswerEntry = { c: category, t: tier, v: verse };
  if (answer.person !== undefined) {
    const pid = inputs.slugs[answer.person] ?? answer.person;
    const person = inputs.people.get(pid);
    if (!person) return say(`person ${JSON.stringify(answer.person)} is neither a people slug nor a person id`);
    if (category === "person" && person.c < MIN_PERSON_MENTIONS) return say(`${pid} is mentioned ${person.c} times; a person needs ${MIN_PERSON_MENTIONS}`);
    const slug = Object.entries(inputs.slugs).find(([, id]) => id === pid)?.[0];
    Object.assign(entry, { p: slug ?? pid, pid });
  } else if (category === "person") return say("a person needs a `person` (a people slug or a person id)");
  if (answer.retired) entry.r = 1;
  return entry;
}

function buildAnswers(inputs: Inputs): Record<string, AnswerEntry> {
  const answers: Record<string, AnswerEntry> = {};
  for (const answer of inputs.curation.answers) {
    if (answers[answer.word]) { problems.push(`${answer.word}: listed twice`); continue; }
    const entry = answerEntry(answer, inputs);
    if (entry) answers[answer.word] = entry;
  }
  const active = Object.values(answers).filter((entry) => !entry.r).length;
  if (active < MIN_ACTIVE) problems.push(`only ${active} answers are not retired; the ${REPEAT_DAYS}-day no-repeat rule needs at least ${MIN_ACTIVE}`);
  return answers;
}

/** The allowed guesses (§4.2): ENABLE, every five-letter word of the four Bibles and every answer, minus blocked. */
function buildGuesses(enable: readonly string[], bibles: readonly Set<string>[], answers: readonly string[], blocked: readonly string[]): string[] {
  const all = new Set<string>([...enable, ...bibles.flatMap((words) => [...words]), ...answers]);
  for (const word of blocked) all.delete(word);
  return [...all].filter((word) => /^[a-z]{5}$/.test(word)).sort();
}

function readExisting(file: string): WordleSchedule | null {
  if (!fs.existsSync(file)) return null;
  try {
    const value = readJson<WordleSchedule>(file);
    if (typeof value.epoch !== "string" || !Array.isArray(value.days)) throw new Error("no epoch or days");
    return value;
  } catch (error) {
    return fail(`${file} exists but could not be read (${String(error)}); fix or restore it rather than lose its past puzzles`);
  }
}

/** All pins inside the schedule as day index → word: the curation's dates plus each Easter Sunday for `easter`. */
function pinsWithin(curation: Curation, epochDay: number, length: number): Map<number, string> {
  const pins = new Map<number, string>();
  const firstYear = new Date(epochDay * 86_400_000).getUTCFullYear();
  const easters = curation.easter ? Array.from({ length: Math.ceil(length / 365) + 2 }, (_, i) => [easterDate(firstYear + i), curation.easter!]) : [];
  for (const [date, word] of [...Object.entries(curation.pins), ...easters]) {
    const index = dayNumber(date) - epochDay;
    if (index < 0 || index >= length) continue;
    if (pins.has(index) && pins.get(index) !== word) problems.push(`pins: ${date} is pinned to both ${pins.get(index)} and ${word}`);
    pins.set(index, word);
  }
  return pins;
}

interface ScheduleInput { existing: WordleSchedule | null; epoch: string; freezeDays: number; answers: Record<string, AnswerEntry> }

/** The schedule (§6): frozen days kept (extended first with the browser's fallback), pins placed, the rest filled. */
function buildSchedule({ existing, epoch, freezeDays, answers }: ScheduleInput): WordleSchedule {
  const all = Object.entries(answers).map(([word, entry]) => ({ word, category: entry.c, tier: entry.t }));
  const byWord = new Map<string, PoolWord>(all.map((word) => [word.word, word]));
  const pool = poolOf(all.filter((word) => !answers[word.word].r));
  const epochDay = dayNumber(epoch);
  const today = dayNumber(localToday()) - epochDay + 1;
  const frozenThrough = Math.max(0, today + freezeDays);
  const plan = makePlan(existing?.days ?? []);
  existing?.days.forEach((word, index) => { if (index < frozenThrough && !answers[word]) fail(`puzzle #${index + 1} is frozen and uses ${word}: mark it retired instead of deleting it`); });
  if (existing && existing.days.length < frozenThrough) extendPlan(pool, plan, frozenThrough, existing.days.length, byWord);
  plan.days.length = Math.min(plan.days.length, frozenThrough);
  for (const word of [...plan.uses.keys()]) plan.uses.set(word, plan.uses.get(word)!.filter((at) => at < frozenThrough));
  const kept = plan.days.length; // the days copied unchanged: none on the first build
  const total = Math.max(frozenThrough, today) + YEARS_AHEAD_DAYS;
  const pins = pinsWithin(curationOf(), epochDay, total);
  const fixed = new Set<number>();
  for (const [index, word] of pins) {
    if (index < kept) continue; // a frozen day never changes, pin or not
    if (!answers[word] || answers[word].r) { problems.push(`pins: puzzle #${index + 1} (${dateKey(epochDay + index)}) names ${word}, which is not an active answer`); continue; }
    setDay(plan, index, word);
    fixed.add(index);
  }
  for (const index of fixed) {
    const problem = problemOn(plan, index, byWord.get(plan.days[index]!)!, byWord);
    if (problem) problems.push(`pins: ${dateKey(epochDay + index)} cannot keep the rules: ${problem}`);
  }
  if (problems.length) return fail(`stopped:\n  ${problems.join("\n  ")}`);
  const stuck = fillPlan(pool, plan, kept, total, fixed, byWord);
  if (stuck !== null) fail(`no word fits puzzle #${stuck + 1} (${dateKey(epochDay + stuck)}) under the rules (no repeat within ${REPEAT_DAYS} days, people and places spaced out, one tier-3 word a week); add answers or loosen a rule in daily-rules.ts and note it in the design`);
  const days = plan.days as string[];
  const broken = scheduleProblems(days, byWord, kept);
  if (broken.length) fail(`the schedule breaks its own rules:\n  ${broken.slice(0, 20).join("\n  ")}`);
  return { epoch, builtOn: localToday(), frozenThrough, days };
}

let curationCache: Curation | null = null;
const curationOf = (): Curation => (curationCache ??= readJson<Curation>(path.join(DATA, "curation.json")));

function writeAll(answers: Record<string, AnswerEntry>, schedule: WordleSchedule, guesses: string[]): void {
  const answerLines = Object.keys(answers).sort().map((word) => `${JSON.stringify(word)}:${JSON.stringify(answers[word])}`);
  const dayLines: string[] = [];
  for (let i = 0; i < schedule.days.length; i += 10) dayLines.push(schedule.days.slice(i, i + 10).map((d) => JSON.stringify(d)).join(","));
  const files: [string, string][] = [
    ["answers.json", `{\n${answerLines.join(",\n")}\n}\n`],
    ["daily.json", `{"epoch":${JSON.stringify(schedule.epoch)},"builtOn":${JSON.stringify(schedule.builtOn)},"frozenThrough":${schedule.frozenThrough},"days":[\n${dayLines.join(",\n")}\n]}\n`],
    ["guesses.json", `${JSON.stringify({ source: "ENABLE word list (public domain) plus every five-letter word of the BSB, WEB, KJV and ASV and every answer, minus the curation's blocked words; built by scripts/build-wordle.ts", words: guesses.join("") })}\n`],
  ];
  for (const [name, text] of files) fs.writeFileSync(path.join(DATA, `${name}.tmp`), text, "utf8");
  for (const [name] of files) fs.renameSync(path.join(DATA, `${name}.tmp`), path.join(DATA, name));
}

function main(): void {
  const freezeDays = Number(argument("freeze-days") ?? FROZEN_AHEAD);
  if (!Number.isInteger(freezeDays) || freezeDays < 2) fail(`--freeze-days must be a whole number of at least 2 (every time zone needs that), got ${argument("freeze-days")}`);
  const existing = readExisting(path.join(DATA, "daily.json"));
  const epochFlag = argument("epoch");
  if (existing && epochFlag && epochFlag !== existing.epoch) fail(`daily.json already starts on ${existing.epoch}; changing it to ${epochFlag} would renumber every puzzle and move every pin. Before launch, delete daily.json and build again; after launch, never.`);
  const epoch = existing?.epoch ?? epochFlag ?? localToday();
  dayNumber(epoch);
  const catalog = readJson<{ books: { code: string; num: number }[] }>(path.join(SITE, "data/catalog.json"));
  const bookNumbers = new Map(catalog.books.map((book) => [book.code, book.num]));
  const bsb = readBible("bsb", bookNumbers);
  const bsbLower = new Set(bsb.flatMap((verse) => (verse.text.match(/\b[a-z]{5}\b/g) ?? [])));
  const people = new Map(readJson<{ id: string; c?: number }[]>(path.join(SITE, "data/study/people.json")).map((p) => [p.id, { c: p.c ?? 0 }]));
  const slugs = readJson<{ slugs: Record<string, string> }>(path.join(SITE, "src/data/people-slugs.json")).slugs;
  const inputs: Inputs = { curation: curationOf(), bsb, bsbById: new Map(bsb.map((v) => [v.id, v])), bsbLower, votes: readVotes(bookNumbers), people, slugs };
  const answers = buildAnswers(inputs);
  const guesses = buildGuesses(readEnable(), ["bsb", "web", "kjv", "asv"].map((slug) => fiveLetterWords(slug === "bsb" ? bsb : readBible(slug, bookNumbers))), Object.keys(answers), inputs.curation.blocked);
  for (const word of Object.keys(answers)) if (!guesses.includes(word)) problems.push(`${word}: not in the guess list`);
  const schedule = buildSchedule({ existing, epoch, freezeDays, answers });
  writeAll(answers, schedule, guesses);
  const active = Object.values(answers).filter((entry) => !entry.r).length;
  console.log(`bible wordle: ${Object.keys(answers).length} answers (${active} active), ${guesses.length} allowed guesses, ${schedule.days.length} puzzles from ${epoch} (frozen through #${schedule.frozenThrough})`);
}

main();
