// Reading a Bible reference as a visitor types it ("John 3:16", "jn 3:16-18", "1 Cor 13:4–7, 13", "Ps 23; 91:1-4",
// "Gen 1:1–2:3", "Jude 3") into a book and passages, checked against the chosen version's books and chapters
// (data/catalog.json). Nothing here guesses: a short name that fits several books, a range that runs backwards or a
// chapter the version does not have is an error that says what is wrong. README.md beside this file.
import type { BookInfo, Translation } from "@/lib/types";
import { EXTRA_NAMES, STYLE_ABBREVIATIONS } from "./abbreviations";

/** One passage: a chapter (or verse) and where it ends. A `verse` of null is a whole chapter. */
export interface Passage { chapter: number; verse: number | null; endChapter: number; endVerse: number | null }

export interface Reference { code: string; name: string; passages: Passage[]; singleChapter: boolean }

export type ParseResult = { ok: true; reference: Reference } | { ok: false; error: string };

export const MAX_REFERENCE = 120;


const ORDINALS: Record<string, string> = { i: "1", ii: "2", iii: "3", iv: "4", first: "1", second: "2", third: "3", fourth: "4", "1st": "1", "2nd": "2", "3rd": "3", "4th": "4" };

/** "I Cor." -> "1 cor", "1Cor" -> "1 cor", "Song  of Sol." -> "song of sol". */
export function normalizeName(text: string): string {
  const words = text.toLowerCase().replace(/[.']/g, " ").replace(/(\d)([a-z])/g, "$1 $2").split(/\s+/).filter(Boolean);
  if (words.length > 1 && ORDINALS[words[0]]) words[0] = ORDINALS[words[0]];
  return words.join(" ");
}

/** The names a book is known by, normalized: the catalogue's name, the three styles' abbreviations and the extras. */
export function buildNameIndex(books: readonly BookInfo[]): Map<string, string> {
  const index = new Map<string, string>();
  const add = (name: string, code: string) => { const key = normalizeName(name); if (key && !index.has(key)) index.set(key, code); };
  for (const book of books) if (book.code !== "DAG" && book.code !== "PS2") add(book.name, book.code);
  for (const [code, abbreviation] of STYLE_ABBREVIATIONS) add(abbreviation, code);
  for (const [name, code] of Object.entries(EXTRA_NAMES)) add(name, code);
  return index;
}

/** The book a typed name means: an exact name or abbreviation, else the one book whose name starts with it. */
function findBook(typed: string, books: readonly BookInfo[], index: Map<string, string>): { code: string } | { error: string } {
  const key = normalizeName(typed);
  const exact = index.get(key);
  if (exact) return { code: exact };
  const starts = key.length >= 2 ? books.filter((b) => b.code !== "DAG" && b.code !== "PS2" && normalizeName(b.name).startsWith(key)) : [];
  if (starts.length === 1) return { code: starts[0].code };
  const shown = typed.trim();
  const names = starts.slice(0, 4).map((b) => b.name).join(", ");
  if (starts.length > 1) return { error: `Several books start with “${shown}”: ${names}. Type a little more of the book's name.` };
  return { error: `No book of the Bible is called “${shown}”. Try its full name, such as John or 1 Corinthians.` };
}

/** "13:4-7" -> numbers; a chapter on its own, or a verse when `verseOnly`. */
function readItem(item: string, chapter: number | null, verseOnly: boolean): Passage | string {
  const match = /^(\d{1,3})(?:[:.](\d{1,3}))?(?:-(\d{1,3})(?:[:.](\d{1,3}))?)?$/.exec(item);
  if (!match) return `Write the chapter and verse like 3:16, 3:16-18 or 3:16-4:2, not “${item}”.`;
  const [a, b, c, d] = [match[1], match[2], match[3], match[4]].map((n) => (n === undefined ? null : Number(n)));
  let passage: Passage;
  if (b !== null) passage = d !== null ? { chapter: a!, verse: b, endChapter: c!, endVerse: d } : { chapter: a!, verse: b, endChapter: a!, endVerse: c ?? b };
  else if (verseOnly && chapter !== null) {
    if (d !== null) passage = { chapter, verse: a!, endChapter: c!, endVerse: d };
    else passage = { chapter, verse: a!, endChapter: chapter, endVerse: c ?? a! };
  } else if (d !== null) passage = { chapter: a!, verse: 1, endChapter: c!, endVerse: d }; // "3-4:2": from the chapter's start
  else passage = { chapter: a!, verse: null, endChapter: c ?? a!, endVerse: null };
  if (passage.chapter === 0 || passage.endChapter === 0 || passage.verse === 0 || passage.endVerse === 0) return "Chapters and verses start at 1.";
  const backwards = passage.endChapter < passage.chapter || (passage.endChapter === passage.chapter && (passage.endVerse ?? 0) < (passage.verse ?? 0));
  if (backwards) return `The range “${item}” runs backwards. Put the first verse first.`;
  return passage;
}

/** The passages after the book name: ";" starts a new chapter, "," goes on in the same one. */
export function readPassages(text: string, singleChapter: boolean): Passage[] | string {
  const cleaned = text.replace(/[–—−]/g, "-").replace(/\s+to\s+/gi, "-").replace(/\s*-\s*/g, "-").trim();
  if (!cleaned) return singleChapter ? [{ chapter: 1, verse: null, endChapter: 1, endVerse: null }] : "Add a chapter, such as John 3 or John 3:16.";
  const passages: Passage[] = [];
  for (const group of cleaned.split(/\s*;\s*/)) {
    let chapter: number | null = null;
    let verses = false;
    for (const raw of group.split(/\s*,\s*/)) {
      const item = raw.replace(/\s+/g, "");
      if (!item) return "There is an empty place between two commas or semicolons.";
      // In a one-chapter book every number is a verse: "Jude 3", "Jude 1:3" and "Jude 1-3" all mean verses.
      const read: Passage | string = singleChapter
        ? readItem(/[:.]/.test(item) ? item : `1:${item.replace(/-/, "-1:")}`, 1, false)
        : readItem(item, chapter, verses && !/[:.]/.test(item));
      if (typeof read === "string") return read;
      if (singleChapter && read.endChapter !== 1) return "This book has only one chapter, so give verses, such as Jude 3 or Jude 24-25.";
      passages.push(read);
      chapter = read.endChapter;
      verses = read.verse !== null;
    }
  }
  return passages;
}

/** The highest chapter a version has for a book (its chapter labels are "1", "2", … in the catalogue). */
const lastChapter = (labels: readonly string[]) => labels.reduce((max, label) => Math.max(max, parseInt(label, 10) || 0), 0);

/** A book code the version holds under its other form (Daniel and Greek Daniel, Esther and Greek Esther). */
const inVersion = (code: string, version: Translation, equivalent: Record<string, string>) =>
  version.books[code] ? code : equivalent[code] && version.books[equivalent[code]] ? equivalent[code] : null;

/** Reads `text` as a reference in `version`. */
export function parseReference(text: string, version: Translation, books: readonly BookInfo[], equivalent: Record<string, string>, index = buildNameIndex(books)): ParseResult {
  const input = text.slice(0, MAX_REFERENCE).trim();
  if (!input) return { ok: false, error: "Type a reference, such as John 3:16." };
  const split = /^((?:[1-4]|i{1,3}|iv|first|second|third|fourth|1st|2nd|3rd|4th)?\s*[a-z][a-z.' ]*?)\s*(\d[\d\s:.,;\-–—−]*|\d.*)?$/i.exec(input);
  if (!split) return { ok: false, error: "Start with the book's name, then the chapter and verse, such as John 3:16." };
  const found = findBook(split[1], books, index);
  if ("error" in found) return { ok: false, error: found.error };
  let code = found.code;
  let rest = split[2] ?? "";
  // Psalm 151 is a book of its own in the versions that have it.
  if (code === "PSA" && /^151(?!\d)/.test(rest.trim())) {
    if (!version.books.PS2) return { ok: false, error: `Psalm 151 is not in the ${version.name}. It is in the Greek and some Catholic and Orthodox Bibles.` };
    code = "PS2";
    rest = rest.trim().replace(/^151\s*[:.]?\s*/, "");
  }
  const held = inVersion(code, version, equivalent);
  const name = books.find((b) => b.code === code)?.name ?? code;
  if (!held) return { ok: false, error: `The ${version.name} does not have ${name}.` };
  const last = lastChapter(version.books[held]);
  const singleChapter = last === 1;
  const passages = readPassages(rest, singleChapter);
  if (typeof passages === "string") return { ok: false, error: passages };
  const tooFar = passages.find((p) => p.endChapter > last || p.chapter > last);
  if (tooFar) return { ok: false, error: `${name} has ${last} chapters in the ${version.name}, so there is no chapter ${Math.max(tooFar.chapter, tooFar.endChapter)}.` };
  return { ok: true, reference: { code, name, passages, singleChapter } };
}
