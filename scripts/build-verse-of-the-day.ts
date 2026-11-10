// The verse of the day for churches (docs/features/verse-widget/design.md 4.6), run by hand when the curation changes
// and at least once a year (a test fails when fewer than 400 scheduled days remain):
//   node --experimental-strip-types scripts/build-verse-of-the-day.ts [--today YYYY-MM-DD]
// Reads src/data/verse-of-the-day/curation.ts, the countdowns, the Berean (data/plain/bsb) and the existing
// schedule.json; checks every rule of design 4.2 and every countdown card's length; then, only if all pass, writes
// schedule.json, one file per date in public/widget/v1/days/ and public/widget/v1/pool.json, and removes the day files
// whose dates have left the schedule. Days up to 14 days after today stay exactly as the existing schedule has them.
//
// The site's own modules import without written endings and through "@/", which Node cannot load as they are, so this
// script bundles src/pages/verse-of-the-day/build-inputs.ts with esbuild in memory (design 4.6, review fix 1).
import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const SITE = path.resolve(import.meta.dirname, "..");
const SCHEDULE_FILE = path.join(SITE, "src/data/verse-of-the-day/schedule.json");
const WIDGET = path.join(SITE, "public/widget/v1");
const DAYS = path.join(WIDGET, "days");
const MIN_POOL = 320;
const MAX_VERSES = 3;
const SENTENCE_START = /^[“‘"A-Z]/;
const OLD_TESTAMENT_BOOKS = 39;

interface CatalogBook { num: number; code: string; name: string }

function todayKey(): string {
  const flag = process.argv.indexOf("--today");
  if (flag >= 0) {
    const value = process.argv[flag + 1] ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`--today expects YYYY-MM-DD, got "${value}"`);
    return value;
  }
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

async function loadInputs() {
  const bundle = await build({
    entryPoints: [path.join(SITE, "src/pages/verse-of-the-day/build-inputs.ts")],
    bundle: true, write: false, platform: "node", format: "esm", tsconfig: path.join(SITE, "tsconfig.app.json"), logLevel: "warning",
  });
  const code = bundle.outputFiles[0].text;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
}

function bereanWords() {
  const catalog = JSON.parse(fs.readFileSync(path.join(SITE, "data/catalog.json"), "utf8")) as { books: CatalogBook[] };
  const books = new Map(catalog.books.map((book) => [book.num, book]));
  const held = new Map<string, Record<string, string>>();
  const file = (code: string) => {
    if (!held.has(code)) held.set(code, JSON.parse(fs.readFileSync(path.join(SITE, "data/plain/bsb", `${code}.json`), "utf8")));
    return held.get(code)!;
  };
  return {
    verse: (id: number): string | null => {
      const book = books.get(Math.floor(id / 1_000_000));
      const text = book ? file(book.code)[`${Math.floor(id / 1000) % 1000}:${id % 1000}`] : undefined;
      return text === undefined ? null : text.replace(/^¶\s*/, "").replace(/\s+/g, " ").trim();
    },
    bookName: (num: number): string => {
      const book = books.get(num);
      if (!book) throw new Error(`verse of the day: no book ${num} in data/catalog.json`);
      return book.name;
    },
  };
}

/** Every rule of design 4.2 that a machine can check, and the countdown cards' limit. Returns the problems found. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the bundle is imported at run time, untyped
function curationProblems(inputs: any, words: ReturnType<typeof bereanWords>): string[] {
  const problems: string[] = [];
  const idsOf = (passage: unknown): number[] => inputs.passageVerseIds(passage);
  const cardVerses = new Set<number>();
  for (const occasion of inputs.OCCASIONS) {
    if (!Array.isArray(occasion.days)) continue;
    for (const day of occasion.days) {
      for (const id of idsOf(day.card)) cardVerses.add(id);
      const text = inputs.assemblePassage(day.card, words.verse);
      if (text.length > inputs.CARD_FULL) problems.push(`countdown card ${occasion.slug}/${day.key} is ${text.length} characters, over ${inputs.CARD_FULL}`);
      inputs.passageKey(day.card);
    }
  }
  const fixedVerses = new Set<number>(inputs.FIXED_DAYS.flatMap((fixed: { passage: unknown }) => idsOf(fixed.passage)));
  const keys = new Set<string>();
  let psalmsAndProverbs = 0;
  let newTestament = 0;
  for (const passage of [...inputs.POOL, ...inputs.FIXED_DAYS.map((fixed: { passage: unknown }) => fixed.passage)]) {
    const key: string = inputs.passageKey(passage);
    const fixed = !inputs.POOL.includes(passage);
    let text = "";
    try { text = inputs.assemblePassage(passage, words.verse); } catch (error) { problems.push(`${key}: ${(error as Error).message}`); continue; }
    const ids = idsOf(passage);
    if (ids.length > MAX_VERSES) problems.push(`${key}: ${ids.length} verses, more than ${MAX_VERSES}`);
    if (text.length > inputs.MAX_ORDINARY) problems.push(`${key}: ${text.length} characters after tidying, over ${inputs.MAX_ORDINARY}`);
    if (!SENTENCE_START.test(text)) problems.push(`${key}: starts mid-sentence ("${text.slice(0, 30)}")`);
    if (ids.some((id) => cardVerses.has(id))) problems.push(`${key}: also a countdown card`);
    if (fixed) continue;
    if (keys.has(key)) problems.push(`${key}: listed twice in the pool`);
    keys.add(key);
    if (ids.some((id) => fixedVerses.has(id))) problems.push(`${key}: also a fixed day's verse`);
    const book = Math.floor(passage.from / 1_000_000);
    if (book === 19 || book === 20) psalmsAndProverbs += 1;
    if (book > OLD_TESTAMENT_BOOKS) newTestament += 1;
  }
  const size = inputs.POOL.length;
  if (size < MIN_POOL) problems.push(`the pool has ${size} entries, fewer than ${MIN_POOL}`);
  if (psalmsAndProverbs * 4 > size) problems.push(`Psalms and Proverbs are ${psalmsAndProverbs} of ${size}, more than a quarter`);
  if (newTestament * 10 < size * 4) problems.push(`the New Testament is ${newTestament} of ${size}, under 40%`);
  return problems;
}

function writeJson(file: string, value: unknown, pretty: boolean): void {
  fs.writeFileSync(file, `${pretty ? JSON.stringify(value, null, 1) : JSON.stringify(value)}\n`, "utf8");
}

async function main(): Promise<void> {
  const builtOn = todayKey();
  const inputs = await loadInputs();
  const words = bereanWords();
  const problems = curationProblems(inputs, words);
  if (problems.length) {
    console.error(`verse of the day: ${problems.length} problem(s); nothing was written.\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
  const previous = fs.existsSync(SCHEDULE_FILE) ? JSON.parse(fs.readFileSync(SCHEDULE_FILE, "utf8")) : null;
  const schedule = inputs.buildSchedule(previous, builtOn);
  const dates = Object.keys(schedule.days);
  const files = dates.map((date) => inputs.dayFileOf(date, schedule.days[date], words));
  const rotation: string[] = inputs.rotationOf(schedule);
  const entries = rotation.map((key) => {
    const file = inputs.dayFileOf("", key, words);
    return { text: file.text, reference: file.reference, read: file.read };
  });
  const longest = files.reduce((best: { text: string }, file: { text: string }) => (file.text.length > best.text.length ? file : best), files[0]);

  fs.mkdirSync(DAYS, { recursive: true });
  writeJson(SCHEDULE_FILE, schedule, true);
  for (const file of files) writeJson(path.join(DAYS, `${file.date}.json`), file, false);
  writeJson(path.join(WIDGET, "pool.json"), { v: 1, lastDate: schedule.lastDate, next: schedule.next, entries, longest }, false);
  const kept = new Set(dates.map((date) => `${date}.json`));
  const stale = fs.readdirSync(DAYS).filter((name) => name.endsWith(".json") && !kept.has(name));
  for (const name of stale) fs.rmSync(path.join(DAYS, name));

  const ordinary = dates.filter((date) => typeof schedule.days[date] === "string").length;
  console.log(`verse of the day: ${files.length} days written, ${dates[0]} to ${dates[dates.length - 1]} (${ordinary} ordinary); `
    + `${stale.length} old day file(s) removed; pool of ${rotation.length}, next position ${schedule.next}; longest day ${longest.date} at ${longest.text.length} characters.`);
}

await main();
