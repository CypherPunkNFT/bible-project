// Numbers, dates, lists, sorting, country names and plurals in the site's language (translation system, stage 5 job
// 14; SiteTranslation/system/HANDOFF.md). The page translator swaps words already on screen, but it cannot write a
// number or a date for a language, choose one of Arabic's six plural forms, or sort by a language's alphabet. Code that
// shows any of these calls a helper here, never toLocaleString(), Intl.* or localeCompare with a language of its own;
// the build check (content/translation/language_nets.mjs) refuses new hand-written plurals, formats and sorts.
//
// Each helper reads the site's language when it is called. Text drawn before an in-place change of language keeps the
// old language's format until its component draws again (the data pages do: they reload with the language). None of
// them throws for a language: a tag the browser refuses falls back to the plain code, then to English.
/// <reference lib="es2021.intl" />
import { LANGUAGES, languageFolder, siteLanguage } from "./language";
import { SOURCE_LANGUAGE } from "./site-languages";

const usable = (tag: string): boolean => {
  try {
    return Intl.getCanonicalLocales(tag).length === 1;
  } catch {
    return false;
  }
};

/** The site language's tag for Intl, with its numbering system: "ar-u-nu-latn" is Arabic words with 0-9 digits. */
export function siteLocale(code: string = siteLanguage()): string {
  const language = LANGUAGES.find((entry) => entry.code === code) ?? SOURCE_LANGUAGE;
  const tag = `${language.code}-u-nu-${language.digits}`;
  return usable(tag) ? tag : usable(language.code) ? language.code : "en";
}

// One formatter per kind, locale and options: a table of thousands of numbers would otherwise build one per cell.
type Formatter = Intl.NumberFormat | Intl.Collator | Intl.PluralRules | Intl.ListFormat | Intl.DisplayNames;
const formatters = new Map<string, Formatter>();
function cached<T extends Formatter>(kind: string, options: object | undefined, make: (locale: string) => T): T {
  const locale = siteLocale();
  const key = `${kind} ${locale} ${options ? JSON.stringify(options) : ""}`;
  const found = formatters.get(key) as T | undefined;
  if (found) return found;
  const made = make(locale);
  formatters.set(key, made);
  return made;
}

/** A number formatter in the site's language ("1,234" in English, "1.234" in Spanish, "1,234" in Hindi's 12,34,567). */
export const numberFormat = (options?: Intl.NumberFormatOptions): Intl.NumberFormat =>
  cached("number", options, (locale) => new Intl.NumberFormat(locale, options));

/** A number written in the site's language: what value.toLocaleString() wrote in the reader's browser language. */
export const formatNumber = (value: number | bigint, options?: Intl.NumberFormatOptions): string => numberFormat(options).format(value);

const asDate = (value: Date | number | string): Date => (value instanceof Date ? value : new Date(value));

/** A date in the site's language, exactly as Date.toLocaleDateString writes it ("Invalid Date" for a bad one). */
export const formatDate = (value: Date | number | string, options?: Intl.DateTimeFormatOptions): string =>
  asDate(value).toLocaleDateString(siteLocale(), options);

/** A time in the site's language, as Date.toLocaleTimeString writes it. */
export const formatTime = (value: Date | number | string, options?: Intl.DateTimeFormatOptions): string =>
  asDate(value).toLocaleTimeString(siteLocale(), options);

/** A date and time in the site's language, as Date.toLocaleString writes it. */
export const formatDateTime = (value: Date | number | string, options?: Intl.DateTimeFormatOptions): string =>
  asDate(value).toLocaleString(siteLocale(), options);

/** A date formatter in the site's language, for code that formats many dates or ranges with one set of options. */
export const dateFormat = (options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => new Intl.DateTimeFormat(siteLocale(), options);

/** Items joined as the site's language joins a list: "Paul, Silas, and Timothy"; "Pablo, Silas y Timoteo". */
export const formatList = (items: readonly string[], options: Intl.ListFormatOptions = { type: "conjunction" }): string =>
  cached("list", options, (locale) => new Intl.ListFormat(locale, options)).format(items);

/** A collator in the site's language, for sorting text a reader sees. */
export const textCollator = (options?: Intl.CollatorOptions): Intl.Collator =>
  cached("collator", options, (locale) => new Intl.Collator(locale, options));

/** Sorts text a reader sees (names, titles) in the site language's order. */
export const compareText = (a: string, b: string, options?: Intl.CollatorOptions): number => textCollator(options).compare(a, b);

// Ids, dates written as text and other keys a reader never sees as words: one order in every language, so a layout
// built from the order does not move when the language changes.
const CODE_ORDER = new Intl.Collator("en");
/** Sorts ids and keys, and lists whose order lays out a drawing: the same order in every language. */
export const compareCode = (a: string, b: string): number => CODE_ORDER.compare(a, b);

/** A country's name in the site's language from its two-letter region code ("EG": "Egypt", "Egipto", "مصر"); the code
 * itself where the browser has no name for it. */
export function countryName(code: string): string {
  try {
    return cached("region", undefined, (locale) => new Intl.DisplayNames([locale], { type: "region" })).of(code) ?? code;
  } catch {
    return code;
  }
}

// ---- Counts written as words ---------------------------------------------------------------------------------------
const SMALL = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen",
  "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** A count as running English writes it ("two accounts", countWord(47, true) is "Forty-seven"); in every other
 * language, and past 99, the number in the site's format, which the page translator's {n} matches. */
export function countWord(n: number, capital = false): string {
  if (languageFolder() || !Number.isInteger(n) || n < 0 || n > 99) return formatNumber(n);
  const word = n < 20 ? SMALL[n] : TENS[Math.floor(n / 10)] + (n % 10 ? `-${SMALL[n % 10]}` : "");
  return capital ? word[0].toUpperCase() + word.slice(1) : word;
}

const ENGLISH_ORDINALS = new Intl.PluralRules("en", { type: "ordinal" });
const ENGLISH_ENDINGS: Partial<Record<Intl.LDMLPluralRule, string>> = { one: "st", two: "nd", few: "rd" };
/** A place in a sequence: "3rd" in English. Other languages write the number alone, in their format, and their phrase
 * list gives it its place in the words ("{n} century": "siglo {n}"). */
export const ordinal = (n: number): string =>
  formatNumber(n) + (languageFolder() ? "" : ENGLISH_ENDINGS[ENGLISH_ORDINALS.select(n)] ?? "th");

// ---- Plurals -------------------------------------------------------------------------------------------------------
// plural(n, "{n} book", "{n} books") writes English as before, the count in the site's number format. A language whose
// phrase list (ui.json) holds this pair's forms under pluralKey(one, many) shows the form Intl.PluralRules chooses for
// n: Arabic has six (zero, one, two, few, many, other), Chinese one (other). Until the forms are translated (collected
// by extract.py as kind "plural"), the English is shown and the page translator swaps it word for word, as before.
// A fourth argument, "word" (or "first-word", capitalised to begin a sentence), writes the count as countWord does:
// "Called, as two accounts tell it".

export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>>;
const PLURAL_PREFIX = "plural:";
const pluralForms = new Map<string, Map<string, PluralForms>>(); // folder -> key -> forms

/** The phrase-list key of a plural pair: plural:["{n} book","{n} books"] (JSON, no spaces; extract.py writes the same). */
export const pluralKey = (one: string, many: string): string => PLURAL_PREFIX + JSON.stringify([one, many]);
export const isPluralKey = (key: string): boolean => key.startsWith(PLURAL_PREFIX);

/** The English pair a plural key names, or null for a key that is not one. */
export function pluralPair(key: string): [string, string] | null {
  if (!isPluralKey(key)) return null;
  try {
    const pair: unknown = JSON.parse(key.slice(PLURAL_PREFIX.length));
    return Array.isArray(pair) && pair.length === 2 && pair.every((part) => typeof part === "string") ? (pair as [string, string]) : null;
  } catch {
    return null;
  }
}

/** The forms a phrase-list entry holds, checked: a JSON object of texts for the categories `categories`, with "other"
 * always present. null (and a warning) for anything else, so the English is shown. */
export function readPluralForms(folder: string, key: string, value: unknown, categories: readonly string[]): PluralForms | null {
  let forms: unknown = null;
  try {
    forms = typeof value === "string" ? JSON.parse(value) : null;
  } catch {
    forms = null;
  }
  const entries = forms && typeof forms === "object" && !Array.isArray(forms) ? Object.entries(forms) : null;
  if (!pluralPair(key) || !entries || !entries.every(([category, form]) => categories.includes(category) && typeof form === "string")
    || typeof (forms as PluralForms).other !== "string") {
    console.warn(`site-format: the plural entry ${key} in ${folder}'s phrase list is not a JSON object of texts for ${categories.join(", ")} with "other"; the English is shown`);
    return null;
  }
  return forms as PluralForms;
}

/** Records a language's forms for a plural pair (page-translator.ts reads them from ui.json). */
export function learnPluralForms(folder: string, key: string, forms: PluralForms): void {
  if (!pluralForms.has(folder)) pluralForms.set(folder, new Map());
  pluralForms.get(folder)!.set(key, forms);
}

const ENGLISH_RULES = new Intl.PluralRules("en");
export type CountAs = "number" | "word" | "first-word";
const written = (n: number, as: CountAs): string => (as === "number" ? formatNumber(n) : countWord(n, as === "first-word"));
const fill = (form: string, n: number, as: CountAs): string => form.split("{n}").join(written(n, as));

/** The words for a count in the site's language: plural(3, "{n} book", "{n} books") is "3 books" in English. A form
 * need not hold the count: plural(n, "The prophet", "{n} prophets"). */
export function plural(n: number, one: string, many: string, as: CountAs = "number"): string {
  const folder = languageFolder();
  const forms = folder ? pluralForms.get(folder)?.get(pluralKey(one, many)) : undefined;
  const form = forms && (forms[cached("plural", undefined, (locale) => new Intl.PluralRules(locale)).select(n)] ?? forms.other);
  return fill(form ?? (ENGLISH_RULES.select(n) === "one" ? one : many), n, as);
}
