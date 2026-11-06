// What the page translator knows of each language's words: every English text and its translation, learned from the
// phrase lists (data/i18n/<folder>/ui.json, or its smaller per-page parts, phrase-lists.ts) and from content files
// paired string by string (page-translator.ts). Kept apart from the translator so the list loader can teach it too.
import { SITE_LANGUAGES } from "./site-languages";
import { languageFolder, type LanguageCode } from "./language";
import { learnPluralForms, pluralPair, readPluralForms } from "./site-format";

export const toEnglish = new Map<string, string>(); // for text first seen already translated; several English strings can share one translation, so the first stands
export const fromEnglish = new Map<string, Map<string, string>>(); // folder -> English -> translation
const phraseLists = new Map<string, number>(); // folder -> how many times a phrase list (whole or part) has been learned (0: not yet)
// A language's plural forms, written by plural() (site-format.ts) already in that language: never swapped while it is the
// target, and traced back to their English on a change of language (folder -> forms, "{n}" for a count).
export const ownForms = new Map<string, Set<string>>();

export const normal = (text: string) => text.replace(/\s+/g, " ").trim();

export function learn(folder: string, english: string, translated: string): void {
  const [en, tr] = [normal(english), normal(translated)];
  if (!en || en === tr) return;
  if (!toEnglish.has(tr)) toEnglish.set(tr, en);
  if (!fromEnglish.has(folder)) fromEnglish.set(folder, new Map());
  fromEnglish.get(folder)!.set(en, translated.trim());
}

// Lines the page code builds around a value. extract.py writes every ${…} as {n}, so "Open the profile of {n}" holds a
// name as often as a number. Each line is filed under its longest fixed word, so a text is tried only against lines that
// could be it, and a longer line (more fixed letters) wins over a shorter one; on a tie, the one with more fixed text ("Select {n}: {n}. {n}"
// before "Select {n}", which would take "Obed: Judges. Son of Boaz and Ruth" for one name).
export interface Slotted { english: string; pattern: RegExp; letters: number; fixed: number }
export const longerLine = (a: Slotted, b: Slotted) => b.letters - a.letters || b.fixed - a.fixed;
export const slotted = new Map<string, Map<string, Slotted[]>>(); // folder -> fixed word -> lines
export const SLOT = "{n}";
const MOST_SLOTS = 3;
export const WORD = /\p{L}{2,}/gu;
const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function learnSlots(folder: string, english: string, translated: string): void {
  if (!english.includes(SLOT)) return;
  const parts = normal(english).split(SLOT);
  const slots = parts.length - 1;
  const words = parts.join(" ").match(WORD) ?? [];
  if (slots < 1 || slots > MOST_SLOTS || words.join("").length < 4 || translated.split(SLOT).length - 1 !== slots) return;
  const anchor = words.reduce((longest, word) => (word.length > longest.length ? word : longest)).toLowerCase();
  if (!slotted.has(folder)) slotted.set(folder, new Map());
  const byWord = slotted.get(folder)!;
  const line = { english: normal(english), pattern: new RegExp(`^${parts.map(escaped).join("(.+?)")}$`, "u"), letters: words.join("").length, fixed: parts.join("").length };
  byWord.set(anchor, [...(byWord.get(anchor) ?? []).filter((other) => other.english !== line.english), line].sort(longerLine));
}

/** A plural entry of ui.json (plural:["{n} book","{n} books"] -> its forms as JSON): handed to plural(), and each form
 * traced back to the English for the count it is used for, so a change of language can swap it. */
function learnPlural(folder: string, key: string, value: unknown): void {
  const categories = SITE_LANGUAGES.find((language) => language.folder === folder)?.plurals ?? ["other"];
  const forms = readPluralForms(folder, key, value, categories);
  const [one, many] = pluralPair(key)!;
  if (!forms) return;
  learnPluralForms(folder, key, forms);
  if (!ownForms.has(folder)) ownForms.set(folder, new Set());
  const counts: Partial<Record<string, number>> = { zero: 0, one: 1, two: 2 };
  for (const [category, form] of Object.entries(forms)) {
    const text = normal(form!);
    ownForms.get(folder)!.add(text);
    const english = category === "one" ? one : many;
    // A form with no count in it ("كتابان", two books) stands for one number: its English is written with that number.
    const traced = text.includes("{n}") || counts[category] === undefined ? english : english.split("{n}").join(String(counts[category]));
    if (!toEnglish.has(text)) toEnglish.set(text, normal(traced));
  }
}

const listeners = new Set<() => void>();

/** Learns a phrase list, whole (ui.json) or a part of it; returns how many of its texts were new. */
export function learnPhraseList(folder: string, strings: Record<string, unknown>): number {
  const known = fromEnglish.get(folder);
  let added = 0;
  for (const [english, translated] of Object.entries(strings)) {
    if (pluralPair(english)) {
      learnPlural(folder, english, translated);
      continue;
    }
    // One bad entry costs only itself, never the language's whole phrase list.
    if (typeof translated !== "string") {
      console.warn(`page translation: the ${folder} phrase list's entry for "${english}" is not text; it is left out`);
      continue;
    }
    const en = normal(english);
    if (known?.get(en) === translated.trim()) continue; // learned already from another part of the list
    if (en !== normal(translated)) added++;
    learn(folder, english, translated);
    learnSlots(folder, english, translated);
    // Pages also type labels in capitals ("ISAIAH 40:8", "OLD TESTAMENT").
    if (english !== english.toUpperCase()) learn(folder, english.toUpperCase(), translated.toUpperCase());
  }
  phraseLists.set(folder, (phraseLists.get(folder) ?? 0) + 1);
  listeners.forEach((listener) => listener());
  return added;
}

/** The chosen language's own wording for an English text in its phrase list (ui.json), or null: none, or English.
 * For text drawn in a language's own words rather than swapped (the home page's verses, in its Bible's wording); pass
 * the language from useSiteLanguage(), so a change of language draws the new wording. */
export function phrase(english: string, code: LanguageCode): string | null {
  const folder = languageFolder(code);
  return (folder && fromEnglish.get(folder)?.get(normal(english))) ?? null;
}

/** How many times the language's phrase list (or a part of it) has been learned: 0 while none is. Anything built from
 * phrase() (the site search's index in the language) is kept only for the number it was built at. */
export const phraseListVersion = (code: LanguageCode): number => phraseLists.get(languageFolder(code) ?? "") ?? 0;

/** Called whenever more of a phrase list is learned (for useSyncExternalStore). */
export function onPhrasesLearned(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
