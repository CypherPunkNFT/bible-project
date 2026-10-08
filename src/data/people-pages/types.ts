/**
 * Ruler pages (/people/:id/rule) and apostle pages (/people/:id/mission): one JSON file per research group in this
 * folder, generated from the sourced dossiers in BibleProject/Research/People/. The rules for every field are in
 * Research/People/METHODOLOGY.md; the layout in Research/People/PRESENTATION.md.
 *
 * Spans are [first verse, last verse] as verse ids (book * 1_000_000 + chapter * 1_000 + verse; Genesis = 1 …
 * Revelation = 66), as on the Letters pages. scripts/check-people-pages.py checks every span against the site's KJV,
 * every person id against data/study/people, every place id against data/places.json, and every citation.
 */
import type { Span, Citation } from "../letters/types";

export type { Span, Citation };

/**
 * Where a claim's evidence comes from (METHODOLOGY.md §2). "text" = our own count or summary of the Bible text.
 * "scripture" claims must carry refs; every other layer must carry cites.
 */
export type Layer = "scripture" | "text" | "ancient-record" | "early-church" | "tradition" | "scholars";

/** A sentence in our own words, labelled by its evidence and backed by verses and/or citations. */
export interface Claim {
  text: string;
  layer: Layer;
  refs?: Span[];
  cites?: string[];
}

/** A word-for-word KJV quotation. */
export interface Quote {
  text: string;
  span: Span;
}

/** One answer to a disputed question, with who holds it. No verdicts. */
export interface View {
  label: string;
  holders: string;
  argument: Claim;
}

export interface OpenQuestion {
  id: string;
  question: string;
  views: View[];
}

export interface PlaceRef {
  name: string;
  placeId?: string; // id in data/places.json
  refs?: Span[];
  note?: string;
  /** Known only from tradition: drawn as a dashed pin. */
  tradition?: boolean;
}

export interface PersonRef {
  name: string;
  personId?: string; // id in data/study/people
  note?: string;
}

// ─── Rulers ──────────────────────────────────────────────────────────────────

export type RulerKind = "leader" | "judge" | "king" | "queen" | "foreign" | "governor" | "herod" | "roman";
/** The lane on the succession strip. */
export type Realm = "tribes" | "united" | "israel" | "judah" | "egypt" | "aram" | "assyria" | "babylon" | "persia" | "rome" | "other";

/** One dating system's dates for a reign. BC years are positive numbers; "c." handled by `approx`. */
export interface ReignDates {
  system: "bible" | "thiele-mcfall" | "albright" | "galil" | "ussher" | "other";
  label: string; // e.g. "Thiele, revised by McFall"
  from?: number; // BC
  to?: number; // BC
  approx?: boolean;
  /** Co-regency or overlap, BC. */
  coregency?: { from: number; to: number; with: string };
  note?: string;
  cites?: string[];
}

/** Scripture's standard record of a king, as one book gives it (METHODOLOGY.md §4.1). Absent fields = not given. */
export interface RegnalRecord {
  book: "kings" | "chronicles" | "samuel" | "other";
  synchronism?: Quote; // "In the twentieth year of Jeroboam king of Israel …"
  age?: { years: number; span: Span }; // age at accession
  length?: { years: number; months?: number; days?: number; span: Span };
  capital?: { name: string; span: Span };
  mother?: { name: string; personId?: string; span: Span };
  verdict?: Quote;
  comparison?: Quote; // "as did David his father" / "walked in the way of Jeroboam"
  death?: Claim;
  burial?: Quote;
  sourcesCited?: Quote; // "the rest of the acts … are they not written in the book of the chronicles …"
}

export type EventKind = "battle" | "alliance" | "building" | "reform" | "worship" | "personal" | "prophecy" | "other";

export interface ReignEvent {
  label: string; // short, our own words
  kind: EventKind;
  /** Year of the reign when the Bible gives one (1 = first year). Undated events go in the "undated" tray. */
  year?: number;
  claim: Claim;
  placeId?: string;
}

export interface Ruler {
  id: string; // primary person id
  personIds?: string[]; // other records for the same person (e.g. Azariah/Uzziah)
  name: string;
  otherNames?: string[];
  kind: RulerKind;
  realm: Realm;
  /** "King of Judah", "Judge of Israel", "Prophetess and judge". */
  title: string;
  /** One line under the name in the hero, our own words, e.g. "Forty-one years in Jerusalem." */
  tagline: string;
  /** Position in the realm's line, 1-based, for the succession strip and the verdict row. */
  order: number;
  predecessor?: string; // ruler id
  successor?: string; // ruler id
  /** Dynasty or house, e.g. "House of David", "House of Omri". */
  house?: string;
  tribe?: string;
  capital?: PlaceRef;
  /** Identifications the page relies on (e.g. Azariah = Uzziah), each with who holds it. */
  identifications?: Claim[];
  /** Scripture's record, one entry per book that gives one (Kings and Chronicles shown side by side, never merged). */
  records: RegnalRecord[];
  /** Length as the text gives it, for the hero. */
  reign: { years?: number; months?: number; days?: number; text: string; refs?: Span[] };
  dates: ReignDates[];
  /** Short verdict for the hero and the verdict row. */
  verdictTone: "right" | "evil" | "mixed" | "none";
  /** The verdict card: exceptions ("but the high places were not removed") and what Chronicles adds. */
  verdictNotes?: Claim[];
  /** For rulers with no regnal formula (judges, foreign rulers): what Scripture says of them. */
  scriptureSays?: Claim[];
  /** Judges: the cycle (sin → oppressor → cry → deliverer → rest). */
  cycle?: {
    sin?: Claim;
    oppressor?: { name: string; personId?: string; years?: number; claim: Claim };
    cry?: Claim;
    deliverance: Claim;
    rest?: { years: number; span: Span };
    judged?: { years: number; span: Span };
  };
  /** Saul, David, Solomon (and Jehu, Joash…): how they came to the throne. */
  accession?: Claim[];
  /** Cross-dating verses with the other kingdom. */
  synchronisms?: { quote: Quote; otherRulerId: string }[];
  events: ReignEvent[];
  /** "What the nation did" lenses. */
  nation: { worship: Claim[]; building: Claim[]; alliances: Claim[]; people: Claim[] };
  prophets: { person: PersonRef; claim: Claim; quote?: Quote }[];
  /** Foreign powers and rulers of the time. */
  worldStage: { power: string; rulers: PersonRef[]; claim: Claim }[];
  /** Records outside the Bible that name this ruler or the events (inscriptions, annals). */
  outside: { name: string; date: string; claim: Claim }[];
  /** Where Kings and Chronicles (or Samuel and Chronicles) tell it differently. */
  twoAccounts: { topic: string; first: Claim; second: Claim }[];
  questions: OpenQuestion[];
  /** What Scripture does not say, stated plainly. */
  notSaid: string[];
  places: PlaceRef[];
  /** Every passage about the reign, in order. */
  passages: Span[];
}

export interface RulerGroup {
  id: string; // file name without .json
  title: string;
  realm: Realm;
  intro: Claim[];
  rulers: Ruler[];
  citations: Citation[];
}

// ─── Apostles ────────────────────────────────────────────────────────────────

export interface Apostle {
  id: string; // primary person id
  personIds?: string[]; // other records (e.g. Nathanael beside Bartholomew)
  name: string;
  otherNames: string[];
  /** "One of the Twelve", "Chosen in place of Judas", "Apostle to the Gentiles". */
  title: string;
  tagline: string;
  order: number; // display order on the Apostles guide
  /** Hero facts; any of them may be absent when Scripture is silent. */
  home?: Claim;
  trade?: Claim;
  family: Claim[];
  identifications: Claim[];
  /** Position in each list of the Twelve (Matthew 10, Mark 3, Luke 6, Acts 1). Absent for Paul. */
  lists?: { book: "MAT" | "MRK" | "LUK" | "ACT"; position: number; name: string; span: Span }[];
  /** The calling, one entry per account (chips on the page). */
  calling: { label: string; quote: Quote; placeId?: string; claim?: Claim }[];
  /** Named moments with Jesus; harmony = section number ("n") in data/study/harmony.json when the event is there. */
  moments: { label: string; refs: Span[]; harmony?: string }[];
  /** After the Gospels: Acts and the letters, Scripture only. */
  acts: Claim[];
  places: PlaceRef[];
  companions: { person: PersonRef; claim: Claim }[];
  /** How the story ends: Scripture beside tradition, never blended. */
  ending: { scripture: Claim[]; tradition: (Claim & { who: string; when: string })[] };
  /** Links only, never retold: Letters study group ids or reader books. */
  writings: { title: string; letters?: "paul-letters" | "hebrews" | "general-letters" | "john-letters"; book?: string }[];
  questions: OpenQuestion[];
  notSaid: string[];
  passages: Span[];
}

export interface ApostleGroup {
  id: string;
  title: string;
  intro: Claim[];
  apostles: Apostle[];
  citations: Citation[];
}

// ─── Prophets ("the word": /people/:id/word) ─────────────────────────────────

/** What Scripture calls them: a prophet or prophetess, a seer, a singer who "prophesied with harps" (1 Chr 25:1),
 *  a prophet Scripture says was not sent, or a New Testament prophet. */
export type ProphetKind = "prophet" | "prophetess" | "seer" | "singer" | "false" | "nt";
/** The era band on Prophets through time (the same bands as the prophets guide). */
export type ProphetEra = "wilderness" | "judges" | "united" | "divided" | "exile" | "nt";

export interface Prophet {
  id: string; // primary person id
  personIds?: string[];
  name: string;
  otherNames?: string[];
  kind: ProphetKind;
  era: ProphetEra;
  /** "Prophet in Israel in the days of Ahab", "A prophet the LORD had not sent (Jeremiah 28:15)". */
  title: string;
  tagline: string;
  order: number; // story order within the era
  /** The rulers in whose days they spoke, each with what passed between them (links to rule pages when they exist). */
  kings: { person: PersonRef; claim: Claim; quote?: Quote }[];
  /** How the word first came: one entry per account (Isaiah 6, Jeremiah 1, Ezekiel 1–3, Amos 7:14–15…). May be []. */
  call: { label: string; quote?: Quote; claim: Claim; placeId?: string }[];
  /** How the word came and was given: "the word of the LORD came", visions, dreams, sign-acts, writing, song. */
  how: Claim[];
  /** The message in its main themes, our words, each with its key verses; quotations word for word. */
  message: { theme: string; claim: Claim; quotes?: Quote[] }[];
  /** Words spoken to a named person, people or nation ("Thou art the man"). */
  words: { to: string; person?: PersonRef; placeId?: string; quote: Quote; claim?: Claim }[];
  /** Signs, wonders and sign-acts as the text tells them. */
  signs: { label: string; kind: "wonder" | "sign-act" | "vision" | "other"; claim: Claim; placeId?: string }[];
  /** Only where Scripture itself says a word came to pass ("according to the word of the LORD which he spake by…"),
   *  or the New Testament says it was fulfilled. Never our own verdict. */
  fulfilment: { word: Claim; reported: Claim }[];
  /** Books that bear their name (writing prophets). Links to the reader; nothing retold beyond the outline. */
  books: {
    code: string; // USFM, e.g. "ISA"
    title: string;
    claim: Claim; // what the book contains
    outline: { title: string; span: Span }[];
    /** Where the New Testament quotes the book. */
    quotedInNT: { at: Span; from: Span; note?: string }[];
  }[];
  /** Disciples, servants, scribes and opponents (Elisha, Gehazi, Baruch, Pashur, Amaziah of Bethel…). */
  companions: { person: PersonRef; claim: Claim }[];
  places: PlaceRef[];
  /** How the story ends: Scripture beside tradition, never blended (as on the apostle pages). */
  ending: { scripture: Claim[]; tradition: (Claim & { who: string; when: string })[] };
  questions: OpenQuestion[];
  notSaid: string[];
  passages: Span[];
}

export interface ProphetGroup {
  id: string;
  title: string;
  era: ProphetEra;
  intro: Claim[];
  prophets: Prophet[];
  citations: Citation[];
}
