// Each translated language's own address for the main pages (/es/study, /hi, …), so search engines can find the
// translated site (translation system, stage 5 job 18; SiteTranslation/system/HANDOFF.md). The owner said yes to the main
// pages only, under 100 extra files: ADDRESSED_PAGES in every released language, each with a ready-made copy for search
// engines (scripts/seo/language-copies.ts). The app's start-up takes the language from the address and drops the prefix
// (language.ts takeLanguageAddress); the page head names the language address as the official one and lists the others
// (pageLinks, used by usePageHead.ts and scripts/seo/build.ts).
//
// LANGUAGE_ADDRESSES_RELEASED is the owner's switch. While it is false the addresses work only on this computer's preview,
// and a release carries none of it: no copies, no hreflang links, no sitemap entries. Releasing is the owner's yes, then a
// full prepare (scripts/prepare-testimonies-release.ts); a quick release refuses a change to this file.
import { normalizePath, SITE_ORIGIN } from "./page-head.ts";
import { SITE_LANGUAGES, SOURCE_LANGUAGE, type SiteLanguage } from "./site-languages.ts";

export const LANGUAGE_ADDRESSES_RELEASED = false;

/** This computer's preview: where unreleased languages and the unreleased addresses work. */
export const LOCAL_HOSTS: ReadonlySet<string> = new Set(["127.0.0.1", "localhost"]);

/** The main pages that have an address in each language. Each needs an English ready-made copy (content/seo/pages) and
 * a capture in every address language (content/seo/languages). /read and /study/apostles are left out: they have no
 * English copy (one moves the reader to a chapter, the other to the apostles' first page). */
export const ADDRESSED_PAGES: readonly string[] = [
  "/", "/bible", "/listen", "/study", "/study/atlas", "/study/people", "/study/gospels", "/study/prophets", "/study/theology",
  "/study/hymns", "/study/creeds", "/study/questions", "/topics", "/apologetics", "/teachers", "/testimonies",
];

/** The owner's cap on the files the language copies may add to a release (2026-11-04: "less than 100 extra page files"). */
export const COPY_LIMIT = 99;

/** The languages with addresses: released, real (not a made-up test language), and translated. */
export const addressLanguages = (languages: readonly SiteLanguage[] = SITE_LANGUAGES): SiteLanguage[] =>
  languages.filter((language) => language.folder !== null && language.released && !language.pseudo);

/** Whether the addresses work on this host: everywhere once released, before that only on the preview. */
export const addressesOn = (hostname: string, released: boolean = LANGUAGE_ADDRESSES_RELEASED): boolean =>
  released || LOCAL_HOSTS.has(hostname);

export const isAddressedPage = (pathname: string): boolean => ADDRESSED_PAGES.includes(normalizePath(pathname));

/** A page's address in a language: "/es/study"; the home page is "/es". */
export function languageAddress(pathname: string, folder: string): string {
  const path = normalizePath(pathname);
  return path === "/" ? `/${folder}` : `/${folder}${path}`;
}

/** The hreflang value for a language code: the region dropped, so "pt-BR" serves every Portuguese reader ("pt"); a
 * script ("zh-Hans") is kept. */
export const hreflangOf = (code: string): string =>
  code.split("-").filter((part, index) => index === 0 || !/^([A-Z]{2}|\d{3})$/.test(part)).join("-");

export interface AddressedPath { code: string; folder: string; path: string }

/** The language an address starts with, and the page's own address without it: "/es/study" -> es, "/study". The first
 * segment must be a whole address-language folder (any case): "/essay" and "/xa/study" name none. Extra slashes after
 * the prefix are dropped, so the page's own address can never name another site ("/es//x.com" -> "/x.com"). */
export function fromAddress(pathname: string, languages: readonly SiteLanguage[] = addressLanguages()): AddressedPath | null {
  const match = /^\/([A-Za-z]{2,3})(?=\/|$)(.*)$/.exec(pathname);
  if (!match) return null;
  const folder = match[1].toLowerCase();
  const language = languages.find((entry) => entry.folder === folder);
  if (!language) return null;
  return { code: language.code, folder, path: "/" + match[2].replace(/^[/\\]+/, "") };
}

export interface Alternate { hreflang: string; href: string }
export interface PageLinks { canonical: string; alternates: Alternate[] }

/** A page's official address in the reader's language and its versions in the other languages. A main page read in an
 * address language names its language address; every other page, and every page while the addresses are off, names its
 * one English address, as before. The list of versions is the same on every member, as search engines require. */
export function pageLinks(pathname: string, code: string, on: boolean): PageLinks {
  const path = normalizePath(pathname);
  const english = SITE_ORIGIN + path;
  if (!on || !isAddressedPage(path)) return { canonical: english, alternates: [] };
  const languages = addressLanguages();
  const address = (language: SiteLanguage) => SITE_ORIGIN + languageAddress(path, language.folder!);
  const own = languages.find((language) => language.code === code);
  return {
    canonical: own ? address(own) : english,
    alternates: [
      { hreflang: hreflangOf(SOURCE_LANGUAGE.code), href: english },
      ...languages.map((language) => ({ hreflang: hreflangOf(language.code), href: address(language) })),
      { hreflang: "x-default", href: english },
    ],
  };
}
