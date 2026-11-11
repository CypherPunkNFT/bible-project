// The puzzle maker's words from a passage (docs/features/puzzle-maker/design.md §2.1 and §10): the passage's verses
// from the Berean Standard Bible's plain text, its key words ranked by how often they occur, and for a crossword each
// word's clue, a verse it is in with the word blanked. Pure, so the tests run it on the real Bible files.
import { BLOCKED, gridLetters } from "@/lib/puzzles";
import type { PlainBook } from "@/lib/types";
import { clueProblem, MAX_CLUE } from "@/pages/games/crossword/themes";

/** One passage as the citation generator's parser reads it: a `verse` of null is a whole chapter. */
export interface PassageRange { chapter: number; verse: number | null; endChapter: number; endVerse: number | null }

export interface PassageVerse { chapter: number; verse: number; text: string }

/** One word of the passage, merged by its grid letters ("God" and "God’s" are one). */
export interface PassageWord {
  /** Grid letters, A–Z. */
  grid: string;
  /** The form seen most often in the passage, as written. */
  written: string;
  count: number;
  /** The verses it is in, as places in the passage's verse list, in order. */
  verses: number[];
}

/** The most verses one puzzle is made from. */
export const MAX_VERSES = 250;
export const MIN_LETTERS = 3;

/** Words never hidden or asked: the common words of English and the Berean's most frequent small verbs. */
const STOP = new Set(`
a about above after again against all also am an and another any are aside as at away back be became because become
been before behind being below beside besides between both but by came can cannot come comes coming could did do does
doing done down during each either else even ever every few for from further gave get gets give given gives go goes
going gone got had has have having he her here hers herself him himself his how however i if in into is it its itself
just keep kept know known knew let lets like made make makes many may me might mine more most much must my myself near
neither never no nor not now of off often on once one only onto or other others ought our ours ourselves out over own
put said same saw say saying says see seen shall she should since so some such take taken than that the their theirs
them themselves then there therefore these they this those though through thus till to toward towards too took two
three four five six seven eight nine ten under until up upon us very was we went were what whatever when whenever where
whereas wherever whether which while who whoever whole whom whose why will with within without would ye yet you your
yours yourself yourselves unto thee thou thy thine hath doth indeed among around across along according thing things
tell told truly surely yes
`.trim().split(/\s+/));

/** Words a sheet for a children's class should not hide or ask, though the verse text is never changed (design §10). */
const SENSITIVE = new Set(["PROSTITUTE", "PROSTITUTES", "PROSTITUTION", "PROSTITUTED", "HARLOT", "HARLOTS", "WHORE", "WHORES",
  "WHOREDOM", "NAKED", "NAKEDNESS", "BREAST", "BREASTS", "GENITALS", "RAPE", "RAPED", "SEXUAL", "SEXUALLY", "DUNG",
  "EXCREMENT", "URINE", "FORESKIN", "FORESKINS", "TESTICLES", "MENSTRUAL", "INTERCOURSE", "LUSTFUL", "SEDUCE", "SEDUCED",
  "ADULTERESS", "HOMOSEXUALS", "EUNUCH", "EUNUCHS", "CONCUBINE", "CONCUBINES", "MOLEST", ...BLOCKED]);

/** A word as the Bible writes it: letters, with an apostrophe or hyphen only between letters (Beth-shemesh, God’s). */
const WORD = /[A-Za-z\u00c0-\u024f]+(?:['\u2019-][A-Za-z\u00c0-\u024f]+)*/g;
const POSSESSIVE = /['’]s$/i;

const verseKey = (chapter: number, verse: number) => chapter * 1000 + verse;

/** The passage's verses from its book's plain text, in Bible order, each once however the passages overlap. Only verses
 *  the file has count, so "John 3:99" gives none. */
export function selectVerses(plain: PlainBook, passages: readonly PassageRange[]): PassageVerse[] {
  const chosen: PassageVerse[] = [];
  for (const [key, text] of Object.entries(plain)) {
    const match = /^(\d+):(\d+)$/.exec(key);
    if (!match || typeof text !== "string") continue;
    const at = verseKey(Number(match[1]), Number(match[2]));
    const inside = passages.some((p) => at >= verseKey(p.chapter, p.verse ?? 0) && at <= verseKey(p.endChapter, p.endVerse ?? 999));
    if (inside) chosen.push({ chapter: Number(match[1]), verse: Number(match[2]), text });
  }
  return chosen.sort((a, b) => verseKey(a.chapter, a.verse) - verseKey(b.chapter, b.verse));
}

/** The word a token stands for: its grid letters without a possessive, or null when it is never a puzzle word. */
function puzzleWord(token: string, maxLength: number): { grid: string; written: string } | null {
  const written = token.replace(POSSESSIVE, "");
  if (STOP.has(written.toLowerCase())) return null;
  const grid = gridLetters(written);
  if (grid.length < MIN_LETTERS || grid.length > maxLength || SENSITIVE.has(grid)) return null;
  return { grid, written };
}

/** The passage's words, at most `maxLength` letters, ranked: most often first, then longer, then first seen. */
export function passageWords(verses: readonly PassageVerse[], maxLength: number): PassageWord[] {
  const found = new Map<string, { forms: Map<string, number>; count: number; verses: number[]; first: number }>();
  let position = 0;
  verses.forEach((verse, index) => {
    for (const token of verse.text.match(WORD) ?? []) {
      position++;
      const word = puzzleWord(token, maxLength);
      if (!word) continue;
      let entry = found.get(word.grid);
      if (!entry) found.set(word.grid, entry = { forms: new Map(), count: 0, verses: [], first: position });
      entry.count++;
      entry.forms.set(word.written, (entry.forms.get(word.written) ?? 0) + 1);
      if (entry.verses[entry.verses.length - 1] !== index) entry.verses.push(index);
    }
  });
  return [...found].map(([grid, entry]) => {
    // The form seen most; on a tie the one seen first (a Map keeps the order forms were first met).
    let written = "", best = 0;
    for (const [form, times] of entry.forms) if (times > best) { written = form; best = times; }
    return { grid, written, count: entry.count, verses: entry.verses, first: entry.first };
  }).sort((a, b) => b.count - a.count || b.grid.length - a.grid.length || a.first - b.first)
    .map(({ grid, written, count, verses: inVerses }) => ({ grid, written, count, verses: inVerses }));
}

/** Words to hide in a word search: the first `count` of a ranked list, leaving out any inside another chosen word
 *  (HERD inside SHEPHERD would be found twice). */
export function searchWords(words: readonly PassageWord[], count: number): PassageWord[] {
  const chosen: PassageWord[] = [];
  for (const word of words) {
    if (chosen.length >= count) break;
    if (chosen.some((other) => other.grid.includes(word.grid) || word.grid.includes(other.grid))) continue;
    chosen.push(word);
  }
  return chosen;
}

/** The words of a verse about `windowWords` long around its first blank, with "…" where it was cut. */
function around(text: string, windowWords: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= windowWords) return words.join(" ");
  const blank = Math.max(0, words.findIndex((word) => word.includes("____")));
  const start = Math.max(0, Math.min(blank - Math.floor(windowWords / 2), words.length - windowWords));
  const end = start + windowWords;
  return `${start > 0 ? "…" : ""}${words.slice(start, end).join(" ")}${end < words.length ? "…" : ""}`;
}

/** The verse with every use of the word blanked, short enough for a clue with its reference after it, or null when the
 *  finished clue would still give the answer away (design §10: the reference is checked too, so RUTH in Ruth 1 has none). */
export function verseClue(verse: PassageVerse, grid: string, reference: string | null): string | null {
  const blanked = verse.text.replace(WORD, (token) => {
    const possessive = POSSESSIVE.exec(token)?.[0] ?? "";
    return gridLetters(token.slice(0, token.length - possessive.length)) === grid ? `____${possessive}` : token;
  });
  if (blanked === verse.text) return null;
  const tail = reference ? ` (${reference})` : "";
  for (let windowWords = 18; windowWords >= 8; windowWords -= 2) {
    const clue = `${around(blanked, windowWords)}${tail}`;
    if (clue.length <= MAX_CLUE) return clueProblem(grid, clue) ? null : clue;
  }
  return null;
}
