/**
 * The four letter pages (Study → Letters): one JSON file per group in this folder, generated from the sourced
 * research dossiers in BibleProject/Research/Letters/. Every claim carries its verses and/or its citations.
 *
 * A Span is [first verse, last verse] as verse ids: book * 1_000_000 + chapter * 1_000 + verse, with books numbered
 * Genesis = 1 … Malachi = 39, Matthew = 40 … Revelation = 66 (e.g. Heb 11:1 = 58011001). Tests check every span
 * against the site's KJV.
 */
export type Span = [number, number];

/** A source the page cites. Public domain only (see Research/Letters/README.md). */
export interface Citation {
  id: string;
  author: string;
  title: string;
  year: string;
  where?: string; // section / page
  url: string;
}

/** A sentence in our own words, backed by verses and/or citations. */
export interface Claim {
  text: string;
  refs?: Span[];
  cites?: string[]; // Citation ids
}

export interface KeyWord {
  greek: string; // e.g. "κρείττων"
  translit: string; // e.g. "kreittōn"
  strongs: string; // e.g. "G2909"
  gloss: string; // e.g. "better"
  count: number; // the dossier's checked figure for this letter
  /** Optional count per chapter, chapter 1 first, for "where the theme lives" strips. */
  byChapter?: number[];
  note?: string;
}

export interface Named {
  name: string;
  refs: Span[];
  note?: string;
  /** People only: id in data/study/people.json (STEP Bible TIPNR), for the person panel. */
  personId?: string;
  /** Places only: id in data/places.json, so it can go on the map. */
  placeId?: string;
  /** Places only: tagged on a verse that does not name it. */
  implied?: boolean;
}

export interface OtQuote {
  at: Span; // where the letter quotes
  from: Span; // the Old Testament passage
  note?: string; // e.g. "follows the Greek Old Testament"
}

export interface OutlinePart {
  title: string; // our own words
  span: Span;
  kind?: string; // optional tag, e.g. "teaching" | "warning" | "encouragement"
}

export interface Letter {
  code: string; // USFM, e.g. "HEB"
  name: string; // "Hebrews"
  verses: number;
  greekWords?: number;
  author: Claim;
  recipients: Claim;
  writtenFrom: Claim;
  date: Claim & { from?: number; to?: number }; // AD range as numbers when the sources give one
  occasion: Claim;
  themes: Claim[];
  keyVerses: { span: Span; why: string }[];
  outline: OutlinePart[];
  words: KeyWord[];
  people: Named[];
  places: Named[];
  otQuotes: OtQuote[];
}

/** One answer to a disputed question, with who held it. No verdicts. */
export interface View {
  label: string;
  holders: string;
  argument: Claim;
}

export interface OpenQuestion {
  id: string;
  question: string;
  letters: string[]; // codes it concerns
  views: View[];
}

export interface CanonEvent {
  year: number; // approximate year AD
  label: string; // e.g. "Muratorian list"
  who: string;
  /** Status per letter code at this witness. */
  status: Record<string, "used" | "doubted" | "accepted" | "omitted">;
  claim: Claim;
}

/** Two texts set side by side: Ephesians ↔ Colossians, Jude ↔ 2 Peter, James ↔ Matthew 5–7, 1 John ↔ John. */
export interface Parallel {
  id: string;
  title: string;
  left: { label: string; span: Span }; // the whole text on each side, for the axis
  right: { label: string; span: Span };
  pairs: { left: Span; right: Span; note?: string; kind?: string; weight?: number }[];
  claim: Claim; // what the parallel shows, and whose list it is
}

export interface TimelineEvent {
  label: string;
  from: number; // year (AD; negative for BC) or a sort key when `axis` is not years
  to?: number;
  refs?: Span[];
  cites?: string[];
  letter?: string; // letter code placed at this point
  kind?: string;
}

export interface Timeline {
  id: string;
  title: string;
  axis: "years" | "story"; // "story" = ordered by the biblical narrative, not dated
  events: TimelineEvent[];
  claim: Claim;
}

export interface MapLayer {
  id: string;
  title: string;
  /** Ordered stops (a route) or unordered pins. placeId refers to data/places.json. */
  route?: boolean;
  stops: { name: string; placeId: string; refs?: Span[]; note?: string; letter?: string }[];
  /** For routes the sources date (AD), shown while the journey plays. */
  years?: [number, number];
  claim: Claim;
}

export interface Network {
  id: string;
  title: string;
  nodes: { id: string; label: string; group?: string; refs?: Span[]; note?: string; personId?: string }[];
  edges: { from: string; to: string; label?: string; refs?: Span[] }[];
  claim: Claim;
}

/** A source → target flow, e.g. Psalms → Hebrews 1. */
export interface Flow {
  id: string;
  title: string;
  links: { source: string; target: string; value: number; refs?: Span[] }[];
  claim: Claim;
}

export interface Ladder {
  id: string;
  title: string;
  steps: { label: string; better: string; refs: Span[]; note?: string }[];
  claim: Claim;
}

export interface LetterGroup {
  id: "paul-letters" | "hebrews" | "general-letters" | "john-letters";
  title: string;
  tagline: string; // one sentence
  intro: Claim[]; // 2–4 short paragraphs
  color: string; // a site section colour token, e.g. "epistles"
  letters: Letter[];
  questions: OpenQuestion[];
  canon: CanonEvent[];
  parallels: Parallel[];
  timelines: Timeline[];
  maps: MapLayer[];
  networks: Network[];
  flows: Flow[];
  ladders: Ladder[];
  /** Group-wide groupings, e.g. Paul's early / major / prison / pastoral letters. */
  groupings?: { label: string; letters: string[]; claim: Claim }[];
  citations: Citation[];
}

/**
 * The opening of the Letters study, shown below the four cards before one is chosen: what the 21 letters share.
 * Charts that compare letters (dates, sizes, words, destinations, Old Testament sources) are computed on the page from
 * the four group files; this file holds what only an overview can say. Written from Research/Letters/overview.md.
 */
export interface LettersOverview {
  title: string;
  tagline: string;
  intro: Claim[];
  /** The parts of an ancient letter, as the New Testament letters use them. */
  letterForm: { part: string; claim: Claim; examples: Span[] }[];
  /** Named secretaries, carriers and co-senders. letter = USFM code. */
  hands: { name: string; role: "secretary" | "carrier" | "co-sender" | "own-hand"; letter: string; refs: Span[]; note?: string; personId?: string }[];
  /** Where a letter mentions another letter (2 Pet 3:15–16 on Paul's letters, Col 4:16, 1 Cor 5:9 …). */
  letterLinks: { from: string; to: string; label: string; claim: Claim }[];
  /** People who appear in more than one group of letters. */
  sharedPeople: { name: string; letters: string[]; claim: Claim; personId?: string }[];
  /** Themes the groups share, each with the letters that carry it. */
  themes: { title: string; letters: string[]; claim: Claim }[];
  /** How the letters came to be gathered and ordered. */
  collection: Claim[];
  questions: OpenQuestion[];
  /** Reception of the whole collection; status keyed by letter code (any of the 21). */
  canon: CanonEvent[];
  citations: Citation[];
}
