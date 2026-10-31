// The reader's chosen language (the header's language button). English is the site as written; a translated
// language reads its content files from data/i18n/<folder>/ (content/translation/apply.py) and swaps the page code's
// own text on screen (page-translator.ts). Preview-only until a translation is published, so a stored choice is
// ignored on bibleguide.io.
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

export function siteLanguage(): LanguageCode {
  if (!PREVIEW_ONLY) return "en";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.find((language) => language.code === saved)?.code ?? "en";
  } catch {
    return "en";
  }
}

/** Saves the choice and reloads, so every page and loaded file comes back in the new language. */
export function chooseSiteLanguage(code: LanguageCode): void {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    return; // private window: nothing can be stored, and a reload would only come back in the old language
  }
  window.location.reload();
}

export function languageFolder(code: LanguageCode = siteLanguage()): string | null {
  return LANGUAGES.find((language) => language.code === code)?.folder ?? null;
}

/** The translated copy's path under /data/ for a content file, or null when the file is read in English. */
export function translatedDataPath(path: string): string | null {
  const folder = languageFolder();
  return folder && TRANSLATED_DATA.some((prefix) => path.startsWith(prefix)) ? `i18n/${folder}/${path}` : null;
}
