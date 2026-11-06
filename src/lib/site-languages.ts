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

// A fault in the file stops every Node step that reads it (the release, the tests). In the browser it must never blank
// the site, so it is reported and only the entries that pass are kept; the tests (site-languages.test.ts) refuse it first.
function checkedLanguages(): readonly SiteLanguage[] {
  const problems = siteLanguageProblems(data);
  if (problems.length && typeof window === "undefined") throw new Error(`site-languages.json is not sound:\n  ${problems.join("\n  ")}`);
  if (problems.length) console.error("site-languages.json is not sound; using only the entries that pass:", problems);
  const passing = problems.length ? data.languages.filter((entry, index) => !entryProblems(entry, index).length) : data.languages;
  return Object.freeze((passing as unknown as SiteLanguage[]).map((language) => Object.freeze({ ...language, plurals: Object.freeze([...language.plurals]) })));
}

/** Every site language in menu order, released or not. */
export const SITE_LANGUAGES: readonly SiteLanguage[] = checkedLanguages();

/** The translated folders under data/i18n/ that go out with a release. */
export const releasedFolders = (languages: readonly SiteLanguage[] = SITE_LANGUAGES): string[] =>
  languages.filter((language) => language.released && language.folder !== null).map((language) => language.folder!);
