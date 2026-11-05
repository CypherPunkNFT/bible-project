// The languages the site itself can be read in (the header's language menu), as distinct from the 140 languages of its
// Bibles (languages.ts). No imports, so the release steps can read it under Node as well as the site in the browser.
// `released`: whether the language goes out with a release (scripts/release-translations.ts). An unreleased language is
// shown in the menu only on this computer's preview (language.ts menuLanguages), and its data/i18n folder never leaves
// it. The translation system's stage 3 grows this into the one list every tool reads
// (SiteTranslation/system/HANDOFF.md).
export const SITE_LANGUAGES = [
  { code: "en", name: "English", folder: null, dir: "ltr", released: true },
  { code: "es", name: "Español", folder: "es", dir: "ltr", released: true },
  { code: "pt-BR", name: "Português (Brasil)", folder: "pt", dir: "ltr", released: true },
  { code: "zh-Hans", name: "中文", folder: "zh", dir: "ltr", released: true },
  { code: "ar", name: "العربية", folder: "ar", dir: "rtl", released: true },
  { code: "hi", name: "हिन्दी", folder: "hi", dir: "ltr", released: true },
  { code: "id", name: "Bahasa Indonesia", folder: "id", dir: "ltr", released: true },
] as const;

export interface SiteLanguage {
  code: string;
  name: string;
  folder: string | null;
  dir: "ltr" | "rtl";
  released: boolean;
}

/** The translated folders under data/i18n/ that go out with a release. */
export const releasedFolders = (languages: readonly SiteLanguage[] = SITE_LANGUAGES): string[] =>
  languages.filter((language) => language.released && language.folder !== null).map((language) => language.folder!);
