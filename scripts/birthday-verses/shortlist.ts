// Birthday verses, stage A (docs/features/birthday-verses/design.md 4.3): for each of the 366 dates, every date-matched
// (chapter = month, verse = day) and flipped (days 13-31: chapter = day, verse = month) Berean passage that passes the
// mechanical rules of 4.2, with the verse before and after, marking the ones the site's curated lists already use.
// $0, no model. Run: bun scripts/birthday-verses/shortlist.ts [--compact N]
//   .local/birthday-verses/items/<MM-DD>.txt   one file per date (BatchRunner items)
//   .local/birthday-verses/hard/<MM-DD>.txt    the three hard dates only (02-29, 07-31, 08-29)
//   .local/birthday-verses/compact/<MM>.txt    with --compact N: the N best per date, curated first, for reading
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { BOOK_NUMBERS } from "../../src/data/life-events/types";
import { allBirthdayDates, dayOf, EXCLUDED_VERSES, LIMITS, monthOf } from "../../src/data/birthday-verses";

const ROOT = path.resolve(import.meta.dirname, "../..");
const OUT = path.join(ROOT, ".local/birthday-verses");
const HARD_DATES = ["02-29", "07-31", "08-29"];
/** Books whose numbered verses are almost all lists, laws, census or judgment (design 2.3). */
const LEFT_OUT_BOOKS = new Set(["LEV", "NUM", "1CH", "EZR", "NEH", "EST", "OBA", "NAM"]);
const HARD_WORDS = /\b(death|dead|die[sd]?|dying|kill\w*|slain|slay\w*|curse\w*|wrath|sword\w*|burn\w*|blood|destroy\w*|enem(y|ies)|slaughter\w*|wicked|harlot\w*|prostitut\w*|adulter\w*|plague\w*|famine|corpse\w*|vengeance|punish\w*|son of|sons of|daughters of|begot|fathered|captiv\w*|judgment|abomination\w*|whor\w*|disaster|terror|grave|sheol|hell|weep\w*|mourn\w*)\b/i;
const WARM_WORDS = /\b(love\w*|loving|joy\w*|glad\w*|rejoic\w*|peace|bless\w*|grace\w*|gracious|mercy|merciful|faithful\w*|good\w*|kind\w*|hope|light|life|praise\w*|thank\w*|song|sing\w*|delight\w*|salvation|trust\w*|refuge|strength|strong|comfort\w*|keep\w*|guard\w*|shepherd|gift|heart|days|years|wisdom|righteous\w*|rest|help\w*|care\w*)\b/gi;
/** Where the site keeps its hand-picked verses (design 2.4); the games' scene verses are left out. */
const CURATED_DIRS = ["verse-of-the-day", "when-youre", "countdowns", "life-events", "sympathy", "occasion-prayers", "home-blessings", "occasion-verses"];

type Book = Record<string, string>;
interface Candidate { id: number; code: string; chapter: number; first: number; last: number; text: string; kind: "date" | "flipped"; curated: boolean; before?: string; after?: string; score: number }

const books = new Map<string, Book>(Object.keys(BOOK_NUMBERS).map((code) => [code, JSON.parse(readFileSync(path.join(ROOT, "data/plain/bsb", `${code}.json`), "utf8")) as Book]));

function curatedIds(): Set<number> {
  const ids = new Set<number>();
  const reference = /\b([1-3]?[A-Z]{2,3})[ .](\d{1,3})[:.](\d{1,3})\b/g;
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|json)$/.test(name) && !name.includes(".test.") && name !== "birthday-by-date.ts") {
        for (const match of readFileSync(full, "utf8").matchAll(reference)) {
          const book = BOOK_NUMBERS[match[1]];
          if (book) ids.add(book * 1_000_000 + Number(match[2]) * 1000 + Number(match[3]));
        }
      }
    }
  };
  for (const dir of CURATED_DIRS) walk(path.join(ROOT, "src/data", dir));
  return ids;
}

const startsSentence = (text: string) => /^[“‘"'(]?[A-Z]/.test(text);
const endsSentence = (text: string) => /[.!?][”’"')]*$/.test(text);
const passesWords = (text: string) => !/\d/.test(text) && !HARD_WORDS.test(text);

/** The shortest run of 1-3 verses from `first` that ends a sentence and keeps every rule, or null. */
function wholePassage(book: Book, chapter: number, first: number): { last: number; text: string } | null {
  const opening = book[`${chapter}:${first}`];
  if (!opening || !startsSentence(opening)) return null;
  let text = "";
  for (let last = first; last < first + LIMITS.maxVerses; last++) {
    const verse = book[`${chapter}:${last}`];
    if (!verse) return null;
    text = text ? `${text} ${verse}` : verse;
    if (text.length > LIMITS.maxText || !passesWords(text)) return null;
    if (endsSentence(text)) return { last, text };
  }
  return null;
}

function candidatesFor(date: string, curated: Set<number>): Candidate[] {
  const month = monthOf(date);
  const day = dayOf(date);
  const spots: [number, number, "date" | "flipped"][] = [[month, day, "date"]];
  if (day >= 13) spots.push([day, month, "flipped"]);
  const found: Candidate[] = [];
  for (const [code, book] of books) {
    if (LEFT_OUT_BOOKS.has(code)) continue;
    for (const [chapter, verse, kind] of spots) {
      const id = BOOK_NUMBERS[code] * 1_000_000 + chapter * 1000 + verse;
      if (EXCLUDED_VERSES.includes(id)) continue;
      const whole = wholePassage(book, chapter, verse);
      if (!whole) continue;
      const score = (whole.text.match(WARM_WORDS) ?? []).length - (whole.last - verse);
      found.push({ id, code, chapter, first: verse, last: whole.last, text: whole.text, kind, curated: curated.has(id), before: book[`${chapter}:${verse - 1}`], after: book[`${chapter}:${whole.last + 1}`], score });
    }
  }
  return found.sort((a, b) => Number(b.curated) - Number(a.curated) || b.score - a.score || a.id - b.id);
}

const label = (c: Candidate) => `${c.code} ${c.chapter}:${c.first}${c.last > c.first ? `-${c.last}` : ""}`;

function itemText(date: string, list: Candidate[]): string {
  const lines = [`Date: ${date} (month ${monthOf(date)}, day ${dayOf(date)})`, `Candidates: ${list.length}`, ""];
  list.forEach((c, index) => {
    lines.push(`${index + 1}. ${label(c)} [${c.kind}${c.curated ? ", site-chosen" : ""}]`);
    if (c.before) lines.push(`   before: ${c.before}`);
    lines.push(`   TEXT: ${c.text}`);
    if (c.after) lines.push(`   after: ${c.after}`);
  });
  return `${lines.join("\n")}\n`;
}

function compactText(dates: string[], all: Map<string, Candidate[]>, size: number): string {
  return dates.map((date) => [`## ${date}`, ...(all.get(date) ?? []).slice(0, size).map((c) => `${label(c)}${c.kind === "flipped" ? " F" : ""}${c.curated ? " *" : ""} ${c.text}`)].join("\n")).join("\n\n") + "\n";
}

function main() {
  const compactIndex = process.argv.indexOf("--compact");
  const compactSize = compactIndex > 0 ? Number(process.argv[compactIndex + 1]) : 0;
  const curated = curatedIds();
  const all = new Map(allBirthdayDates().map((date) => [date, candidatesFor(date, curated)]));
  for (const folder of ["items", "hard", "compact"]) mkdirSync(path.join(OUT, folder), { recursive: true });
  let total = 0;
  let withCurated = 0;
  const thin: string[] = [];
  for (const [date, list] of all) {
    total += list.length;
    if (list.some((c) => c.curated)) withCurated++;
    if (list.length < 3) thin.push(`${date} (${list.length})`);
    writeFileSync(path.join(OUT, "items", `${date}.txt`), itemText(date, list));
    if (HARD_DATES.includes(date)) writeFileSync(path.join(OUT, "hard", `${date}.txt`), itemText(date, list));
  }
  if (compactSize > 0) {
    for (let month = 1; month <= 12; month++) writeFileSync(path.join(OUT, "compact", `${String(month).padStart(2, "0")}.txt`), compactText([...all.keys()].filter((date) => monthOf(date) === month), all, compactSize));
  }
  const counts = [...all.values()].map((list) => list.length).sort((a, b) => a - b);
  console.log(`birthday shortlist: ${total} candidates for ${all.size} dates; fewest ${counts[0]}, median ${counts[Math.floor(counts.length / 2)]}; ${withCurated} dates have a site-chosen candidate`);
  if (thin.length) console.log(`dates with fewer than 3 candidates (choose freely there): ${thin.join(", ")}`);
}

main();
