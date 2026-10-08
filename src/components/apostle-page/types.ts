/**
 * The apostle pages' view data, one file per apostle in src/data/apostle-pages/, built by
 * scripts/build-apostle-pages.py from the reviewed apostle records. Verse ids are book × 1,000,000 + chapter × 1,000
 * + verse; a passage is [first, last] (or [verse]).
 */
export type Ref = number[];
export type Layer = "scripture" | "text" | "early-church" | "tradition" | "scholars" | "ancient-record" | "letters" | "story";

export interface Claim { text?: string; layer?: Layer | string; refs?: Ref[]; cites?: string[]; who?: string; when?: string }

/** One record of his life: a fact (home, trade, family), a moment with Jesus, an Acts record, or a tradition. */
export interface Entry {
  key: string;
  type: "fact" | "moment" | "act" | "trad";
  title: string;
  text?: string;
  layer?: string;
  refs: Ref[];
  cites?: string[];
  who?: string;
  when?: string;
  /** Its place in the harmony of the Gospels. */
  h?: { ord: number; n: string | number; title: string };
  i: number;
  period: number;
  icon: string;
  /** The first verse of the record that names him, else its first verse. */
  lead: number | null;
  /** Indexes into the page's places. */
  places: number[];
  /** Companions named in the record's verses: person key → up to three verse ids. */
  with: Record<string, number[]>;
}

export interface Period { n: string; title: string; sub: string; entries: string[] }
export interface Row { key: string; id: string; name: string; twelve: boolean; n: number }
export interface HeatBook { name: string; num: number; chapters: number; counts: Record<string, number>; first: Record<string, number> }
export interface AccountColumn { label: string; spans: Ref[]; mark: number | null; book: number; verses: { id: number; text: string }[] }
export interface Account { id: string; title: string; cols: AccountColumn[] }
export interface Place {
  name: string; placeId: string | null; refs: Ref[]; note: string | null; tradition: boolean; ll: [number, number] | null;
  /** On the Atlas's own projection (src/data/atlas-map.json). */
  xy: [number, number] | null;
  kind: string; from: { km: number; dir: string } | null; entries: string[];
}
export interface View { label: string; holders: string; argument: Claim }
export interface Question { id: string; group: string; q: string; full?: string; kind: "views" | "answer" | "ending" | "silent"; from: string; views?: View[] }
export interface Citation { id: string; author: string; title: string; year?: string; where?: string; url?: string }

export interface ApostleView {
  key: string; id: string; name: string; short: string; epithet: string | null;
  /** The names to mark inside verses. */
  names: string[];
  otherNames: string[]; title: string; tagline: string; story: string | null; verseCount: number;
  /** Another person file that may be the same man (Nathanael for Bartholomew). */
  alt: { id: string; name: string; heat: Record<string, HeatBook>; count: number }[];
  periods: Period[]; entries: Entry[]; rows: Row[]; heat: Record<string, HeatBook>; accounts: Account[]; places: Place[];
  lists: { book: string; position: number; name: string; span: Ref }[];
  companions: { person: { name: string; personId?: string; note?: string }; claim: Claim }[];
  ending: { scripture: Claim[]; tradition: (Claim & { who: string; when: string })[] };
  questions: { groups: { id: string; title: string; sub: string; n: number }[]; items: Question[] };
  notSaid: string[]; citations: Citation[];
  landing: { art: string; line: { v: number; t: string }; also: { v: number; t: string } | null; note: string | null };
  chapters: { n: string; period: number; title: string; slides: { entry: string; art: string; v: number | null }[] }[];
  verses: Record<string, string>;
}

/** The view data with its look-ups. */
export interface Apostle extends ApostleView {
  byKey: Record<string, Entry>;
  rowByKey: Record<string, Row>;
  scripture: Entry[];
  trad: Entry[];
  citeById: Record<string, Citation>;
}
