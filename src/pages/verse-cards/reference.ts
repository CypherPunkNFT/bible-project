// Reading the start page's reference box ("John 3:16", "ps 23:1-3", "1 Cor 13:4–7", "Jude 3") as a run of verses in one
// chapter of the 66 books. A card holds verses from one chapter, so anything else gets a sentence saying what to type.
// Nothing here guesses: a short name that fits several books asks for more of it.
import type { Catalog } from "@/lib/types";
import { KEY_BOOKS } from "@/data/sympathy/card-keys";
import { BOOK_NUMBERS } from "@/data/life-events/types";
import { isCardRef, type CardRef } from "@/lib/verse-card/links";

export type ReadResult = { ok: true; ref: CardRef } | { ok: false; error: string };

/** Short names people type that are not the start of a single book's name. */
const SHORT_NAMES: Readonly<Record<string, number>> = {
  dt: 5, jdg: 7, ps: 19, pss: 19, psalms: 19, pr: 20, prv: 20, sos: 22, "song of solomon": 22, mt: 40, mk: 41, lk: 42, jn: 43,
  phil: 50, php: 50, phlm: 57, jas: 59, rev: 66, revelations: 66, "1 jn": 62, "2 jn": 63, "3 jn": 64,
};
const ORDINALS: Readonly<Record<string, string>> = { i: "1", ii: "2", iii: "3", first: "1", second: "2", third: "3", "1st": "1", "2nd": "2", "3rd": "3" };

/** "I Cor." -> "1 cor", "1Cor" -> "1 cor". */
export function normalizeName(text: string): string {
  const words = text.toLowerCase().replace(/[.']/g, " ").replace(/(\d)([a-z])/g, "$1 $2").split(/\s+/).filter(Boolean);
  if (words.length > 1 && ORDINALS[words[0]]) words[0] = ORDINALS[words[0]];
  return words.join(" ");
}

/** Every name a book is known by, normalized: the catalogue's name, the card key's word and the reader's code. */
function nameIndex(catalog: Catalog): Map<string, number> {
  const index = new Map<string, number>(Object.entries(SHORT_NAMES));
  catalog.books.filter((book) => book.num <= 66).forEach((book) => {
    for (const name of [book.name, KEY_BOOKS[book.num - 1].replace(/-/g, " "), book.code]) {
      const key = normalizeName(name);
      if (!index.has(key)) index.set(key, book.num);
    }
  });
  return index;
}

function findBook(catalog: Catalog, typed: string): number | string {
  const key = normalizeName(typed);
  const index = nameIndex(catalog);
  const exact = index.get(key);
  if (exact) return exact;
  const starts = new Set([...index].filter(([name]) => key.replace(/^\d /, "").length >= 2 && name.startsWith(key)).map(([, book]) => book));
  if (starts.size === 1) return [...starts][0];
  const names = [...starts].map((book) => catalog.books[book - 1]?.name).filter(Boolean);
  if (names.length > 1) {
    const firstNames = names.slice(0, -1).join(", ");
    const lastName = names[names.length - 1];
    return `That could be ${firstNames} or ${lastName}. Type more of the name.`;
  }
  return `There is no book called "${typed.trim()}" in the 66 books. Try a name such as John or Psalm.`;
}

const chaptersOf = (catalog: Catalog, book: number) => {
  const code = Object.keys(BOOK_NUMBERS).find((name) => BOOK_NUMBERS[name] === book) ?? "";
  return catalog.translations.find((translation) => translation.slug === "bsb")?.books[code]?.length ?? 0;
};

/** The verses a typed reference names, or a sentence saying what to type instead. */
export function readReference(catalog: Catalog, typed: string): ReadResult {
  const input = typed.slice(0, 80).trim();
  if (!input) return { ok: false, error: "Type a verse, such as John 3:16." };
  const match = /^(.*?[a-z.'])\s*(\d{1,3})(?:\s*[:.]\s*(\d{1,3}))?(?:\s*[-–—]\s*(\d{1,3})(?:\s*[:.]\s*(\d{1,3}))?)?$/i.exec(input);
  if (!match) return { ok: false, error: "Start with the book's name, then the chapter and verse, such as John 3:16." };
  const book = findBook(catalog, match[1]);
  if (typeof book === "string") return { ok: false, error: book };
  const name = catalog.books[book - 1].name;
  const chapters = chaptersOf(catalog, book);
  if (match[5]) return { ok: false, error: "A card holds verses from one chapter. Choose verses inside one chapter, such as Psalm 23:1–3." };
  let chapter = Number(match[2]);
  let first = match[3] ? Number(match[3]) : NaN;
  let last = match[4] ? Number(match[4]) : first;
  if (!match[3]) {
    if (chapters !== 1) return { ok: false, error: `Add the verse as well, such as ${name} ${chapter}:1.` };
    [chapter, first, last] = [1, Number(match[2]), match[4] ? Number(match[4]) : Number(match[2])];
  }
  if (chapter > chapters) return { ok: false, error: `${name} has ${chapters} chapters, so there is no chapter ${chapter}.` };
  if (last < first) return { ok: false, error: "The verses run backwards. Put the first verse first, such as Psalm 23:1–3." };
  const ref = { book, chapter, first, last };
  return isCardRef(ref) ? { ok: true, ref } : { ok: false, error: "Choose verses from 1 upwards, such as John 3:16." };
}
