// Biblical baby names (/baby-names, docs/features/baby-names/design.md): the data's shape, the one slug rule, the
// sitemap addresses and the link from person pages. Browser-safe: no file-system access, so the pages, the site
// inventory (scripts/design-review/site-map-rest.ts), the person page and the tests can all import it.
// The data is built by scripts/bible/build_baby_names.py into data/baby-names/ (index.json, names/<slug>.json).
import personLinks from "./person-links.json";

export const BABY_NAMES_PATH = "/baby-names";
export const LIST_PAGES = ["/baby-names", "/baby-names/boys", "/baby-names/girls"] as const;
/** Words a name's slug may never be, because list pages or future filters use them (design 3.5). */
export const RESERVED_SLUGS = new Set(["boys", "girls", "meaning", "letter", "search"]);

export type Gender = "boy" | "girl" | "both" | "unknown";
export type Testament = "ot" | "nt" | "both";
export type LabelCode = "given" | "probable" | "uncertain";

/** One row of the browse list (index.json "names"); keys are short because there are about 1,800 rows. */
export interface NameRow {
  s: string; // slug
  n: string; // name, as the Berean spells it
  g: Gender;
  t: Testament;
  m: string; // headline meaning
  l: LabelCode;
  th: string[]; // meaning themes
  w: string; // who, in one line
  c: number; // verses naming it
  f: 0 | 1; // full page (indexed) or short page (noindex)
  a: string[]; // other spellings, for the search box
  x?: 1; // the headline belongs to the best-known bearer; others bore other originals
  rb?: number; // US rank for boys
  rg?: number; // US rank for girls
}

export interface NamesIndex {
  version: number;
  ssaYear: number | null;
  themes: { id: string; label: string }[];
  /** Other spelling's slug -> [page slug, the spelling as written]. */
  aliases: Record<string, [string, string]>;
  names: NameRow[];
}

export interface NameMeaning {
  headline: string;
  label: LabelCode;
  labelText: string;
  source: "override" | "bible" | "strongs" | "none";
  strongsText: string;
  chain: string[];
  bibleNote: { verse: number; text: string } | null;
  wordplay: { verse: number; text: string } | null;
  explanation: string;
  cite: string;
  root: { strongs: string; word: string; translit: string } | null;
}

export interface NameOriginal {
  strongs: string;
  word: string;
  translit: string;
  script: "he" | "grc";
  language: string;
  greek: { strongs: string; word: string }[];
  people: string[];
  meaning: NameMeaning;
  hitchcock: string;
}

export interface NameBearer {
  id: string;
  listedName: string;
  description: string;
  summary: string;
  opening: string;
  sex: "M" | "F" | "";
  period: string;
  testament: "ot" | "nt";
  verseCount: number;
  totalVerses: number;
  keyVerses: number[];
  alsoCalled: { name: string; slug?: string }[];
  strongs: string[];
  hasStory: boolean;
}

export interface NameLink { slug: string; name: string }

export interface NameDocument {
  slug: string;
  name: string;
  gender: Gender;
  testament: Testament;
  full: boolean;
  opening: string;
  usedToday: string;
  ranks: { boys: number | null; girls: number | null; year: number } | null;
  caution: string;
  note: { text: string; links: { to: string; label: string }[] } | null;
  originals: NameOriginal[];
  bearers: NameBearer[];
  places: { id: string; name: string; type: string; verses: number }[];
  passages: number[];
  verses: number[];
  themes: string[];
  related: { otherTestament: NameLink[]; alsoSpelled: NameLink[]; sameRoot: NameLink[]; sameTheme: NameLink[] };
}

/** The one slug rule (scripts/bible/baby-names/bn_assemble.py slug_of applies the same): lower case, letters only,
 *  hyphens kept, accents removed. "Maher-shalal-hash-baz" -> "maher-shalal-hash-baz". */
export function nameSlug(name: string): string {
  return name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z-]+/g, "-").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "");
}

export const namePath = (slug: string) => `${BABY_NAMES_PATH}/${slug}`;

/** Every address that goes in the sitemap and gets a ready-made crawler copy: the three list pages and every full
 *  name page (short pages say noindex, design 6.4). A pure function over the index rows. */
export function babyNamePaths(rows: readonly Pick<NameRow, "s" | "f">[]): string[] {
  return [...LIST_PAGES, ...rows.filter((row) => row.f === 1).map((row) => namePath(row.s))];
}

const EXCEPTIONS = personLinks as Record<string, string | null>;

/** The name page a person page links to: the slug rule applied to the person's listed name, unless the build's
 *  exceptions file says otherwise (a Berean spelling, a two-word name) or that the person gets no link (null). The
 *  link names the page's name, not the listed one (Mary Magdalene's link reads "The name Mary"). */
export function nameLinkFor(person: { id: string; n: string }): { path: string; name: string } | null {
  const slug = person.id in EXCEPTIONS ? EXCEPTIONS[person.id] : nameSlug(person.n);
  return slug ? { path: namePath(slug), name: slug.charAt(0).toUpperCase() + slug.slice(1) } : null;
}
