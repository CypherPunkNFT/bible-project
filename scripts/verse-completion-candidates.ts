// Verse completion: rank every BSB verse as a candidate for the hand-curated pool (design §4.2). Ranking is by the total
// votes on the verse's own outgoing cross-references, a discovery aid only; the site's card verses (life events,
// sympathy, countdowns) are flagged too. A person reads the sheet and chooses: nothing here writes into src/.
//   node --experimental-strip-types scripts/verse-completion-candidates.ts <sheet.json outside src/>
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cleanVerse, eligibleText, joinVerses, passageId } from "../src/pages/games/verse-completion/passage.ts";

export interface Book { code: string; num: number; name: string }

export const BOOKS: Book[] = (JSON.parse(readFileSync("data/catalog.json", "utf8")).books as Book[]).filter((book) => book.num <= 66);
const BY_NUM = new Map(BOOKS.map((book) => [book.num, book]));
const PLAIN = new Map<number, Record<string, string>>();

/** One book of the BSB from disk, read once. */
export function plainBook(num: number): Record<string, string> {
  const book = BY_NUM.get(num);
  if (!book) throw new Error(`verse completion: no canonical book number ${num} (expected 1–66)`);
  if (!PLAIN.has(num)) PLAIN.set(num, JSON.parse(readFileSync(`data/plain/bsb/${book.code}.json`, "utf8")));
  return PLAIN.get(num)!;
}

export const bookOf = (id: number): Book | undefined => BY_NUM.get(Math.floor(id / 1e6));
const chapterOf = (id: number) => Math.floor(id / 1000) % 1000;

/** The BSB words of verses `from`–`to` (one chapter, at most three verses), as the page joins them. */
export function passageText(from: number, to = from): string {
  if (Math.floor(from / 1000) !== Math.floor(to / 1000) || to < from || to - from > 2) {
    throw new Error(`verse completion: a passage is 1–3 verses in one chapter, got ${from}–${to}`);
  }
  const plain = plainBook(Math.floor(from / 1e6));
  const texts: string[] = [];
  for (let id = from; id <= to; id++) {
    const text = plain[`${chapterOf(id)}:${id % 1000}`];
    if (text === undefined) throw new Error(`verse completion: the BSB has no verse ${id} (${bookOf(id)?.code} ${chapterOf(id)}:${id % 1000})`);
    texts.push(cleanVerse(text));
  }
  return joinVerses(texts);
}

/** The verse before ends a sentence (or there is none in this chapter), so this one can start a passage. */
export function startsSentence(from: number): boolean {
  if (from % 1000 === 1) return true;
  const before = plainBook(Math.floor(from / 1e6))[`${chapterOf(from)}:${from % 1000 - 1}`];
  return before === undefined || /[.!?:][”’"')\]]*\s*$/.test(before);
}

/** Card verses on the site's life-event, sympathy and countdown pages: short, warm, often well known. */
function cardVerses(): Set<number> {
  const found = new Set<number>();
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith(".ts")) {
        for (const match of readFileSync(path, "utf8").matchAll(/"([1-3A-Z]{3}) (\d+):(\d+)(?:-\d+)?", "card"/g)) {
          const book = BOOKS.find((item) => item.code === match[1]);
          if (book) found.add(book.num * 1e6 + Number(match[2]) * 1000 + Number(match[3]));
        }
      }
    }
  };
  ["src/data/life-events", "src/data/sympathy", "src/data/countdowns"].forEach(walk);
  return found;
}

export interface Candidate { id: string; from: number; to: number; votes: number; card: boolean; words: number; text: string }

/** The total votes on a verse's outgoing cross-references (data/xref/<BOOK>/<chapter>.json: [target, end, votes]). */
function votesOf(book: Book, chapter: number, key: string, cache: Map<number, Record<string, number[][]>>): number {
  if (!cache.has(chapter)) {
    try { cache.set(chapter, JSON.parse(readFileSync(`data/xref/${book.code}/${chapter}.json`, "utf8"))); }
    catch { cache.set(chapter, {}); } // a chapter with no cross-references at all has no file
  }
  return (cache.get(chapter)![key] ?? []).reduce((sum, row) => sum + (row[2] ?? 0), 0);
}

/** Every verse that opens a sentence, with the shortest 1–3 verse range from it that makes an eligible passage. */
export function candidates(): Candidate[] {
  const cards = cardVerses();
  const rows: Candidate[] = [];
  for (const book of BOOKS) {
    const plain = plainBook(book.num);
    const xrefs = new Map<number, Record<string, number[][]>>();
    for (const key of Object.keys(plain)) {
      const [chapter, verse] = key.split(":").map(Number);
      if (!Number.isInteger(verse)) continue;
      const from = book.num * 1e6 + chapter * 1000 + verse;
      if (!startsSentence(from)) continue;
      for (let length = 1; length <= 3; length++) {
        let text: string;
        try { text = passageText(from, from + length - 1); } catch { break; } // the chapter ended
        const count = eligibleText(text);
        if (count === null) continue;
        rows.push({ id: passageId(book.code, from, from + length - 1), from, to: from + length - 1,
          votes: votesOf(book, chapter, key, xrefs), card: cards.has(from), words: count, text });
        break;
      }
    }
  }
  return rows.sort((a, b) => b.votes - a.votes || Number(b.card) - Number(a.card) || a.from - b.from);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = process.argv[2];
  if (!output || resolve(output).startsWith(resolve("src"))) throw new Error("verse completion: give a sheet path outside src/, e.g. .local/candidates.json");
  const rows = candidates();
  writeFileSync(output, JSON.stringify(rows, null, 1));
  console.log(`Wrote ${rows.length} ranked candidates to ${output}`);
}
