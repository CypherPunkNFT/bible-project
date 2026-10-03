// Shapes written by scripts/build-data.py. See scripts/bible/usfm.py for the run format.

export type SectionId = "history" | "poetry" | "prophets" | "gospels" | "epistles" | "revelation" | "apocrypha";

export interface BookInfo {
  code: string;
  num: number;
  name: string;
  section: SectionId;
}

export interface Translation {
  slug: string;
  abbr: string;
  name: string;
  year: number;
  lang: string;
  dir: "ltr" | "rtl";
  numbering: "english" | "hebrew" | "greek" | "vulgate" | "mixed";
  /** book code -> chapter labels in source order */
  books: Record<string, string[]>;
  verses: number;
}

export interface Catalog {
  stamp: string;
  sections: SectionId[];
  books: BookInfo[];
  equivalent: Record<string, string>;
  translations: Translation[];
}

/** plain text | [text, flags, strong?] | footnote | break */
export type Run = string | [string, string] | [string, string, string] | { f: string } | { b: string };

export interface Verse {
  n: string;
  h?: [string, string][];
  r: Run[];
}

export interface Chapter {
  c: string;
  t?: Run[];
  v: Verse[];
  /** headings after the last verse, e.g. the KJV's "Written to the Romans from Corinthus" */
  e?: [string, string][];
}

export interface BookText {
  code: string;
  chapters: Chapter[];
}

export type PlainBook = Record<string, string>;

/** "chapter:verse" -> [to_start_id, to_end_id (0 = single verse), votes][] */
export type CrossRefBook = Record<string, [number, number, number][]>;

export interface Stats {
  source: string;
  books: {
    code: string;
    name: string;
    section: SectionId;
    /** per chapter: [verses, words, words of Jesus] */
    chapters: [number, number, number][];
    verses: number;
    words: number;
    red: number;
  }[];
}

export interface ArcData {
  chapters: string[];
  arcs: [number, number, number][];
}

export interface Place {
  id: string;
  name: string;
  type: string;
  lon: number;
  lat: number;
  confidence: number;
  verses: number[];
}
