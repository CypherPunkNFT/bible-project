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
  "ach": "Acoli",
  "ak": "Akan",
  "sq": "Albanian",
  "msy": "Aruamu",
  "as": "Assamese",
  "bba": "Baatonum",
  "beo": "Beami",
  "be": "Belarusian",
  "bn": "Bengali",
  "bi": "Bislama",
  "bqc": "Boko",
  "gax": "Borana-Arsi-Guji Oromo",
  "my": "Burmese",
  "rmc": "Carpathian Romani",
  "ceb": "Cebuano",
  "nch": "Central Huasteca Nahuatl",
  "ckb": "Central Kurdish",
  "hne": "Chhattisgarhi",
  "ny": "Chichewa",
  "cac": "Chuj",
  "chk": "Chuukese",
  "hr": "Croatian",
  "cs": "Czech",
  "mps": "Dadibi",
  "dwr": "Dawro",
  "tbz": "Ditammari",
  "nl": "Dutch",
  "nhe": "Eastern Huasteca Nahuatl",
  "cek": "Eastern Khumi Chin",
  "eo": "Esperanto",
  "ee": "Ewe",
  "fi": "Finnish",
  "gmv": "Gamo",
  "cab": "Garifuna",
  "drs": "Gedeo",
  "gof": "Gofa",
  "gub": "Guajajára",
  "gu": "Gujarati",
  "ht": "Haitian Creole",
  "ha": "Hausa",
  "haw": "Hawaiian",
  "hil": "Hiligaynon",
  "hmo": "Hiri Motu",
  "qub": "Huallaga Huánuco Quechua",
  "hch": "Huichol",
  "hui": "Huli",
  "hu": "Hungarian",
  "ibb": "Ibibio",
  "ig": "Igbo",
  "ilo": "Ilocano",
  "id": "Indonesian",
  "kbq": "Kamano",
  "kn": "Kannada",
  "kpg": "Kapingamarangi",
  "ki": "Kikuyu",
  "kij": "Kilivila",
  "mkw": "Kituba",
  "kos": "Kosraean",
  "rop": "Kriol",
  "ksd": "Kuanua",
  "kfx": "Kullu Pahari",
  "lo": "Lao",
  "lv": "Latvian",
  "ln": "Lingala",
  "lg": "Luganda",
  "luo": "Luo",
  "mg": "Malagasy",
  "ml": "Malayalam",
  "mdy": "Male",
  "mam": "Mam",
  "mi": "Māori",
  "mr": "Marathi",
  "mhr": "Mari",
  "hlt": "Matu Chin",
  "gun": "Mbyá Guaraní",
  "el": "Modern Greek",
  "meu": "Motu",
  "nme": "Mzieme Naga",
  "ne": "Nepali",
  "nd": "North Ndebele",
  "no": "Norwegian",
  "nyn": "Nyankole",
  "or": "Odia",
  "pon": "Pohnpeian",
  "pl": "Polish",
  "poh": "Poqomchi'",
  "pa": "Punjabi",
  "ro": "Romanian",
  "rug": "Roviana",
  "rn": "Rundi",
  "cuk": "San Blas Kuna",
  "sr": "Serbian",
  "shr": "Shi",
  "sn": "Shona",
  "so": "Somali",
  "azb": "South Azerbaijani",
  "suz": "Sunwar",
  "sus": "Susu",
  "sw": "Swahili",
  "sv": "Swedish",
  "tl": "Tagalog",
  "ta": "Tamil",
  "tdx": "Tandroy-Mahafaly Malagasy",
  "rif": "Tarifit",
  "te": "Telugu",
  "tcz": "Thado Chin",
  "th": "Thai",
  "cth": "Thaiphum Chin",
  "bo": "Tibetan",
  "tpi": "Tok Pisin",
  "tod": "Toma",
  "to": "Tongan",
  "tr": "Turkish",
  "uk": "Ukrainian",
  "ur": "Urdu",
  "ug": "Uyghur",
  "gaz": "West Central Oromo",
  "nhw": "Western Huasteca Nahuatl",
  "wo": "Wolof",
  "yal": "Yalunka",
  "yap": "Yapese",
  "yo": "Yoruba",
  "czt": "Zotung Chin",
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

/** Each version group's colour: the versions timeline, its legend and the Versions page's language list. */
export const GROUP_COLOR: Record<VersionGroup["id"], string> = { english: "var(--history)", original: "var(--prophets)", translations: "var(--gospels)" };

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
