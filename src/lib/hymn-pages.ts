/**
 * One hymn's page data, as written by scripts/build-hymn-pages.py (data/hymns/pages/, in bundles of 25 hymns, and
 * data/hymns/by-book/ for the reader's "Sung on this chapter" card).
 *
 * Every verse is the Berean Standard Bible's text. The echoes were found in the King James wording the authors read
 * (scripts/hymns/: a word matcher, one AI model choosing or proposing, a script proving any proposed verse's words, and
 * a second model checking every pair); only those that passed every check are here. `words` is cut by script from the
 * BSB verse itself.
 */
import type { SongPassage, SongPlacedBook } from "./hymns";

export interface PagePassage extends SongPassage { whole: boolean; count: number }

export interface PageEcho extends SongPassage {
  stanza: number;
  line: number;
  words: string;
  /** "shared": the script found the shared wording; "echo": an AI model proposed it and both checks agreed. */
  kind: "shared" | "echo";
}

export interface BookTick { n: string; id: string; t: string; a: string; tone: string }

export interface HymnPageData {
  id: string;
  firstLine: string;
  subtitle: string;
  author: string;
  authorDates: string;
  year: number;
  group: string;
  collection: string;
  partLabel: string;
  number: string;
  meter: string;
  meterName: string;
  stanzas: string[][];
  /** The verse printed above the hymn, with the line that echoes it most closely (if any). */
  heading: { label: string; passage: PagePassage; line: { stanza: number; line: number } | null } | null;
  /** For a hymn printed without a heading: the one verse the whole hymn draws on, if the checks found one. */
  mainPassage: { label: string; passage: PagePassage } | null;
  echoes: PageEcho[];
  book: { label: string; here: number; ticks: BookTick[] };
  hymnals: number | null;
  placed: SongPlacedBook[];
  hymnary: string;
  source: { slug: string; title: string; url: string; licence: string; attribution: string };
}

export interface HymnPagesIndex {
  count: number;
  echoesChecked: boolean;
  bundles: Record<string, number>;
  /** The same hymn held under a second spelling: its address → the hymn whose page it opens. */
  aliases: Record<string, string>;
}

export interface ChapterHymn { id: string; t: string; a: string; y: number; r: string }
/** chapter → the hymns written on it ("on") and the hymns with a line echoing a verse in it ("echo"). */
export type HymnsByChapter = Record<string, { on: ChapterHymn[]; echo: ChapterHymn[] }>;
