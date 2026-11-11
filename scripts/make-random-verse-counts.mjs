// Writes src/pages/random-verse/verse-counts.ts: how many verses each chapter of the Berean Standard Bible has, read
// from the site's own plain-text files (data/plain/bsb/<BOOK>.json, keys "chapter:verse"). The random verse page picks
// a verse with it before downloading any text, so every verse is equally likely. Run from Website/ after the BSB files
// change: node scripts/make-random-verse-counts.mjs (random-verse/pick.test.ts fails until it is run again).
import { readFileSync, writeFileSync } from "node:fs";

const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8"));
const bsb = catalog.translations.find((translation) => translation.slug === "bsb");
if (!bsb) throw new Error("data/catalog.json has no bsb translation");

const lines = [];
let total = 0;
for (const book of catalog.books) {
  const labels = bsb.books[book.code];
  if (!labels) continue;
  const plain = JSON.parse(readFileSync(`data/plain/bsb/${book.code}.json`, "utf8"));
  const counts = labels.map(() => 0);
  for (const key of Object.keys(plain)) {
    const index = labels.indexOf(key.split(":")[0]);
    if (index < 0) throw new Error(`data/plain/bsb/${book.code}.json: verse ${key} is in no chapter of the catalogue`);
    counts[index] += 1;
  }
  total += counts.reduce((sum, n) => sum + n, 0);
  lines.push(`  "${book.code}": [${counts.join(", ")}],`);
}

writeFileSync("src/pages/random-verse/verse-counts.ts", `// Made by scripts/make-random-verse-counts.mjs from data/plain/bsb: each book's verses per chapter, in chapter order.
// ${total} verses. Do not edit by hand.
export const VERSE_COUNTS: Readonly<Record<string, readonly number[]>> = {
${lines.join("\n")}
};

export const TOTAL_VERSES = ${total};
`);
console.log(`random verse counts: ${lines.length} books, ${total} verses`);
