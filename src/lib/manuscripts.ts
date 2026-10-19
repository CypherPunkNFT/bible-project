// The Manuscripts page's data (scripts/build-manuscripts.py → data/manuscripts/collection.json). Field names are kept
// short, as the approved mock-up's data.js had them, because the file carries over five thousand records.

/** One manuscript record. Years count astronomically (0 is 1 BC). */
export interface MsRecord {
  /** Id: a Wikidata QID, an ETCBC scroll siglum or a Syriaca.org record id. */
  i: string;
  /** Name. */
  n: string;
  /** Kind (a key of KINDS) and every lane it is counted in. */
  k: string;
  L: string[];
  /** Source: Wikidata, ETCBC Dead Sea Scrolls or Syriaca.org. */
  src: "wd" | "dss" | "syr";
  /** Siglum (Gregory-Aland, Rahlfs or the scroll's). */
  g?: string;
  /** Earliest and latest year, the date as words, how it was reached, and any correction's reason. */
  e?: number;
  l?: number;
  d?: string;
  db?: string;
  why?: string;
  /** The unreadable raw date; the source's own words for a script-period date. */
  dr?: string;
  dw?: string;
  /** Which source supplied a scroll's date, and how many dated claims it was chosen from. */
  ds?: "pp" | "wc" | "wq";
  dn?: number;
  /** The catalogue's own words for its contents; the books (0–65) and how they were read; chapters per book. */
  c?: string;
  b?: number[];
  bs?: string;
  bwhy?: string;
  ch?: Record<string, number[]>;
  /** A lectionary: readings rather than books. */
  lect?: 1;
  /** The holder as the catalogue writes it, the placed holders' ids, and the shelfmark. */
  hr?: string;
  h?: string[];
  sh?: string;
  m?: string;
  /** English Wikipedia article title and revision. */
  wp?: string;
  wr?: number | string;
  /** Scrolls: find site, fragments and lines; script and language notes. */
  f?: string;
  x?: [number, number];
  sc?: string;
  la?: string;
  /** Syriaca.org record address. */
  su?: string;
  /** Picture key (images). */
  im?: string;
}

export interface MsBook { code: string; name: string; ch: number; sec: string }
export interface MsHolder { id: string; name: string; city: string; country: string; lat: number; lon: number; n: number }
export interface MsImage { w: number; h: number; src: string; file: string; page: string; lic: string; by: string; via: string | null }
export interface MsMap { w: number; h: number; lon0: number; lat1: number; lat0: number; lon1: number; cos: number; k: number; d: string[] }

export interface MsCounts {
  records: number;
  byKind: Record<string, number>;
  dated: number;
  ga: Record<"papyrus" | "majuscule" | "minuscule" | "lectionary", number>;
  gaTotal: number;
  liste: Record<"papyrus" | "majuscule" | "minuscule" | "lectionary" | "total", number>;
  lxxDated: number;
  dssBiblical: number;
  dssDated: number;
  holders: number;
  withHolder: number;
  placed: number;
  images: number;
  lectionaries: number;
}

export interface ManuscriptCollection {
  built: string;
  books: MsBook[];
  groups: { gospels: number[]; paul: number[]; catholic: number[] };
  /** Book index → the approximate editorial range of years it was written. */
  written: Record<string, [number, number]>;
  counts: MsCounts;
  holders: MsHolder[];
  images: Record<string, MsImage>;
  excluded: { n: string; why: string }[];
  map: MsMap;
  records: MsRecord[];
}
