// Counts the words in every chapter of the Berean Standard Bible for the reading planner (docs/features/reading-planner,
// design 2) and writes src/data/reading-planner/chapter-words.json: { "<BOOK>": [words in chapter 1, 2, ...] } in the
// catalogue's book order. Run with `node scripts/build-reading-planner-words.mjs`; with `--check` it writes nothing and
// fails if the file differs from a fresh count (the planner's data test runs that, so a changed Bible text is caught).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { countChapterWords } from "./reading-planner-word-count.mjs";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(readFileSync(resolve(site, "data/catalog.json"), "utf8"));
const out = {};
// The 66 books of the Berean Standard Bible (catalogue numbers 1 to 66); the apocrypha the catalogue also lists is not in it.
for (const book of catalog.books.filter((b) => b.num <= 66).sort((a, b) => a.num - b.num)) {
  const verses = JSON.parse(readFileSync(resolve(site, `data/plain/bsb/${book.code}.json`), "utf8"));
  out[book.code] = countChapterWords(verses);
}
const target = resolve(site, "src/data/reading-planner/chapter-words.json");
const text = JSON.stringify(out) + "\n";
if (process.argv.includes("--check")) {
  if (readFileSync(target, "utf8") !== text) {
    console.error(`reading planner: ${target} differs from a fresh count of data/plain/bsb; run node scripts/build-reading-planner-words.mjs`);
    process.exit(1);
  }
  console.log("reading planner: chapter-words.json matches the Berean text");
  process.exit(0);
}
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, text);
const chapters = Object.values(out).reduce((sum, list) => sum + list.length, 0);
const words = Object.values(out).flat().reduce((sum, n) => sum + n, 0);
console.log(`reading planner: ${Object.keys(out).length} books, ${chapters} chapters, ${words} words -> ${target}`);
