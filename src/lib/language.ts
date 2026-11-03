// The reader's chosen language (the header's language button). English is the site as written; a translated
// language reads its content files from data/i18n/<folder>/ (content/translation/apply.py), and page-translator.ts
// swaps the words already on screen, so a change of language never reloads the page. Published 2026-11-02.
import { useSyncExternalStore } from "react";

export const LANGUAGES = [
  { code: "en", name: "English", folder: null, dir: "ltr" },
  { code: "es", name: "Español", folder: "es", dir: "ltr" },
  { code: "pt-BR", name: "Português (Brasil)", folder: "pt", dir: "ltr" },
  { code: "zh-Hans", name: "中文", folder: "zh", dir: "ltr" },
  { code: "ar", name: "العربية", folder: "ar", dir: "rtl" },
  { code: "hi", name: "हिन्दी", folder: "hi", dir: "ltr" },
] as const;
export type LanguageCode = (typeof LANGUAGES)[number]["code"];

const STORAGE_KEY = "bp-language";

// The data folders apply.py translates; every other file (Bible texts, the catalogue) has no translated copy. The live
// site reads people from packs (scripts/release-translations.ts packs each language's too).
const TRANSLATED_DATA = ["study/people/", "study/people-packs/", "topics/", "summaries/", "questions/bank.json", "museums/", "creeds/", "hymns/"];

function storedLanguage(): LanguageCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.find((language) => language.code === saved)?.code ?? "en";
  } catch {
    return "en";
  }
}

let current: LanguageCode = storedLanguage();
const listeners = new Set<() => void>();
/** Content files read so far (paths under /data/), so a change of language can fetch their other versions. */
export const loadedData = new Set<string>();

export const siteLanguage = (): LanguageCode => current;

/** Every caller re-renders with the new language; the data loaders forget their cached files. */
export function setSiteLanguage(code: LanguageCode): void {
  current = code;
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // private window: the choice lasts this visit only
  }
  listeners.forEach((listener) => listener());
}

export function onLanguageChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const useSiteLanguage = (): LanguageCode => useSyncExternalStore(onLanguageChange, siteLanguage);

export function languageFolder(code: LanguageCode = current): string | null {
  return LANGUAGES.find((language) => language.code === code)?.folder ?? null;
}

export function languageDirection(code: LanguageCode = current): "ltr" | "rtl" {
  return LANGUAGES.find((language) => language.code === code)?.dir ?? "ltr";
}

export const isTranslatedData = (path: string): boolean => TRANSLATED_DATA.some((prefix) => path.startsWith(prefix));

/** The translated copy's path under /data/ for a content file, or null when the file is read in English. */
export function translatedDataPath(path: string): string | null {
  if (isTranslatedData(path)) loadedData.add(path);
  const folder = languageFolder();
  return folder && isTranslatedData(path) ? `i18n/${folder}/${path}` : null;
}
