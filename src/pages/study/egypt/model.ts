// Egypt beside Israel's data and its small rules: the research record, the generated verses and letters, the drawings' geometry, the
// Berean reader link, and the address values it accepts. Everything the address asks for is looked up in a Map, so an unknown value
// falls back to the default, and nothing here throws while the page loads.
import dossier from "../../../../content/academic-research/32-egypt-beside-israel.json";
import generated from "./egypt-data.json";

export type Verse = { code: string; chapter: number; verse: number; text: string };
export type Judge = { id: string; name: string; count: string; who: string; note: string; source: string };
export type Parallel = { id: string; prov: string; firstVerse: number; lastVerse: number; column: number; line: number; where: string; chapter: number; judges: string[];
  griffith: string; griffithRef: string; verses: string[]; behind?: { egypt: string; israel: string }; evidence: string; inference: string; limit: string };
export type Theme = { id: string; num: number; name: string; strophe: number; psalmAt: number; verses: string[]; hymn: string; note: string };
export type Parting = { id: string; head: string; hymn: string; psalm: string; verses: string[]; note: string };
export type City = { id: string; name: string; provenience: string; lon: number; lat: number; biblical: string; verse: string; note: string; letter?: string };
export type Passage = { id: string; ea: string; pid: string; from: string; title: string; lines: string[]; expect: string[]; plain: string; beside: { verse: string; note: string }[]; limit: string };
export type Cognate = { id: string; letter: string; line: string; cuneiform: string; gloss: string; hebrew: string; translit: string; strongs: string; verse: string; english: string };
export type Explanation = { id: string; name: string; tag: string; held: string; forIt: string; against: string; wouldShow: string };
export type Row = { id: string; name: string; start: number; end: number; ranges?: [number, number][]; open?: boolean; note: string; kind: string };
export type Picture = { id: string; src: string; alt: string; credit: string; licence: string; licenceUrl: string; href: string; retrieved: string; width: number; height: number };
export type Source = { id: string; title: string; url: string; kind: string; status: string; answers: string; read: string };
export type Claim = { id: string; claim: string; head: string; evidence: string; inference: string; limit: string; verses: string[]; sources: string[];
  test: { question: string; options: { text: string; right: boolean; why: string }[] } };
export type Word = { t: string; g: string; d?: number; l?: string };

export const D = dossier as unknown as {
  outcomes: string[]; question: string; boundaries: { in: string; out: string[] }; judges: Judge[]; countsUpward: string; papyrus: { columns: number; chapters: [number, number][] };
  parallels: Parallel[]; seamFacts: { head: string; text: string }[]; themes: Theme[]; strophes: string[]; partings: Parting[]; psalmViews: { who: string; held: string }[];
  letters: { lead: string; countNote: string; cities: City[]; passages: Passage[]; cognates: Cognate[] }; explanations: Explanation[];
  timeline: { from: number; to: number; rows: Row[]; undated: string }; stance: { head: string; scripture: string; confession: string; confessionSource: string; body: string; names: string; verses: string[] };
  claims: Claim[]; confusedWords: { word: string; note: string }[]; reach: string[]; sources: Source[]; pictures: Picture[]; verses: { label: string }[];
};
export const EG = generated as unknown as {
  recordHash: string; verses: Record<string, Verse>; passages: Record<string, { label: string; words: Word[] }[]>;
  letters: { catalogue: number; withText: number; clientLetters: number; unplaced: number; cities: Record<string, { letters: number; writers: [string, number][] }>;
    canaanite: { words: number; letters: number; egyptianWords: number }; habiru: { letters: number; spelled: string[]; spelledFrom: string[]; signsOnly: number; fromByblos: number } };
};

export const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
export const DEFAULT_JUDGE = "usual";
export const DEFAULT_THEME = "night";
export const DEFAULT_CITY = "jerusalem";
export const DEFAULT_LETTER = "ea288";
export const DEFAULT_EXPLANATION = "egypt";

export const sourceById = new Map(D.sources.map((s) => [s.id, s]));
export const pictureById = new Map(D.pictures.map((p) => [p.id, p]));
export const verseByLabel = new Map(Object.entries(EG.verses));
export const parallelById = new Map(D.parallels.map((p) => [p.id, p]));
const judgeById = new Map(D.judges.map((j) => [j.id, j]));
const themeById = new Map(D.themes.map((t) => [t.id, t]));
const cityById = new Map(D.letters.cities.map((c) => [c.id, c]));
const passageById = new Map(D.letters.passages.map((p) => [p.id, p]));
const explanationById = new Map(D.explanations.map((e) => [e.id, e]));
const openable = new Map(D.parallels.map((p) => [`par:${p.id}`, p]));

/** Every verse on this page opens in the Berean, whatever the reader last read (study rule 3). */
export function readerHref(code: string, chapter: number, verse: number): string {
  return `/read/bsb/${code}/${chapter}?hl=${verse}-${verse}`;
}

function pick<T>(map: Map<string, T>, value: string | null, fallback: string): T {
  return (value ? map.get(value) : undefined) ?? map.get(fallback)!;
}

export const findJudge = (value: string | null): Judge => pick(judgeById, value, DEFAULT_JUDGE);
export const findTheme = (value: string | null): Theme => pick(themeById, value, DEFAULT_THEME);
export const findCity = (value: string | null): City => pick(cityById, value, DEFAULT_CITY);
export const findPassage = (value: string | null): Passage => pick(passageById, value, DEFAULT_LETTER);
export const findExplanation = (value: string | null): Explanation => pick(explanationById, value, DEFAULT_EXPLANATION);

export function findOpened(value: string | null): Parallel | null {
  return (value ? openable.get(value) : undefined) ?? null;
}

/** What was read of a source, in the words the citation shows. */
export function readingTag(status: string): string {
  switch (status) {
    case "read": return "read";
    case "part": return "part read";
    case "second-hand": return "reported second-hand";
    default: return "located, not read";
  }
}

export const JUDGE_WORD = new Map(D.judges.map((j) => [j.id, j.name]));

// The two rulers of the seam. All positions are in the drawing's own units.
export const SEAM = { width: 360, height: 520, top: 34, bottom: 500, left: 62, right: 298 };
const PROVERBS_VERSES = 70;

/** How far down the papyrus: columns count from 1, and a column holds about twenty lines in Griffith's numbering. */
export function papyrusY(column: number, line: number): number {
  const share = (column - 1 + Math.min(line, 20) / 20) / D.papyrus.columns;
  return SEAM.top + share * (SEAM.bottom - SEAM.top);
}

/** How far down the 70 verses of Proverbs 22:17 to 24:22. Place 0 is 22:17, and the middle of a passage takes its thread. */
export function proverbsY(place: number): number {
  return SEAM.top + ((place + 0.5) / PROVERBS_VERSES) * (SEAM.bottom - SEAM.top);
}

export function threadEnds(p: Parallel): { fromY: number; toY: number } {
  return { fromY: papyrusY(p.column, p.line), toY: proverbsY((p.firstVerse + p.lastVerse) / 2) };
}

export function threadPath(p: Parallel): string {
  const { fromY, toY } = threadEnds(p), mid = (SEAM.left + SEAM.right) / 2;
  return `M${SEAM.left} ${fromY.toFixed(1)}C${mid} ${fromY.toFixed(1)} ${mid} ${toY.toFixed(1)} ${SEAM.right} ${toY.toFixed(1)}`;
}

// The two staves of the songs.
export const STAVES = { width: 360, left: 18, right: 342 };
const PSALM_VERSES = 35;

export function hymnX(strophe: number): number {
  return STAVES.left + (strophe / (D.strophes.length - 1)) * (STAVES.right - STAVES.left);
}

export function psalmX(verse: number): number {
  return STAVES.left + ((verse - 1) / (PSALM_VERSES - 1)) * (STAVES.right - STAVES.left);
}

// The schematic map: real degrees, with the coast simplified.
export const MAP = { width: 320, height: 520 };
export function mapPoint(lon: number, lat: number): [number, number] {
  return [(lon - 34.2) * 190, (34.4 - lat) * 170];
}

export const COAST: [number, number][] = [[35.82, 34.4], [35.64, 34.12], [35.48, 33.9], [35.36, 33.56], [35.19, 33.27], [35.1, 33.09], [35.07, 32.93], [34.97, 32.82], [34.89, 32.5], [34.77, 32.08], [34.63, 31.8], [34.55, 31.66], [34.33, 31.4]];

/** The dot's area grows with the number of letters, so a town with four times the letters has twice the radius. */
export function cityRadius(letters: number): number {
  return 3 + Math.sqrt(letters) * 1.15;
}

/** A place on the time chart, as a share of its width: older is further left. */
export function timeShare(year: number): number {
  const { from, to } = D.timeline;
  return (from - year) / (from - to);
}

/** Splits a word's signs into plain text, raised determinatives and lowered sign numbers, so the page sets them with real elements. */
export function signParts(text: string): { kind: "text" | "sup" | "sub"; value: string }[] {
  const parts: { kind: "text" | "sup" | "sub"; value: string }[] = [];
  const pattern = /\{([^}]*)\}|([₀-₉]+)/g;
  let at = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > at) parts.push({ kind: "text", value: text.slice(at, match.index) });
    if (match[1] !== undefined) parts.push({ kind: "sup", value: match[1] });
    else parts.push({ kind: "sub", value: [...match[2]].map((c) => String(c.charCodeAt(0) - 0x2080)).join("") });
    at = match.index + match[0].length;
  }
  if (at < text.length) parts.push({ kind: "text", value: text.slice(at) });
  return parts;
}
