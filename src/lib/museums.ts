/**
 * The Museum-Grade Archaeology data, as written by scripts/build-museums.py.
 *
 * Two kinds of card, and the page never adds them together: the collections the records were
 * fetched from, and the institutions those records name as holding the object. One tablet is in both
 * — counted once as a CDLI record and once as a British Museum object — so a total across the whole
 * page would count most of the corpus twice.
 */

export type MuseumGroup = "collections" | "holders" | "coming-soon";
export type MuseumState = "held" | "empty" | "coming-soon";

/** A row of the project's 140-row archaeology catalogue that an object matches.
 *
 * `supported` and `unsupported` are the reach and the limit as two sentences. A third of the rows
 * were audited before that split and state both in one sentence, in `scope`. */
export interface CatalogueRow {
  id: string;
  name: string;
  category: string;
  supported: string;
  unsupported: string;
  scope: string;
  passages: string;
  assessment: string;
  /** `object` — the row is about this very object. `related` — it only shares a name with it. */
  match: "object" | "related";
}

/** An openly licensed photograph, resized and committed. Absent means we show no picture at all. */
export interface MuseumPhoto {
  view: string;
  thumb: string;
  width: number;
  height: number;
  thumb_width: number;
  thumb_height: number;
  licence: string;
  licence_url: string;
  credit: string;
  share_alike: boolean;
  commons_page: string;
}

export interface MuseumObject {
  id: string;
  title: string;
  accession: string;
  /** The holder exactly as this object's own source wrote it, so a merge stays visible. */
  recorded_as: string;
  /** The source itself marked the whereabouts with a question mark. */
  holder_uncertain: boolean;
  date: string;
  culture: string;
  period: string;
  findspot: string;
  medium: string;
  dimensions: string;
  description: string;
  credit: string;
  basis: "catalog-crosswalk" | "source-stated" | "term-match" | "none";
  basis_label: string;
  people: string[];
  places: string[];
  source_url: string;
  record_url: string;
  licence: string;
  catalogue: CatalogueRow[];
  photo?: MuseumPhoto;
  why?: string;
}

export interface MuseumTotals {
  records: number;
  listed: number;
  photographs: number;
  catalogue_rows: number;
  with_findspot: number;
  with_date: number;
}

export interface Museum {
  schema: string;
  slug: string;
  name: string;
  place: string;
  kind: string;
  group: MuseumGroup;
  state: MuseumState;
  emblem: string;
  lead: string;
  note: string;
  why_coming_soon: string;
  totals: MuseumTotals;
  recorded_as: string[];
  objects: MuseumObject[];
}

export interface MuseumCard {
  slug: string;
  name: string;
  place: string;
  kind: string;
  group: MuseumGroup;
  state: MuseumState;
  emblem: string;
  lead: string;
  records: number;
  listed: number;
  photographs: number;
  catalogue_rows: number;
  thumb: string;
}

export interface MuseumIndex {
  schema: string;
  generated: string;
  corpus_sha256: string;
  counts: {
    cards: number;
    records_in_corpus: number;
    catalogue_rows_matched: number;
    catalogue_rows: number;
    photographs: number;
    objects_with_catalogue_row: number;
    institutions_recorded: number;
  };
  cards: MuseumCard[];
  other_holders: { name: string; records: number }[];
}

/** A slug safe to put in a data path. The index is still the authority for which ones exist. */
export const isMuseumSlug = (slug: string): boolean => /^[a-z0-9-]{2,64}$/.test(slug);

export const GROUP_LABELS: Record<MuseumGroup, string> = {
  collections: "Open collections these records came from",
  holders: "Institutions these records name as the holder",
  "coming-soon": "Not yet held",
};

export const GROUP_LEADS: Record<MuseumGroup, string> = {
  collections:
    "Eight museums, archives and catalogues that publish their records openly. Everything on this page was fetched from one of them.",
  holders:
    "Where the objects themselves are. Most of these institutions publish nothing openly — they are named as the holder inside records from the collections above.",
  "coming-soon":
    "A museum we hold nothing from. The card says why, because the reason is almost never that the objects are not there.",
};

/** The reader is told how a biblical link was made, every time, in the words the corpus uses. */
export const BASIS_TONE: Record<MuseumObject["basis"], string> = {
  "catalog-crosswalk": "audited",
  "source-stated": "stated",
  "term-match": "search hit",
  none: "no link",
};

/** What sort of thing an object is, in the order the page lists them. No source records this, so it is
 * read from the title and medium, then the description: the first rule that matches wins, which is why
 * a cuneiform cylinder "inscription of Esarhaddon" is a tablet and a stater showing a tablet is a coin. */
export const OBJECT_KINDS = [
  ["tablets", "Tablets & cuneiform"],
  ["manuscripts", "Manuscripts & papyri"],
  ["inscriptions", "Inscriptions & ostraca"],
  ["sculpture", "Sculpture & reliefs"],
  ["seals", "Seals & sealings"],
  ["coins", "Coins"],
  ["amulets", "Amulets & jewellery"],
  ["vessels", "Vessels & pottery"],
  ["paintings", "Painted copies"],
  ["buildings", "Buildings & sites"],
  ["other", "Other objects"],
] as const;
export type ObjectKind = (typeof OBJECT_KINDS)[number][0];

const BIBLE_BOOK =
  /^(genesis|exodus|leviticus|numbers|deuteronomy|joshua|judges|ruth|samuel|kings|chronicles|ezra|nehemiah|esther|job|psalms?|proverbs|ecclesiastes|isaiah|jeremiah|ezekiel|daniel|hosea|matthew|mark|luke|john|acts|romans|corinthians|hebrews|revelation)\b/;
const KIND_RULES: [ObjectKind, RegExp][] = [
  ["coins", /\b(coins?|stater|aureus|denarius|drachm|tetradrachm|didrachm|shekel|prutah|sestertius|dupondius|obol)\b/],
  ["seals", /\b(seals?|bullae?|sealings?|scarabs?|scaraboid)\b/],
  ["paintings", /\b(tempera|watercolou?r|facsimile)\b/],
  ["manuscripts", /\b(papyr\w*|parchment|vellum|scrolls?|codex|manuscripts?|folios?|papers)\b/],
  ["tablets", /\b(cuneiform|tablets?|clay|cylinder|prism|letters|chronicle|epic|myth)\b/],
  ["inscriptions", /\b(inscriptions?|inscribed|ostrac\w*|stele|stela|obelisk|monoliths?)\b/],
  ["sculpture", /\b(reliefs?|reliëf|statue\w*|figur\w*|bust|sculpt\w*|sphinx|lamassu|portal|head)\b/],
  ["amulets", /\b(amulets?|shawabty|ushabti|rings?|beads?|necklace|earrings?|pendant|cameo|inlay|jewel\w*)\b/],
  ["vessels", /\b(jars?|vessels?|bowls?|cups?|ossuary|lamps?|pottery|ceramic|vase|flask|jug|aryballos)\b/],
  ["buildings", /\b(archaeological site|locality|temple|palace|hall|tile|doorjamb|column|shipwreck|boat)\b/],
];

export function objectKind(object: MuseumObject): ObjectKind {
  const title = `${object.title} ${object.medium}`.toLowerCase();
  if (BIBLE_BOOK.test(object.title.toLowerCase())) return "manuscripts";
  for (const text of [title, object.description.slice(0, 200).toLowerCase()]) {
    const rule = KIND_RULES.find(([, pattern]) => pattern.test(text));
    if (rule) return rule[0];
  }
  // The cuneiform corpora file a text under its edition number alone, "SAA 19 064".
  return /cdli|oracc/.test(object.source_url + object.record_url) ? "tablets" : "other";
}

export function objectSubtitle(object: MuseumObject): string {
  return [object.date, object.culture || object.period, object.medium].filter(Boolean).join(" · ");
}

/**
 * Up to three initials for an institution with no drawing of its own, so its emblem still carries a
 * mark that is unmistakably its. The filler words are dropped because almost every name here
 * contains "the", "museum" or "of", and three M's tell the reader nothing.
 */
export function initials(name: string): string {
  const skip = new Set(["the", "of", "and", "for", "a", "de", "du", "van", "der", "nationale", "museum", "museums"]);
  const words = name
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .split(/\s+/)
    .filter((word) => word && !skip.has(word.toLowerCase()));
  const source = words.length ? words : name.split(/\s+/).filter(Boolean);
  return source
    .slice(0, 3)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}
