import type { Translation } from "./types";

/**
 * How versions are grouped everywhere they are listed (owner, 2026-10-03): the English versions by name; the
 * original and ancient languages (Hebrew, Greek, Latin); then translations into other languages, in the owner's
 * order. Shared by the Library's versions list, the Versions page, the reader's version menu and the charts.
 */
const LANGUAGE: Record<string, string> = {
  en: "English",
  enm: "Middle English",
  he: "Hebrew",
  grc: "Greek",
  la: "Latin",
  es: "Spanish",
  ar: "Arabic",
  "zh-Hans": "Chinese",
  fr: "French",
  de: "German",
  hi: "Hindi",
  pt: "Portuguese",
  ru: "Russian",
  ja: "Japanese",
  vi: "Vietnamese",
  fa: "Persian",
  it: "Italian",
};

export interface VersionGroup {
  id: "english" | "original" | "translations";
  title: string;
  langs: string[];
  /** Show each language as a sub-heading (not needed for English). */
  byLanguage: boolean;
}

export const VERSION_GROUPS: VersionGroup[] = [
  { id: "english", title: "English", langs: ["en", "enm"], byLanguage: false },
  { id: "original", title: "Original and ancient languages", langs: ["he", "grc", "la"], byLanguage: true },
  // The owner's first five, then the languages added later by number of speakers.
  { id: "translations", title: "Translations", langs: ["es", "ar", "zh-Hans", "fr", "de", "hi", "pt", "ru", "ja", "vi", "fa", "it"], byLanguage: true },
];

export const languageName = (code: string): string => LANGUAGE[code] ?? code;

/** A language the table does not know yet counts as a translation, so a new version is never hidden. */
export const groupOf = (lang: string): VersionGroup =>
  VERSION_GROUPS.find((g) => g.langs.includes(lang)) ?? VERSION_GROUPS[VERSION_GROUPS.length - 1];

export interface GroupedVersions {
  group: VersionGroup;
  count: number;
  /** One section per language (a single unlabelled section for English). */
  sections: { lang: string | null; label: string | null; versions: Translation[] }[];
}

/** The versions arranged by group, then by language in the group's order, keeping catalogue order within each. */
export function groupVersions(translations: Translation[]): GroupedVersions[] {
  return VERSION_GROUPS.map((group) => {
    const members = translations.filter((t) => groupOf(t.lang).id === group.id);
    const langs = [...group.langs, ...new Set(members.map((t) => t.lang).filter((l) => !group.langs.includes(l)))];
    const sections = group.byLanguage
      ? langs
          .map((lang) => ({ lang, label: languageName(lang), versions: members.filter((t) => t.lang === lang) }))
          .filter((s) => s.versions.length)
      : [{ lang: null, label: null, versions: members }];
    return { group, count: members.length, sections };
  }).filter((g) => g.count > 0);
}
