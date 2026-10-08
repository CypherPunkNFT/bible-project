// The shape of the two Teachers subpages' data, written by scripts/build-teacher-pages.ts:
// people.json (Preachers & authors) and scholars.json (Scholars). Short keys keep the files small.

/** [x, y] in a map view's own pixels. */
export type Point = [number, number];
/** A map outline, already projected: the land as one SVG path, and every place that falls inside the view. */
export interface MapView { width: number; height: number; land: string; places: Record<string, Point> }

export interface Book { code: string; name: string; section: string; chapters: number[] }
/** A work with a main Bible text: title, genre, reference, verse id (book*1e6 + chapter*1e3 + verse), date, where to read it. */
export interface PassageWork { t: string; g: string; r: string; v: number; d: string | null; u: string | null }
export interface Sermon { t: string; r: string; v: number; d: string | null; u: string | null }
export interface KnownWork { t: string; y: number; inLibrary: boolean; u: string | null }
export interface NotableWork { t: string; g: string; s: string | null }
/** [place, lat, lon, year they arrived]; the first is the birthplace unless birthplaceKnown is false. */
export type Place = [string, number, number, number];

export interface Person {
  id: string;
  name: string;
  short: string;
  traditions: string[];
  born: number;
  died: number | null;
  circa?: boolean;
  birthplaceKnown?: boolean;
  line: string;
  places: Place[];
  works: number;
  genres: Record<string, number>;
  notable: NotableWork[];
  known: KnownWork[];
  passages: PassageWork[];
  books: number[];
  sermons: Sermon[];
}
export interface PersonLink { from: string; to: string; note: string }
export interface PeopleData {
  about: string;
  books: Book[];
  people: Person[];
  links: PersonLink[];
  /** "book:chapter" → { personId: number of works taking that chapter as their main text }. */
  chapters: Record<string, Record<string, number>>;
  views: Record<"world" | "atlantic" | "europe" | "america", MapView>;
}

export type Faith = "jewish" | "roman" | "early" | "catholic" | "protestant" | "unrecorded";
export type Field = "history" | "texts" | "places" | "reference" | "theology";
export type Era = "ancient" | "medieval" | "early-modern" | "modern";
export interface Scholar {
  id: string;
  name: string;
  short: string;
  born: number;
  died: number;
  circa?: boolean;
  faith: Faith;
  field: Field;
  era: Era;
  place: [string, number, number];
  line: string;
  works: [string, number][];
  /** How this site uses their work: "in-use" by a live feature, or "held" in the library for a planned one. */
  site: { status: "in-use" | "held"; note: string } | null;
  /** How many content files in each site area name them (a rough text match: a relative weight only). */
  mentions: Record<string, number>;
}
export interface Find { id: string; name: string; where: [string, number, number]; year: number; by: string[]; line: string }
export interface ScholarsData {
  about: string;
  faiths: Record<Faith, string>;
  fields: Record<Field, string>;
  eras: Record<Era, string>;
  scholars: Scholar[];
  finds: Find[];
  chain: { about: string; steps: [string, string][] };
  views: Record<"world" | "med" | "holyland", { width: number; height: number; land: string; points: Record<string, Point> }>;
}
