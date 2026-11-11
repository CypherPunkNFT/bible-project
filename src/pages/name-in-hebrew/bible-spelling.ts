// What the page shows for a name: whether the Bible has it (a person's name from the baby-name data, or a Bible word
// such as Grace or a name of God), and the spellings for each of the three cards, each marked with where it comes from.
// Pure functions over the data, so the rules can be tested without a page. The wording is in the page (ScriptCard.tsx).
// Design: docs/features/name-in-hebrew/design.md, "Review".
import { nameSlug, type NameDocument, type NameOriginal, type NameRow, type NamesIndex } from "@/data/baby-names";
import aramaicNames from "./aramaic-names.json";
import bibleWords from "./bible-words.json";
import hebrewBehind from "./hebrew-behind.json";
import { aramaicBySound, aramaicFromHebrew, aramaicScripts, firstForm, greekBySound, hebrewBySound, withFinalForms, withoutCantillation } from "./transliterate";
import type { Sound } from "./sounds";

export interface AramaicName { name: string; square: string; syriac: string; ref: string; hebrew?: string; hebrewStrongs?: string }
export interface BibleWord {
  keys: string[];
  kind: "god" | "word";
  ref: string;
  hebrew: { strongs: string; word: string } | null;
  greek: { strongs: string; word: string } | null;
}

const ARAMAIC_NAMES = aramaicNames.names as Record<string, AramaicName>;
const HEBREW_BEHIND = hebrewBehind as Record<string, { word: string; name: string }>;
const WORDS = bibleWords as BibleWord[];

/** What one typed name (or one word of it) is in the Bible. `alias`: it was found under another spelling. */
export type Found =
  | { type: "name"; typed: string; row: NameRow; alias: boolean }
  | { type: "word"; typed: string; word: BibleWord }
  | { type: "none"; typed: string };

function findOne(index: NamesIndex, typed: string, rows: ReadonlyMap<string, NameRow>): Found {
  const slug = nameSlug(typed);
  const row = rows.get(slug);
  if (row) return { type: "name", typed, row, alias: false };
  const alias = index.aliases[slug];
  const target = alias && rows.get(alias[0]);
  if (target) return { type: "name", typed, row: target, alias: true };
  const word = WORDS.find((entry) => entry.keys.includes(slug));
  return word ? { type: "word", typed, word } : { type: "none", typed };
}

/** The whole name first ("Mary Magdalene"); if the Bible does not have it, each word of it on its own ("John Mark"). */
export function findInBible(index: NamesIndex, display: string): Found[] {
  const rows = new Map(index.names.map((row) => [row.s, row]));
  const whole = findOne(index, display, rows);
  const words = display.split(/[\s-]+/).filter(Boolean);
  if (whole.type !== "none" || words.length < 2) return [whole];
  return words.map((word) => findOne(index, word, rows));
}

// ---- The cards ----------------------------------------------------------------------------------------------------

/**
 * Where a spelling comes from. bible: as Scripture writes this name. also: Scripture's spelling for another person of
 * this name. behind: the Hebrew name a New Testament name comes from (James: Jacob). aramaic-name: an Aramaic name
 * Scripture itself gives (Cephas). letters: a Hebrew spelling written in Aramaic letters. word: a Bible word (Grace).
 * sound: spelled by sound from English.
 */
export type SpellingKind = "bible" | "also" | "behind" | "aramaic-name" | "letters" | "word" | "sound";

export interface Spelling {
  kind: SpellingKind;
  /** Hebrew, Greek, or (on the Aramaic card) the square letters. */
  text: string;
  /** The Aramaic card only: the same spelling in Syriac letters. */
  syriac?: string;
  /** The English name it is known by (behind: "Jacob"; aramaic-name: "Cephas"). */
  name?: string;
  /** A verse that gives it, "JHN 1:42". */
  ref?: string;
  /** The Strong's number it is from. */
  strongs?: string;
  /** For a name of two or more words found word by word ("John Mark"): the word this spelling is for. */
  part?: string;
}

export interface Cards { hebrew: Spelling[]; greek: Spelling[]; aramaic: Spelling[] }

const aramaicSpelling = (kind: SpellingKind, hebrew: string, extra: Partial<Spelling> = {}): Spelling => {
  const { square, syriac } = aramaicFromHebrew(hebrew);
  return { kind, text: withFinalForms(square), syriac, ...extra };
};

const bare = (original: NameOriginal) => (original.script === "he" ? aramaicFromHebrew(original.word).square : firstForm(original.word).normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("el"));

/** A second original worth showing: a different person's name (people do not overlap) spelled with other letters. */
function alsoOriginal(originals: readonly NameOriginal[]): NameOriginal | undefined {
  const [main, ...rest] = originals;
  return rest.find((other) => other.people.every((person) => !main.people.includes(person)) && bare(other) !== bare(main) && other.script === main.script);
}

/** The spellings Scripture gives for a Bible name, from its name file. */
export function bibleCards(document: Pick<NameDocument, "originals">): Cards {
  const cards: Cards = { hebrew: [], greek: [], aramaic: [] };
  const main = document.originals?.[0];
  if (!main?.word) return cards;
  const hand = ARAMAIC_NAMES[main.strongs];
  let hebrew: string | undefined;
  if (main.script === "he") {
    hebrew = withoutCantillation(main.word);
    cards.hebrew.push({ kind: "bible", text: hebrew, strongs: main.strongs });
    const greek = main.greek?.[0];
    if (greek?.word) cards.greek.push({ kind: "bible", text: firstForm(greek.word), strongs: greek.strongs });
  } else {
    cards.greek.push({ kind: "bible", text: firstForm(main.word), strongs: main.strongs });
    const code = hand?.hebrewStrongs ?? (main.meaning?.chain ?? []).find((step) => step.startsWith("H"));
    const behind = hand?.hebrew ? { word: hand.hebrew, name: hand.name } : code ? HEBREW_BEHIND[code] : undefined;
    if (behind && code) {
      hebrew = behind.word;
      cards.hebrew.push({ kind: "behind", text: behind.word, name: behind.name, strongs: code, ref: hand?.hebrew ? hand.ref : undefined });
    }
  }
  if (hand) cards.aramaic.push({ kind: "aramaic-name", text: hand.square, syriac: hand.syriac, name: hand.name, ref: hand.ref });
  else if (hebrew) cards.aramaic.push(aramaicSpelling("letters", hebrew));
  const also = alsoOriginal(document.originals);
  if (also?.script === "he") cards.hebrew.push({ kind: "also", text: withoutCantillation(also.word), strongs: also.strongs });
  if (also?.script === "grc") cards.greek.push({ kind: "also", text: firstForm(also.word), strongs: also.strongs });
  return cards;
}

/** A Bible word's spellings (Grace: חֵן, χάρις). */
export function wordCards(word: BibleWord): Cards {
  const cards: Cards = { hebrew: [], greek: [], aramaic: [] };
  if (word.hebrew) {
    cards.hebrew.push({ kind: "word", text: word.hebrew.word, strongs: word.hebrew.strongs, ref: word.ref });
    cards.aramaic.push(aramaicSpelling("letters", word.hebrew.word));
  }
  if (word.greek) cards.greek.push({ kind: "word", text: word.greek.word, strongs: word.greek.strongs, ref: word.ref });
  return cards;
}

/** The three spellings by sound. */
export function soundCards(sounds: readonly Sound[][]): Cards {
  if (!sounds.length) return { hebrew: [], greek: [], aramaic: [] };
  const aramaic = aramaicScripts(aramaicBySound(sounds));
  return {
    hebrew: [{ kind: "sound", text: hebrewBySound(sounds) }],
    greek: [{ kind: "sound", text: greekBySound(sounds) }],
    aramaic: [{ kind: "sound", text: aramaic.square, syriac: aramaic.syriac }],
  };
}

export const joinCards = (...all: Cards[]): Cards => ({
  hebrew: all.flatMap((cards) => cards.hebrew),
  greek: all.flatMap((cards) => cards.greek),
  aramaic: all.flatMap((cards) => cards.aramaic),
});

/**
 * Whether to spell it by sound as well. Not for a name of God or Christ (God, LORD, Christ), nor for Jesus typed as
 * the Bible spells it in English: Scripture's own spelling is the answer there. Jesús, the Spanish name, is spelled.
 */
export function wantsSound(found: readonly Found[], typedWords: readonly string[]): boolean {
  if (found.some((entry) => entry.type === "word" && entry.word.kind === "god")) return false;
  const jesus = found.length === 1 && found[0].type === "name" && found[0].row.s === "jesus";
  return !(jesus && typedWords.join(" ") === "jesus");
}
