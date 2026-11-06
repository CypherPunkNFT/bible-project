// The languages the site itself can be read in (the header's language menu), as distinct from the 140 languages of its
// Bibles (languages.ts). The definitions live in site-languages.json, so the Python and Node tools read the same list
// as the site (translation system, stage 3: SiteTranslation/system/HANDOFF.md); this module types and checks them.
// `released`: whether the language goes out with a release (scripts/release-translations.ts). An unreleased language is
// shown in the menu only on this computer's preview (language.ts menuLanguages), and its data/i18n folder never leaves
// it. Imports only the JSON and its checker, so the release steps can read it under Node as well as the site.
import data from "./site-languages.json" with { type: "json" };
import { entryProblems, siteLanguageProblems } from "./site-languages-check.ts";

export interface SiteLanguage {
  /** The web standard tag (BCP 47): "pt-BR". */
  code: string;
  /** The translated copy's folder under data/i18n/: "pt". null only for English, the source language. */
  folder: string | null;
  /** The Bible this language quotes (data/plain/<bible>/); null: the source language's Bible. */
  bible: string | null;
  /** The menu's name, in the language itself. */
  name: string;
  englishName: string;
  dir: "ltr" | "rtl";
  /** ISO 15924: "Latn", "Hans", "Arab", "Deva". */
  script: string;
  /** The categories Intl.PluralRules gives this code. */
  plurals: readonly Intl.LDMLPluralRule[];
  /** The Unicode numbering system numbers are shown in: "latn". */
  digits: string;
  /** The font stack index.css gives text marked with this language; null: no rule of its own. */
  font: string | null;
  released: boolean;
  /** A made-up test language; never released. */
  pseudo: boolean;
}

// Used when the file's English entry fails its check or is missing (the tests and the build check refuse such a file
// first), so the menu always offers English, and the site still quotes a Bible and reads left to right.
const FALLBACK_SOURCE: SiteLanguage = Object.freeze({
  code: "en", folder: null, bible: "bsb", name: "English", englishName: "English", dir: "ltr", script: "Latn",
  plurals: Object.freeze(["one", "other"] as const), digits: "latn", font: null, released: true, pseudo: false,
});

// A fault in the file stops every Node step that reads it (the release, the tests, the build check
// scripts/check-site-languages.ts). In the browser it must never blank the site or strand a reader in another language,
// so it is reported, only the entries that pass are kept, and exactly one English entry leads if the file's own failed.
function checkedLanguages(): readonly SiteLanguage[] {
  const problems = siteLanguageProblems(data);
  if (problems.length && typeof window === "undefined") throw new Error(`site-languages.json is not sound:\n  ${problems.join("\n  ")}`);
  if (problems.length) console.error("site-languages.json is not sound; using only the entries that pass:", problems);
  const listed = (data as { languages?: unknown }).languages;
  const entries: unknown[] = Array.isArray(listed) ? listed : [];
  const passing = (problems.length ? entries.filter((entry, index) => !entryProblems(entry, index).length) : entries) as SiteLanguage[];
  const source = passing.find((language) => language.folder === null && language.code === FALLBACK_SOURCE.code);
  const kept = passing.filter((language) => language.folder !== null || language === source);
  if (!source) kept.unshift(FALLBACK_SOURCE);
  return Object.freeze(kept.map((language) => Object.freeze({ ...language, plurals: Object.freeze([...language.plurals]) })));
}

/** Every site language in menu order, released or not. */
export const SITE_LANGUAGES: readonly SiteLanguage[] = checkedLanguages();

/** The translated folders under data/i18n/ that go out with a release. */
export const releasedFolders = (languages: readonly SiteLanguage[] = SITE_LANGUAGES): string[] =>
  languages.filter((language) => language.released && language.folder !== null).map((language) => language.folder!);

/** The source language (English): the one with no translated folder, whose Bible a language with none quotes. */
export const SOURCE_LANGUAGE: SiteLanguage = SITE_LANGUAGES.find((language) => language.folder === null) ?? FALLBACK_SOURCE;

const languageOf = (code: string): SiteLanguage | undefined => SITE_LANGUAGES.find((language) => language.code === code);

/** The Bible a language quotes: its own, or the source language's for one with none (a made-up test language) or a
 * code the site does not have. */
export const siteLanguageBible = (code: string): string => languageOf(code)?.bible ?? SOURCE_LANGUAGE.bible ?? FALLBACK_SOURCE.bible!;

/** The site language that Bible is written in: the language itself, or the source language when it quotes that one. */
export const scriptureLanguage = (code: string): string => (languageOf(code)?.bible ? code : SOURCE_LANGUAGE.code);
