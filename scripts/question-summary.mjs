// The question bank's figures for pages that cannot load the whole bank (16 MB): the Study page's Questions & Answers
// card (pages/mockup/QuizDoor.tsx). Reads data/questions/bank.json and writes src/data/question-summary.json.
// Run after the bank is rebuilt: node scripts/question-summary.mjs. A unit test (src/data/question-summary.test.ts)
// fails when the two disagree.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = join(dirname(fileURLToPath(import.meta.url)), "..");
const BANK = join(SITE, "data/questions/bank.json");
const OUT = join(SITE, "src/data/question-summary.json");

// Years of the collections whose titles name none (as on the questions page, mockup/questions/Hero.tsx).
const YEARS = { "Heidelberg Catechism": 1563, "Westminster Larger Catechism": 1647, "Westminster Shorter Catechism": 1647 };

export function summarise(bank) {
  const { questions, collections } = bank;
  const count = (test) => questions.filter(test).length;
  const distinct = (pick) => new Set(questions.flatMap((q) => pick(q) ?? [])).size;
  const dated = collections.flatMap((c) => {
    const year = YEARS[c.title] ?? Number(c.title.match(/\b1[5-9]\d\d\b/)?.[0]);
    return year ? [{ year, title: c.title.replace(/\s*\(\d{4}\)$/, "") }] : [];
  });
  return {
    questions: questions.length,
    collections: collections.length,
    linked: count((q) => q.link),
    books: distinct((q) => q.books),
    people: distinct((q) => q.people),
    places: distinct((q) => q.places),
    children: count((q) => q.children === true),
    reworded: count((q) => Boolean(q.child)),
    kinds: Object.fromEntries(Object.keys(bank.kinds).map((k) => [k, count((q) => q.kind === k)])),
    levels: Object.fromEntries(["easy", "medium", "hard"].map((l) => [l, count((q) => q.level === l)])),
    traditions: [...new Set(collections.map((c) => c.tradition).filter(Boolean))],
    oldest: dated.reduce((a, b) => (b.year < a.year ? b : a)),
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const summary = summarise(JSON.parse(readFileSync(BANK, "utf8")));
  writeFileSync(OUT, JSON.stringify(summary, null, 1) + "\n", "utf8");
  console.log(`${summary.questions} questions summarised into src/data/question-summary.json`);
}
