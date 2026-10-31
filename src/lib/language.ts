// The reader's chosen language (the header's language button). English is the site as written; a translated
// language reads its content files from data/i18n/<folder>/ (content/translation/apply.py), and page-translator.ts
// swaps the words already on screen, so a change of language never reloads the page. Preview-only until a
// translation is published, so a stored choice is ignored on bibleguide.io.
import { useSyncExternalStore } from "react";

export const LANGUAGES = [
  { code: "en", name: "English", folder: null },
  { code: "es", name: "Español", folder: "es" },
  { code: "pt-BR", name: "Português (Brasil)", folder: "pt" },
] as const;
export type LanguageCode = (typeof LANGUAGES)[number]["code"];

const STORAGE_KEY = "bp-language";
export const PREVIEW_ONLY = typeof window !== "undefined" && ["127.0.0.1", "localhost"].includes(window.location.hostname);

// The data folders apply.py translates; every other file (Bible texts, the catalogue) has no translated copy.
const TRANSLATED_DATA = ["study/people/", "topics/", "summaries/", "questions/bank.json", "museums/", "creeds/", "hymns/"];

function storedLanguage(): LanguageCode {
  if (!PREVIEW_ONLY) return "en";
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

export const isTranslatedData = (path: string): boolean => TRANSLATED_DATA.some((prefix) => path.startsWith(prefix));

/** The translated copy's path under /data/ for a content file, or null when the file is read in English. */
export function translatedDataPath(path: string): string | null {
  if (isTranslatedData(path)) loadedData.add(path);
  const folder = languageFolder();
  return folder && isTranslatedData(path) ? `i18n/${folder}/${path}` : null;
}
