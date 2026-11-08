// Life-event verse packs (docs/features/life-event-packs/design.md): the shape of a pack, and the one helper the pack
// files use to name a passage. Imports nothing through "@/", so the build scripts (outside Vite) can read the packs.
// Verse wording is never stored here: a passage is verse ids, and the words come from the site's Berean files.

export type PassageRole = "reading" | "card" | "blessing";
export type LifeEventFamily = "love" | "new-life" | "faith" | "growing";

export interface LifeEventPassage {
  /** First verse id, BBCCCVVV. */
  from: number;
  /** Last verse id, same book; absent for a single verse. */
  to?: number;
  /** Verses the Berean omits inside the range (Acts 8:37). */
  skip?: number[];
  /** An exact excerpt standing for the first or last verse of the passage; `mark` is "a" when it opens the verse, "b" when it closes it. */
  part?: { verse: number; text: string; mark: "a" | "b" };
  role: PassageRole;
  /** Why it fits this event, in one line. */
  note: string;
  /** Honest context, for verses often taken beyond what they say. */
  context?: string;
  /** Optional sub-heading inside its role section, e.g. "For deacons". */
  group?: string;
}

export interface LifeEventCard {
  /** Default heading on the card front, 50 characters or fewer. */
  heading: string;
  /** Default line for the inside of the folded card when the visitor writes no message. */
  inside: string;
  names: 0 | 1 | 2;
  date: boolean;
  ornament: string;
}

export interface LifeEvent {
  slug: string;
  family: LifeEventFamily;
  /** The h1, the search phrase in title case. */
  heading: string;
  /** For the hub and links. */
  short: string;
  /** 60–160 words; the page's search description, so its first sentence names the event. */
  intro: string;
  /** A short explainer for packs that need one (dedication, adoption, ordination). */
  explainer?: { title: string; text: string };
  passages: LifeEventPassage[];
  card: LifeEventCard;
  /** Topic pages to link to; each slug and title must match data/topics/index.json. */
  topics: { slug: string; title: string }[];
  /** Sibling pack slugs. */
  related: string[];
}

/** Book code -> book number, as in data/catalog.json (a test checks the two agree). */
export const BOOK_NUMBERS: Record<string, number> = Object.fromEntries(
  ("GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA " +
    "JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE " +
    "1JN 2JN 3JN JUD REV").split(" ").map((code, index) => [code, index + 1]),
);

const REFERENCE = /^([1-3]?[A-Z]{2,3}) (\d+):(\d+)(?:-(\d+))?([ab])?$/;

interface PassageExtras { context?: string; group?: string; part?: string; skip?: number[] }

/**
 * A passage from a short reference: "SNG 2:10-13", "ECC 4:12b" or "1CO 13:4-8a". A trailing "a" or "b" marks the last
 * verse as partial, and `part` gives its exact Berean words; `skip` lists verse numbers the Berean omits.
 */
export function p(reference: string, role: PassageRole, note: string, extras: PassageExtras = {}): LifeEventPassage {
  const match = REFERENCE.exec(reference);
  const book = match ? BOOK_NUMBERS[match[1]] : undefined;
  if (!match || !book) throw new Error(`life-events: cannot read the reference "${reference}" (expected e.g. "SNG 2:10-13")`);
  const base = book * 1_000_000 + Number(match[2]) * 1000;
  const from = base + Number(match[3]);
  const to = match[4] ? base + Number(match[4]) : undefined;
  if (Boolean(match[5]) !== Boolean(extras.part)) throw new Error(`life-events: "${reference}" needs its excerpt and its "a"/"b" mark together`);
  const passage: LifeEventPassage = { from, role, note };
  if (to !== undefined) passage.to = to;
  if (extras.part) passage.part = { verse: to ?? from, text: extras.part, mark: match[5] as "a" | "b" };
  if (extras.skip) passage.skip = extras.skip.map((verse) => base + verse);
  if (extras.context) passage.context = extras.context;
  if (extras.group) passage.group = extras.group;
  return passage;
}
