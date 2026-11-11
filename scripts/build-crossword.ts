// Bible crossword's clues (docs/features/bible-crossword/design.md §2 and §8), run by hand when the site's data changes:
//   node --experimental-strip-types scripts/build-crossword.ts [--check]
// Reads the people list and files, the map-quest places with every place's verses, Bible Wordle's words, the question
// bank and the BSB, and writes src/data/crossword/clues.json. No model and no network: the same data always gives
// the same file. An entry that breaks a clue rule is left out and counted; the build fails only when the written file
// would break a rule or a theme has too few clues. --check fails when clues.json differs from what it would write.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { gridLetters } from "../src/lib/puzzles/letters.ts";
import { LEVELS, MAX_CLUE, SIZES, THEMES, clueProblem, isOffered, type ClueEntry, type Kind } from "../src/pages/games/crossword/themes.ts";

const SITE = path.resolve(import.meta.dirname, "..");
const DATA = path.join(SITE, "data");
const OUT = path.join(SITE, "src/data/crossword/clues.json");
const EXCERPT_WORDS = 18;

const readJson = <T>(file: string): T => JSON.parse(fs.readFileSync(file, "utf8")) as T;
const dropped = new Map<string, number>();
const drop = (why: string): null => { dropped.set(why, (dropped.get(why) ?? 0) + 1); return null; };

// ---- Books and the BSB ----
interface Book { num: number; code: string; name: string }
const books = readJson<{ books: Book[] }>(path.join(DATA, "catalog.json")).books.filter((b) => b.num <= 66).sort((a, b) => a.num - b.num);
const bookByNum = new Map(books.map((b) => [b.num, b]));
const bookByCode = new Map(books.map((b) => [b.code, b]));
const bsbBooks = new Map<number, Record<string, string>>();
function verseText(id: number): string | null {
  const num = Math.floor(id / 1_000_000), chapter = Math.floor(id / 1000) % 1000, verse = id % 1000;
  const book = bookByNum.get(num);
  if (!book) return null;
  if (!bsbBooks.has(num)) bsbBooks.set(num, readJson(path.join(DATA, "plain/bsb", `${book.code}.json`)));
  return bsbBooks.get(num)![`${chapter}:${verse}`] ?? null;
}
const reference = (id: number) => `${bookByNum.get(Math.floor(id / 1_000_000))!.name} ${Math.floor(id / 1000) % 1000}:${id % 1000}`;
const bookOf = (id: number) => Math.floor(id / 1_000_000);

// ---- Verse blanks ----
/** A whole-word, any-case match of a (possibly hyphenated) word, with a possessive allowed (as Bible Wordle's). */
const wordPattern = (word: string) =>
  new RegExp(`(?<![A-Za-z’'-])${word.replace(/-/g, "[-‑]")}(?=(?:[’']s)?(?![A-Za-z‑-]|[’'][A-Za-z]))`, "gi");

/** The verse with every use of the word blanked, cut to a window around the first blank. */
function blankedExcerpt(text: string, word: string): string | null {
  const blanked = text.replace(wordPattern(word), "____");
  if (blanked === text) return null;
  const words = blanked.split(/\s+/);
  const first = words.findIndex((w) => w.includes("____"));
  for (let span = EXCERPT_WORDS; span >= 8; span -= 2) {
    const start = Math.max(0, Math.min(first - Math.floor(span / 3), words.length - span));
    const end = Math.min(words.length, start + span);
    const excerpt = `${start > 0 ? "…" : ""}${words.slice(start, end).join(" ")}${end < words.length ? "…" : ""}`;
    if (excerpt.length <= MAX_CLUE - 30) return excerpt;
  }
  return null;
}

const verseClue = (id: number, excerpt: string) =>
  `“${excerpt.replace(/^[“”"‘’]+|[“”"‘’]+$/g, "").replace(/[,;:]$/, "…")}” (${reference(id)})`;

/** Books holding at least a quarter of the busiest book's count (and at least two), else the busiest. */
function mainBooks(counts: Map<number, number>): number[] {
  const top = Math.max(...counts.values());
  const main = [...counts].filter(([, n]) => n >= Math.max(2, top / 4)).map(([b]) => b);
  return (main.length ? main : [[...counts].sort((a, b) => b[1] - a[1])[0][0]]).sort((a, b) => a - b);
}

const NAME = /^[A-Za-z]+(-[A-Za-z]+)?$/;

function entry(kind: Kind, word: string, clue: string, tier: number, bookNums: number[], ref: number | null, person: string | null, topic: string | null): ClueEntry | null {
  const answer = gridLetters(word);
  if (answer.length < 3 || answer.length > 15) return drop(`${kind}: answer not 3–15 letters`);
  const problem = clueProblem(answer, clue);
  if (problem) return drop(`${kind}: ${problem}`);
  if (bookNums.length === 0) return drop(`${kind}: no book`);
  return { a: answer, w: word, c: clue, k: kind, t: Math.min(3, Math.max(1, tier)) as 1 | 2 | 3, b: bookNums, r: ref, p: person, q: topic };
}

// ---- People ----
interface PersonRow { id: string; n: string; b: string; c: number }
function people(): ClueEntry[] {
  const best = new Map<string, PersonRow>();
  for (const row of readJson<PersonRow[]>(path.join(DATA, "study/people.json"))) {
    if (!NAME.test(row.n)) { drop("person: not a one-word name"); continue; }
    if (/(ites|ines|ians)$/i.test(row.n)) { drop("person: a people group"); continue; }
    if (row.c < 4) { drop("person: fewer than 4 mentions"); continue; }
    const key = gridLetters(row.n);
    if ((best.get(key)?.c ?? -1) < row.c) best.set(key, row);
  }
  const out: ClueEntry[] = [];
  for (const row of best.values()) {
    const clue = (row.b ?? "").trim();
    if (clue.split(/\s+/).length < 3) { drop("person: no description"); continue; }
    const file = readJson<{ k?: Record<string, number>; f?: number }>(path.join(DATA, "study/people", `${row.id}.json`));
    const counts = new Map(Object.entries(file.k ?? {}).map(([b, n]) => [Number(b), n] as [number, number]).filter(([b]) => b >= 1 && b <= 66));
    if (counts.size === 0) { drop("person: no book"); continue; }
    const tier = row.c >= 60 ? 1 : row.c >= 15 ? 2 : 3;
    const made = entry("person", row.n, clue, tier, mainBooks(counts), file.f ?? null, row.id, null);
    if (made) out.push(made);
  }
  return out;
}

// ---- Places ----
interface QuestPlace { id: string; name: string; tier: number }
interface Place { id: string; name: string; verses: number[] }
function places(): ClueEntry[] {
  const all = new Map(readJson<Place[]>(path.join(DATA, "places.json")).map((p) => [p.id, p]));
  const quest = readJson<{ places: QuestPlace[] } | QuestPlace[]>(path.join(SITE, "src/data/map-quest/places.json"));
  const out: ClueEntry[] = [];
  for (const place of Array.isArray(quest) ? quest : quest.places) {
    if (!NAME.test(place.name)) { drop("place: not a one-word name"); continue; }
    const verses = all.get(place.id)?.verses ?? [];
    let chosen: { id: number; excerpt: string; words: number } | null = null;
    for (const id of verses) {
      const text = verseText(id);
      if (!text) continue;
      const uses = text.match(wordPattern(place.name))?.length ?? 0;
      const commas = (text.match(/,/g) ?? []).length;
      const words = text.split(/\s+/).length;
      // A list of names ("Remeth, En-gannim, ____, and Beth-pazzez") cannot be solved: few commas, few other names.
      const names = text.split(/\s+/).slice(1).filter((w) => /^[A-Z][a-z]/.test(w) && !/^(God|Lord|LORD)/.test(w)).length;
      if (uses !== 1 || commas > 2 || words < 8 || words > 45 || names > 4) continue;
      const excerpt = blankedExcerpt(text, place.name);
      if (excerpt && (!chosen || words < chosen.words)) chosen = { id, excerpt, words };
    }
    if (!chosen) { drop("place: no verse names it once outside a list"); continue; }
    const counts = new Map<number, number>();
    for (const id of verses) counts.set(bookOf(id), (counts.get(bookOf(id)) ?? 0) + 1);
    const made = entry("place", place.name, verseClue(chosen.id, chosen.excerpt), place.tier, mainBooks(counts), chosen.id, null, null);
    if (made) out.push(made);
  }
  return out;
}

// ---- Words from verses (Bible Wordle's curated words) ----
interface WordleAnswer { c: string; t: number; v: number; pid?: string; r?: 1 }
function verseWords(): ClueEntry[] {
  const out: ClueEntry[] = [];
  for (const [word, answer] of Object.entries(readJson<Record<string, WordleAnswer>>(path.join(SITE, "src/data/wordle/answers.json")))) {
    if (answer.r) { drop("verse: retired word"); continue; }
    const text = verseText(answer.v);
    const excerpt = text && blankedExcerpt(text, word);
    if (!excerpt) { drop("verse: word not in its verse"); continue; }
    const shown = answer.c === "person" || answer.c === "place" ? word[0].toUpperCase() + word.slice(1) : word;
    const made = entry("verse", shown, verseClue(answer.v, excerpt), answer.t, [bookOf(answer.v)], answer.v, answer.pid ?? null, null);
    if (made) out.push(made);
  }
  return out;
}

// ---- Quiz questions ----
interface Question {
  question: string; answer: string; kind: string; tradition: string | null; standalone?: boolean; books: string[];
  topic: string | null; level: string; link: { book: string; chapter: number; verse: number } | null;
}
const NEEDS_OPTIONS = /which of (these|the following)|\bof the following\b|\bnot\b|all of the above|none of|\bthese\b/i;
const NO_ANSWERS = new Set(["YES", "NO", "TRUE", "FALSE", "NONE", "ALL", "BOTH"]);
function quiz(): ClueEntry[] {
  const out: ClueEntry[] = [];
  const seen = new Set<string>();
  for (const q of readJson<{ questions: Question[] }>(path.join(DATA, "questions/bank.json")).questions) {
    if (q.kind !== "trivia" && q.kind !== "lesson") { drop("quiz: catechism"); continue; }
    if (q.tradition && q.tradition !== "Baptist") { drop("quiz: another tradition"); continue; }
    if (q.standalone === false) { drop("quiz: not standalone"); continue; }
    const answer = q.answer.trim().replace(/[.!]$/, "");
    if (!NAME.test(answer)) { drop("quiz: not a one-word answer"); continue; }
    if (NO_ANSWERS.has(answer.toUpperCase())) { drop("quiz: yes/no answer"); continue; }
    if (NEEDS_OPTIONS.test(q.question)) { drop("quiz: needs its options"); continue; }
    const key = `${q.question}|${answer}`.toLowerCase();
    if (seen.has(key)) { drop("quiz: repeated"); continue; }
    seen.add(key);
    const bookNums = q.books.map((code) => bookByCode.get(code)?.num).filter((n): n is number => !!n);
    const link = q.link && bookByCode.get(q.link.book) ? bookByCode.get(q.link.book)!.num * 1_000_000 + q.link.chapter * 1000 + q.link.verse : null;
    const tier = q.level === "easy" ? 1 : q.level === "medium" ? 2 : 3;
    const made = entry("quiz", answer, q.question.trim(), tier, bookNums.length ? bookNums : [0], link, null, q.topic);
    if (made) out.push({ ...made, b: bookNums });
  }
  return out;
}

// ---- Build, check, write ----
function build() {
  const entries = [...people(), ...places(), ...verseWords(), ...quiz()]
    .sort((x, y) => x.k.localeCompare(y.k) || x.a.localeCompare(y.a) || x.c.localeCompare(y.c));
  const problems: string[] = [];
  for (const e of entries) {
    const problem = clueProblem(e.a, e.c);
    if (problem) problems.push(`${e.a}: ${problem}`);
    if (e.k !== "quiz" && e.b.length === 0) problems.push(`${e.a}: belongs to no book`);
  }
  const table: string[] = [];
  for (const theme of THEMES) {
    const offered = LEVELS.flatMap((level) => SIZES.filter((size) => isOffered(entries, { theme: theme.id }, level, size)).map((size) => `${level}/${size}`));
    table.push(`  ${theme.title}: ${offered.join(", ") || "nothing"}`);
    if (!offered.length || (theme.id === "whole" && offered.length < LEVELS.length * SIZES.length)) problems.push(`theme ${theme.id} offers too little`);
  }
  const passages = books.filter((b) => isOffered(entries, { book: b.num }, "hard", "small")).length;
  table.push(`  passages (one book) offered at Hard/Small: ${passages} of 66`);
  const body = { books: books.map((b) => [b.code, b.name]), entries };
  const stamp = createHash("sha256").update(JSON.stringify(body)).digest("hex").slice(0, 16);
  const lines = entries.map((e) => `    ${JSON.stringify(e)}`).join(",\n");
  const text = `{\n  "stamp": "${stamp}",\n  "books": ${JSON.stringify(body.books)},\n  "entries": [\n${lines}\n  ]\n}\n`;
  return { entries, problems, table, text };
}

const { entries, problems, table, text } = build();
const counts = (["person", "place", "verse", "quiz"] as const).map((k) => `${k} ${entries.filter((e) => e.k === k).length}`).join(", ");
console.log(`bible crossword: ${entries.length} clues (${counts})`);
console.log(table.join("\n"));
for (const [why, n] of [...dropped].sort()) console.log(`  left out ${n}: ${why}`);
if (problems.length) {
  console.error(`bible crossword: ${problems.length} problems, nothing written:\n  ${problems.slice(0, 20).join("\n  ")}`);
  process.exit(1);
}
if (process.argv.includes("--check")) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8").replace(/\r\n/g, "\n") : "";
  if (current !== text) { console.error("bible crossword: src/data/crossword/clues.json is stale; run scripts/build-crossword.ts"); process.exit(1); }
  console.log("bible crossword: clues.json is up to date");
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, text);
  console.log(`bible crossword: wrote ${path.relative(SITE, OUT)}`);
}
