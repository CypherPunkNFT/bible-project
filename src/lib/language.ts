// The reader's chosen language (the header's language button). English is the site as written; a translated
// language reads its content files from data/i18n/<folder>/ (content/translation/apply.py), and page-translator.ts
// swaps the words already on screen, so a change of language never reloads the page. Published 2026-11-02.
import { useSyncExternalStore } from "react";
import { SITE_LANGUAGES, type SiteLanguage } from "./site-languages";
import { addressesOn, fromAddress, LOCAL_HOSTS } from "./language-addresses";

/** Every language the site knows (site-languages.ts), released or not: what codes and folders are looked up in. */
export const LANGUAGES = SITE_LANGUAGES;
// A plain string: the codes come from site-languages.json, which TypeScript cannot read as a fixed list. Every lookup
// goes through LANGUAGES, and setSiteLanguage refuses a code the site does not offer.
export type LanguageCode = SiteLanguage["code"];

// Unreleased languages are offered only on this computer's preview (LOCAL_HOSTS), the same rule as the mock-ups
// (mockup-routes.tsx).

/** The languages the menu offers on `hostname`: the released ones, and on the local preview the unreleased ones too. */
export function menuLanguages<T extends SiteLanguage>(languages: readonly T[], hostname: string): T[] {
  return languages.filter((language) => language.released || LOCAL_HOSTS.has(hostname));
}

export const MENU_LANGUAGES = menuLanguages(LANGUAGES, typeof window === "undefined" ? "" : window.location.hostname);
const offered = (code: string | null): code is LanguageCode => MENU_LANGUAGES.some((language) => language.code === code);

const STORAGE_KEY = "bp-language";

// The data folders apply.py translates; every other file (Bible texts, the catalogue) has no translated copy. The live
// site reads people from packs (scripts/release-translations.ts packs each language's too). Of topics/, only what
// apply.py writes: topics/library/ (book titles, authors and links) and topics/books/ (counts) are read in English.
// questions/bank-parts/ is made only by the release, like the people packs (scripts/pack-language-files.ts).
const TRANSLATED_DATA = ["study/people.json", "study/people/", "study/people-packs/", "topics/t/", "topics/index.json", "topics/chapters/", "summaries/", "questions/bank.json", "questions/bank-parts/", "museums/", "creeds/", "hymns/"];

function storedLanguage(): LanguageCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (offered(saved)) return saved;
    // A language this host does not offer (one chosen on the preview, not released): forget it, so index.html stops
    // hiding the page for it on the next visit.
    if (saved !== null) localStorage.removeItem(STORAGE_KEY);
    return "en";
  } catch {
    return "en";
  }
}

interface AddressBar { hostname: string; pathname: string; search: string; hash: string }
interface AddressHistory { state: unknown; replaceState(state: unknown, unused: string, url: string): void }

/**
 * The language a language address names (/es/study, language-addresses.ts), which wins over the stored choice: the
 * prefix is dropped from the address bar before the router reads it ("/es/study?q=1#a" -> "/study?q=1#a") and the
 * language is kept as the reader's choice. null where the address names none, or the addresses are off on this host.
 */
export function takeLanguageAddress(where: AddressBar, history: AddressHistory): LanguageCode | null {
  if (!addressesOn(where.hostname)) return null;
  const addressed = fromAddress(where.pathname);
  if (!addressed || !offered(addressed.code)) return null;
  try {
    history.replaceState(history.state, "", addressed.path + where.search + where.hash);
  } catch (error) {
    console.warn(`language: could not drop the language prefix from ${where.pathname}`, error);
  }
  try {
    localStorage.setItem(STORAGE_KEY, addressed.code);
  } catch {
    // private window: the language lasts this visit only
  }
  return addressed.code;
}

// Read when this module is first imported, before main.tsx renders the router.
let current: LanguageCode = (typeof window !== "undefined" && takeLanguageAddress(window.location, window.history)) || storedLanguage();
const listeners = new Set<() => void>();
/** Content files read so far (paths under /data/), so a change of language can fetch their other versions. */
export const loadedData = new Set<string>();

export const siteLanguage = (): LanguageCode => current;

/** Every caller re-renders with the new language; the data loaders forget their cached files. */
export function setSiteLanguage(code: LanguageCode): void {
  if (!offered(code)) throw new Error(`setSiteLanguage: "${code}" is not offered on this site (released languages only, outside the local preview).`);
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

// Content a page reads again for a new language (useAsync, useCachedLoad). The words a page builds from its data
// ("Almighty Ruler of the skies" from "...skies,") cannot be swapped on screen, so they come from the new copy instead.
const reloads = new Set<Promise<unknown>>();

export function reloadingForLanguage(reload: Promise<unknown>): void {
  reloads.add(reload);
  const done = () => reloads.delete(reload);
  reload.then(done, done);
}

/** Resolves when the content being read again for the new language has arrived, or failed. */
export const languageReloads = (): Promise<unknown> => Promise.allSettled([...reloads]);

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
