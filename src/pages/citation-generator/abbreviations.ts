// The English abbreviations the citation styles use, and the short book names people type. Everything here is English
// on purpose: these are English-language styles, so a citation keeps them in every site language (the page shows them
// with translate="no"), and the typed names are lookup keys, never shown. How each style writes the Bible's book names,
// by the catalogue's book code (data/catalog.json), follows the manuals' own lists: MLA Handbook 9th ed., appendix 1; The Chicago Manual of Style's traditional
// abbreviations (Turabian uses the same list); The SBL Handbook of Style, 2nd ed., 8.3. APA writes the names in full.
// A code missing from a table is written in full. README.md beside this file.

/** MLA 9: periods, "1 Kgs.", "Song of Sg.", chapter and verse joined by a full stop (styles.ts). */
const MLA: Record<string, string> = {
  GEN: "Gen.", EXO: "Exod.", LEV: "Lev.", NUM: "Num.", DEU: "Deut.", JOS: "Josh.", JDG: "Judg.", RUT: "Ruth",
  "1SA": "1 Sam.", "2SA": "2 Sam.", "1KI": "1 Kgs.", "2KI": "2 Kgs.", "1CH": "1 Chron.", "2CH": "2 Chron.", EZR: "Ezra",
  NEH: "Neh.", EST: "Esth.", JOB: "Job", PSA: "Ps.", PRO: "Prov.", ECC: "Eccles.", SNG: "Song of Sg.", ISA: "Isa.",
  JER: "Jer.", LAM: "Lam.", EZK: "Ezek.", DAN: "Dan.", HOS: "Hos.", JOL: "Joel", AMO: "Amos", OBA: "Obad.", JON: "Jon.",
  MIC: "Mic.", NAM: "Nah.", HAB: "Hab.", ZEP: "Zeph.", HAG: "Hag.", ZEC: "Zech.", MAL: "Mal.",
  MAT: "Matt.", MRK: "Mark", LUK: "Luke", JHN: "John", ACT: "Acts", ROM: "Rom.", "1CO": "1 Cor.", "2CO": "2 Cor.",
  GAL: "Gal.", EPH: "Eph.", PHP: "Phil.", COL: "Col.", "1TH": "1 Thess.", "2TH": "2 Thess.", "1TI": "1 Tim.",
  "2TI": "2 Tim.", TIT: "Tit.", PHM: "Philem.", HEB: "Heb.", JAS: "Jas.", "1PE": "1 Pet.", "2PE": "2 Pet.", "1JN": "1 John",
  "2JN": "2 John", "3JN": "3 John", JUD: "Jude", REV: "Rev.",
  "1ES": "1 Esd.", "2ES": "2 Esd.", TOB: "Tob.", JDT: "Jth.", ESG: "Add. Esth.", WIS: "Wisd. of Sol.", SIR: "Sir.",
  BAR: "Bar.", LJE: "Let. of Jer.", S3Y: "Song of 3 Childr.", SUS: "Sus.", BEL: "Bel and Dr.", MAN: "Pr. of Man.",
  "1MA": "1 Macc.", "2MA": "2 Macc.", "3MA": "3 Macc.", "4MA": "4 Macc.", PS2: "Ps. 151", DAG: "Dan.",
};

/** Chicago and Turabian, traditional abbreviations: "1 Kings", "Esther", "Hosea", "James", "Ps." (more than one: "Pss."). */
const CHICAGO: Record<string, string> = {
  GEN: "Gen.", EXO: "Exod.", LEV: "Lev.", NUM: "Num.", DEU: "Deut.", JOS: "Josh.", JDG: "Judg.", RUT: "Ruth",
  "1SA": "1 Sam.", "2SA": "2 Sam.", "1KI": "1 Kings", "2KI": "2 Kings", "1CH": "1 Chron.", "2CH": "2 Chron.", EZR: "Ezra",
  NEH: "Neh.", EST: "Esther", JOB: "Job", PSA: "Ps.", PRO: "Prov.", ECC: "Eccles.", SNG: "Song of Sol.", ISA: "Isa.",
  JER: "Jer.", LAM: "Lam.", EZK: "Ezek.", DAN: "Dan.", HOS: "Hosea", JOL: "Joel", AMO: "Amos", OBA: "Obad.", JON: "Jon.",
  MIC: "Mic.", NAM: "Nah.", HAB: "Hab.", ZEP: "Zeph.", HAG: "Hag.", ZEC: "Zech.", MAL: "Mal.",
  MAT: "Matt.", MRK: "Mark", LUK: "Luke", JHN: "John", ACT: "Acts", ROM: "Rom.", "1CO": "1 Cor.", "2CO": "2 Cor.",
  GAL: "Gal.", EPH: "Eph.", PHP: "Phil.", COL: "Col.", "1TH": "1 Thess.", "2TH": "2 Thess.", "1TI": "1 Tim.",
  "2TI": "2 Tim.", TIT: "Titus", PHM: "Philem.", HEB: "Heb.", JAS: "James", "1PE": "1 Pet.", "2PE": "2 Pet.", "1JN": "1 John",
  "2JN": "2 John", "3JN": "3 John", JUD: "Jude", REV: "Rev.",
  "1ES": "1 Esd.", "2ES": "2 Esd.", TOB: "Tob.", JDT: "Jth.", ESG: "Add. Esther", WIS: "Wisd. of Sol.", SIR: "Ecclus.",
  BAR: "Bar.", LJE: "Ep. Jer.", S3Y: "Song of Three Children", SUS: "Sus.", BEL: "Bel and Dragon", MAN: "Pr. of Man.",
  "1MA": "1 Macc.", "2MA": "2 Macc.", "3MA": "3 Macc.", "4MA": "4 Macc.", PS2: "Ps. 151", DAG: "Dan.",
};

/** SBL Handbook, 2nd ed.: no periods, "1 Kgs", "Song", "Phlm" ("Pss" for more than one psalm). */
const SBL: Record<string, string> = {
  GEN: "Gen", EXO: "Exod", LEV: "Lev", NUM: "Num", DEU: "Deut", JOS: "Josh", JDG: "Judg", RUT: "Ruth",
  "1SA": "1 Sam", "2SA": "2 Sam", "1KI": "1 Kgs", "2KI": "2 Kgs", "1CH": "1 Chr", "2CH": "2 Chr", EZR: "Ezra",
  NEH: "Neh", EST: "Esth", JOB: "Job", PSA: "Ps", PRO: "Prov", ECC: "Eccl", SNG: "Song", ISA: "Isa",
  JER: "Jer", LAM: "Lam", EZK: "Ezek", DAN: "Dan", HOS: "Hos", JOL: "Joel", AMO: "Amos", OBA: "Obad", JON: "Jonah",
  MIC: "Mic", NAM: "Nah", HAB: "Hab", ZEP: "Zeph", HAG: "Hag", ZEC: "Zech", MAL: "Mal",
  MAT: "Matt", MRK: "Mark", LUK: "Luke", JHN: "John", ACT: "Acts", ROM: "Rom", "1CO": "1 Cor", "2CO": "2 Cor",
  GAL: "Gal", EPH: "Eph", PHP: "Phil", COL: "Col", "1TH": "1 Thess", "2TH": "2 Thess", "1TI": "1 Tim",
  "2TI": "2 Tim", TIT: "Titus", PHM: "Phlm", HEB: "Heb", JAS: "Jas", "1PE": "1 Pet", "2PE": "2 Pet", "1JN": "1 John",
  "2JN": "2 John", "3JN": "3 John", JUD: "Jude", REV: "Rev",
  "1ES": "1 Esd", "2ES": "2 Esd", TOB: "Tob", JDT: "Jdt", ESG: "Add Esth", WIS: "Wis", SIR: "Sir",
  BAR: "Bar", LJE: "Ep Jer", S3Y: "Sg Three", SUS: "Sus", BEL: "Bel", MAN: "Pr Man",
  "1MA": "1 Macc", "2MA": "2 Macc", "3MA": "3 Macc", "4MA": "4 Macc", PS2: "Ps 151", DAG: "Dan",
};

/** APA: full names, with the catalogue's two Greek books named as a reader would look for them. */
const FULL: Record<string, string> = { ESG: "Additions to Esther", DAG: "Daniel" };

export type BookStyle = "mla" | "chicago" | "sbl" | "full";
const TABLES: Record<Exclude<BookStyle, "full">, Record<string, string>> = { mla: MLA, chicago: CHICAGO, sbl: SBL };

/**
 * A book's name in a style. `name` is the catalogue's English name, used where a table has no entry. `plural` is a
 * reference to more than one psalm, which the styles write "Pss." / "Pss" / "Psalms" (MLA keeps "Ps.").
 */
export function bookLabel(code: string, name: string, style: BookStyle, plural = false): string {
  if (code === "PSA") {
    if (style === "full") return plural ? "Psalms" : "Psalm";
    if (plural && style === "chicago") return "Pss.";
    if (plural && style === "sbl") return "Pss";
  }
  if (style === "full") return FULL[code] ?? name;
  return TABLES[style][code] ?? name;
}

/** Every abbreviation in the three tables, for reading what a visitor types (parse.ts). */
export const STYLE_ABBREVIATIONS: readonly (readonly [string, string])[] = [MLA, CHICAGO, SBL]
  .flatMap((table) => Object.entries(table))
  .filter(([code]) => code !== "DAG" && code !== "PS2");

/** Names people type that the style tables do not hold. */
export const EXTRA_NAMES: Record<string, string> = {
  gn: "GEN", ex: "EXO", lv: "LEV", nm: "NUM", dt: "DEU", jg: "JDG", jdgs: "JDG", ru: "RUT", "1 sm": "1SA", "2 sm": "2SA",
  "1 ki": "1KI", "2 ki": "2KI", "1 ch": "1CH", "2 ch": "2CH", ne: "NEH", jb: "JOB", psa: "PSA", psalm: "PSA", pslm: "PSA",
  pss: "PSA", prv: "PRO", pr: "PRO", qoh: "ECC", qoheleth: "ECC", ecc: "ECC", "song of songs": "SNG",
  "song of solomon": "SNG", sos: "SNG", cant: "SNG", canticles: "SNG", ezk: "EZK", dn: "DAN", jl: "JOL", am: "AMO",
  ob: "OBA", mi: "MIC", na: "NAM", zep: "ZEP", zec: "ZEC", hg: "HAG", mt: "MAT", mk: "MRK", mr: "MRK", lk: "LUK",
  jn: "JHN", jhn: "JHN", rm: "ROM", "1 co": "1CO", "2 co": "2CO", php: "PHP", phm: "PHM", "1 th": "1TH", "2 th": "2TH",
  "1 pt": "1PE", "2 pt": "2PE", "1 jn": "1JN", "2 jn": "2JN", "3 jn": "3JN", jm: "JAS", revelations: "REV",
  apocalypse: "REV", jth: "JDT", wisdom: "WIS", ecclesiasticus: "SIR", sirach: "SIR", "1 mac": "1MA", "2 mac": "2MA",
  "greek esther": "ESG", "additions to esther": "ESG",
};

const MLA_MONTHS = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];
/** MLA's access date: "9 Nov. 2026". */
export const mlaDate = (date: Date) => `${date.getDate()} ${MLA_MONTHS[date.getMonth()]} ${date.getFullYear()}`;

/** APA's note for an older work republished: "(Original work published 1611)". */
export const apaOriginal = (year: number) => `(Original work published ${year})`;
