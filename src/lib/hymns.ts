/**
 * The Hymns data, as written by scripts/build-hymn-collection.py from the hymns corpus (Research/Hymns).
 *
 * The collection holds each distinct hymn once (the corpus has 1,812 texts, but CCEL's combined Watts edition repeats
 * most of Project Gutenberg's separate Watts books). A hymn's main chapter is packed into one number, `v`:
 * book (1–66) × 1,000,000 + chapter × 1,000 + verse, or 0 when the hymn is on a subject rather than a passage.
 */

export type HymnGroupId = "psalms" | "hss" | "divine" | "newton" | "cowper";
export const HYMN_GROUPS: readonly HymnGroupId[] = ["psalms", "hss", "divine", "newton", "cowper"];

export interface HymnBook {
  code: string;
  name: string;
  section: string;
  /** Verses in each chapter. */
  chapters: number[];
}

export interface HymnGroup {
  id: HymnGroupId;
  label: string;
  short: string;
  who: string;
  year: number;
  /** A palette token, e.g. "--poetry". */
  tone: string;
}

export interface HymnEntry {
  id: string;
  /** First line. */
  t: string;
  /** Subject, as its book gives it. */
  s: string;
  g: HymnGroupId;
  a: string;
  y: number;
  /** Metre as printed ("8,6,8,6", "Common Metre"), or "". */
  m: string;
  v: number;
  /** The main passage as a label, "Psalm 90:1", or "". */
  r: string;
  copies: number;
}

export interface HymnCollection {
  books: HymnBook[];
  groups: HymnGroup[];
  hymns: HymnEntry[];
  counts: { records: number; distinct: number; withChapter: number; heldTwice: number };
}

/** The words of one hymn, for its plain page. */
export interface HymnText {
  title: string;
  book: string;
  number: string;
  meter: string;
  subject: string;
  stanzas: string[][];
  refs: string[];
  source: { title: string; url: string; licence: string };
}

export interface SongVerse { n: number; text: string }
export interface SongPassage { ref: string; code: string; chapter: number; verses: SongVerse[] }
export interface SongEcho extends SongPassage { stanza: number; line: number; words: string }
export interface SongPlacedRef { ref: string; label: string; code: string; chapter: number; first: number; whole: boolean; count: number; verses: SongVerse[] }
export interface SongPlacedBook { book: string; code: string; tone: string; refs: SongPlacedRef[] }

/** The full study of one hymn (Amazing Grace). */
export interface HymnSong {
  id: string;
  title: string;
  author: string;
  authorDates: string;
  year: number;
  collection: string;
  bookOfCollection: string;
  number: number;
  meter: string;
  meterName: string;
  stanzas: string[][];
  heading: { label: string; passage: SongPassage };
  echoes: SongEcho[];
  hymnals: number;
  placed: SongPlacedBook[];
  book1: { n: number; title: string; author: string; book: string; tone: string }[];
  olneyAuthors: Record<string, number>;
  source: { title: string; url: string; licence: string; hymnary: string };
}

/** The one hymn with its full study page so far. */
export const AMAZING_GRACE = "ccel-olney-hymns-41-amazing-grace-how-sweet-the-sound";

/** A hymn id safe to put in a data path. The collection is still the authority for which ones exist. */
export const isHymnId = (id: string): boolean => /^[a-z0-9-]{3,140}$/.test(id);

export const hymnHref = (id: string) => `/study/hymns/${id}`;
export const bookIndexOf = (v: number) => Math.floor(v / 1e6) - 1;
export const chapterOf = (v: number) => Math.floor(v / 1e3) % 1000;

const METRES: Record<string, string> = {
  "8,6,8,6": "Common Metre", "8.6.8.6": "Common Metre", "8,8,8,8": "Long Metre", "8.8.8.8": "Long Metre",
  "6,6,8,6": "Short Metre", "6.6.8.6": "Short Metre", "C. M.": "Common Metre", "L. M.": "Long Metre", "S. M.": "Short Metre",
};
/** The metre family a catalogue filters by. */
export const metreName = (m: string) => METRES[m] ?? (m ? (/^(Common|Long|Short) Metre$/.test(m) ? m : "Other metres") : "Not recorded");
