import type { Translation } from "./types";

/** Language names for the catalogue's codes, shared by the Library's versions list and the Versions page. */
const LANGUAGE: Record<string, string> = { en: "English", enm: "Middle English", he: "Hebrew", grc: "Greek", la: "Latin" };
/** English first, then the original languages, then Latin and Middle English. */
const LANGUAGE_ORDER = ["en", "he", "grc", "la", "enm"];

export const languageName = (code: string): string => LANGUAGE[code] ?? code;

/** The languages present, in display order. */
export function languagesOf(translations: Translation[]): string[] {
  return [...new Set(translations.map((t) => t.lang))].sort(
    (a, b) => (LANGUAGE_ORDER.indexOf(a) + 1 || 99) - (LANGUAGE_ORDER.indexOf(b) + 1 || 99),
  );
}
