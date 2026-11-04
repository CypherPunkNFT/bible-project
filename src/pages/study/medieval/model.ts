// The medieval church's data and its small rules: the research record, the generated verses and coast, the drawings' geometry, the Berean
// reader link, and the address values it accepts. Everything the address asks for is looked up in a Map or parsed against a pattern, so an
// unknown value falls back to the default, and nothing here throws while the page loads.
import dossier from "../../../../content/academic-research/33-the-medieval-church.json";
import generated from "./medieval-data.json";

export type Verse = { code: string; chapter: number; verse: number; text: string };
export type Field = { id: string; name: string; shape: "circle" | "diamond" | "square" | "triangle"; note: string };
export type Side = { from: number; to: number; when: string; who: string; quote: string; what?: string; source: string };
export type Pair = { id: string; link: "same" | "beside"; field: string; head: string; declared: Side; followed: Side; evidence: string; inference: string; limit: string; sources: string[] };
export type Way = { id: string; name: string; shape: "book" | "crown" | "scroll" | "blade" };
export type Station = { id: string; name: string; place: string; lon: number; lat: number; placed: boolean; from: number; to: number; when: string; way: string; writer: string; written: number; head: string; text: string; limit: string; sources: string[]; picture?: string };
export type Round = { id: string; why: string; limit: string; when: string; year: number; who: string; tilt: "pope" | "level" | "king"; head: string; text: string; sources: string[]; picture?: string; verse?: string };
export type Stand = { head: string; text: string; verse?: string; verses?: string[] };
export type Part = { id: string; n: string; name: string; text: string; does: string; answeredBy?: string; answers?: string; verse?: string };
export type LadderStep = { id: string; name: string; from: number; to: number; inferred: boolean; text: string };
export type School = { name: string; when: string; note: string };
export type Spot = { id: string; n: string; name: string; rule: string; record: string; limit: string; sources: string[]; picture?: string; stand?: string; standVerses?: string[] };
export type Claim = { id: string; claim: string; head: string; evidence: string; inference: string; limit: string; sources: string[]; test: TestItem };
export type TestItem = { question: string; options: { text: string; right: boolean; why: string }[] };
export type Source = { id: string; title: string; url: string; kind: string; status: string; answers: string; read: string };
export type Picture = { id: string; src: string; alt: string; credit: string; licence: string; licenceUrl: string; href: string; retrieved: string; width: number; height: number; record?: { href: string; label: string } };

export const D = dossier as unknown as {
  outcomes: string[]; question: string; boundaries: { in: string; out: string[] }; fields: Field[]; pairs: Pair[]; ways: Way[]; stations: Station[]; missionStand: Stand;
  rounds: Round[]; roundsNote: string; powersStand: Stand; article: { cite: string; note: string; parts: Part[] }; abelard: { text: string; quote: string; source: string };
  ladder: { note: string; steps: LadderStep[] }; schools: School[]; schoolStand: Stand; parish: { note: string; stations: Spot[] }; claims: Claim[];
  confusedWords: { word: string; note: string }[]; reach: string[]; sources: Source[]; pictures: Picture[]; verses: { label: string }[];
};
export const MV = generated as unknown as {
  recordHash: string; verses: Record<string, Verse>; coast: { width: number; height: number; lon0: number; lat1: number; x: number; y: number; paths: string[] };
};

export const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
export const DEFAULT_PAIR = "dictatus";
export const DEFAULT_STATION = "jelling";
export const DEFAULT_ROUND = "canossa";
export const DEFAULT_PART = "o1";
export const DEFAULT_SPOT = "font";
export const DEFAULT_YEAR = 1000;
export const YEAR_FROM = 500;
export const YEAR_TO = 1350;

export const sourceById = new Map(D.sources.map((s) => [s.id, s]));
export const pictureById = new Map(D.pictures.map((p) => [p.id, p]));
export const verseByLabel = new Map(Object.entries(MV.verses));
export const wayById = new Map(D.ways.map((w) => [w.id, w]));
export const fieldById = new Map(D.fields.map((f) => [f.id, f]));
export const partById = new Map(D.article.parts.map((p) => [p.id, p]));
const pairById = new Map(D.pairs.map((p) => [p.id, p]));
const stationById = new Map(D.stations.map((s) => [s.id, s]));
const roundById = new Map(D.rounds.map((r) => [r.id, r]));
const spotById = new Map(D.parish.stations.map((s) => [s.id, s]));
const openable = new Map(D.pairs.map((p) => [`pair:${p.id}`, p]));

/** Every verse on this page opens in the Berean, whatever the reader last read (study rule 3). */
export function readerHref(code: string, chapter: number, verse: number): string {
  return `/read/bsb/${code}/${chapter}?hl=${verse}-${verse}`;
}

function pick<T>(map: Map<string, T>, value: string | null, fallback: string): T {
  return (value ? map.get(value) : undefined) ?? map.get(fallback)!;
}

export const findField = (value: string | null): Field | null => (value ? fieldById.get(value) : undefined) ?? null;
export const findStation = (value: string | null): Station => pick(stationById, value, DEFAULT_STATION);
export const findRound = (value: string | null): Round => pick(roundById, value, DEFAULT_ROUND);
export const findPart = (value: string | null): Part => pick(partById, value, DEFAULT_PART);
export const findSpot = (value: string | null): Spot => pick(spotById, value, DEFAULT_SPOT);

export function findOpened(value: string | null): Pair | null {
  return (value ? openable.get(value) : undefined) ?? null;
}

export function pairsIn(field: Field | null): Pair[] {
  return field ? D.pairs.filter((p) => p.field === field.id) : D.pairs;
}

/** The chosen pair, always one the chosen field shows: if the address asks for a pair the field hides, the field wins and its first pair stands. */
export function findPair(value: string | null, field: Field | null): Pair {
  const shown = pairsIn(field), asked = value ? pairById.get(value) : undefined;
  if (asked && shown.includes(asked)) return asked;
  const fallback = pairById.get(DEFAULT_PAIR)!;
  return shown.includes(fallback) ? fallback : shown[0];
}

/** A year from the address: only three or four digits, and held inside the study's period. */
export function parseYear(value: string | null): number {
  if (!value || !/^\d{3,4}$/.test(value)) return DEFAULT_YEAR;
  return Math.min(YEAR_TO, Math.max(YEAR_FROM, Number(value)));
}

export function stationState(station: Pick<Station, "from" | "to">, year: number): "before" | "during" | "after" {
  if (year < station.from) return "before";
  return year > station.to ? "after" : "during";
}

export const STATE_WORD = { before: "Not yet", during: "Under way", after: "Range ended" } as const;

/** How far the account stands from the events. Several written dates are round, so a lag is only ever "about", to the nearest five years. */
export function writtenLag(station: Pick<Station, "to" | "written">): string {
  if (station.written <= station.to) return "written while this was under way";
  return `written about ${Math.max(5, Math.round((station.written - station.to) / 5) * 5)} years after`;
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

export function sourceCounts(sources: Pick<Source, "status">[]): Record<string, number> {
  const counts: Record<string, number> = { read: 0, part: 0, "second-hand": 0, located: 0 };
  for (const s of sources) counts[s.status] = (counts[s.status] ?? 0) + 1;
  return counts;
}

// The mirror line. An axis of years, decrees on one side and what is set beside them on the other, drawn along the page when wide and down it when narrow.
export const MIRROR = {
  from: 480, to: 1370, first: 34, step: 26, radius: 11,
  wide: { width: 1000, height: 340, start: 24, end: 976, cross: 160 },
  tall: { width: 320, height: 900, start: 24, end: 876, cross: 160 },
} as const;
export type Orientation = "wide" | "tall";
export type Mark = { start: number; end: number; middle: number; lane: number };

export function axisPlace(year: number, orientation: Orientation): number {
  const { start, end } = MIRROR[orientation];
  return start + ((year - MIRROR.from) / (MIRROR.to - MIRROR.from)) * (end - start);
}

/** Puts each range on the first lane out from the axis where it touches nothing, so that marks in one year stack and none is moved along the axis. */
function placeMarks(sides: { id: string; side: Side }[], orientation: Orientation): Map<string, Mark> {
  const lanes: number[] = [], marks = new Map<string, Mark>(), gap = MIRROR.radius + 2;
  for (const { id, side } of [...sides].sort((a, b) => a.side.from - b.side.from || a.id.localeCompare(b.id))) {
    const start = axisPlace(side.from, orientation), end = axisPlace(side.to, orientation), middle = (start + end) / 2;
    const reach = Math.min(start, middle - gap);
    let lane = lanes.findIndex((last) => last <= reach);
    if (lane < 0) lane = lanes.length;
    lanes[lane] = Math.max(end, middle + gap) + gap;
    marks.set(id, { start, end, middle, lane });
  }
  return marks;
}

export function mirrorLayout(orientation: Orientation): { declared: Map<string, Mark>; followed: Map<string, Mark> } {
  return {
    declared: placeMarks(D.pairs.map((p) => ({ id: p.id, side: p.declared })), orientation),
    followed: placeMarks(D.pairs.map((p) => ({ id: p.id, side: p.followed })), orientation),
  };
}

export const laneOffset = (lane: number): number => MIRROR.first + lane * MIRROR.step;

/** A point in the drawing: `along` the axis and `off` it, decrees on the negative side. */
export function mirrorPoint(along: number, off: number, orientation: Orientation): [number, number] {
  const { cross } = MIRROR[orientation];
  return orientation === "wide" ? [along, cross + off] : [cross + off, along];
}

export function threadPath(id: string, layout: ReturnType<typeof mirrorLayout>, orientation: Orientation): string {
  const a = layout.declared.get(id), b = layout.followed.get(id);
  if (!a || !b) return "";
  const offA = -laneOffset(a.lane), offB = laneOffset(b.lane);
  const [x1, y1] = mirrorPoint(a.middle, offA, orientation), [x2, y2] = mirrorPoint(b.middle, offB, orientation);
  const [c1x, c1y] = mirrorPoint(a.middle, offA / 3, orientation), [c2x, c2y] = mirrorPoint(b.middle, offB / 3, orientation);
  return `M${x1.toFixed(1)} ${y1.toFixed(1)}C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

// The mission map: real degrees, the coast simplified. The script sets the frame and scale; a close mark is moved aside on a leader line, and the true place keeps its dot.
export function mapPoint(lon: number, lat: number): [number, number] {
  const { lon0, lat1, x, y } = MV.coast;
  return [(lon - lon0) * x, (lat1 - lat) * y];
}

const NUDGE = new Map<string, [number, number]>([["saxony-land", [-22, -22]], ["geismar", [16, 22]], ["prussia", [-6, -18]], ["poland", [8, 14]]]);

export function stationMark(station: Pick<Station, "id" | "lon" | "lat">): { at: [number, number]; mark: [number, number] } {
  const at = mapPoint(station.lon, station.lat), [dx, dy] = NUDGE.get(station.id) ?? [0, 0];
  return { at, mark: [at[0] + dx, at[1] + dy] };
}

// The balance: a stated judgement drawn as a tilt, always named in words. It has three positions and no scale.
export const TILT_ANGLE = { pope: -9, level: 0, king: 9 } as const;
export const TILT_WORD = { pope: "Toward the pope", level: "Neither side", king: "Toward the king" } as const;
export const BALANCE = { pivot: [180, 58], arm: 122 } as const;

export function panDrop(tilt: Round["tilt"]): { left: number; right: number } {
  const drop = BALANCE.arm * Math.sin((TILT_ANGLE[tilt] * Math.PI) / 180);
  return { left: -drop, right: drop };
}

// The age ladder, in true years of age.
export const LADDER_AGES = { from: 12, to: 42 } as const;
export const ageShare = (age: number): number => (age - LADDER_AGES.from) / (LADDER_AGES.to - LADDER_AGES.from);

// The floor plan. Illustrative; each stop sits where such a thing commonly stood, walked from west to east.
export const PLAN_STOPS: Record<string, [number, number]> = { yard: [78, 214], door: [206, 192], font: [186, 132], wall: [316, 92], screen: [430, 140], altar: [536, 140] };

// The article's rows, for the arcs that tie each reply back to its objection.
export const ARTICLE_ROW = 46;
export function articleArc(from: string, to: string): string {
  const rows = D.article.parts.map((p) => p.id), a = rows.indexOf(from), b = rows.indexOf(to);
  if (a < 0 || b < 0) return "";
  const y1 = (a + 0.5) * ARTICLE_ROW, y2 = (b + 0.5) * ARTICLE_ROW, bend = 46 - (b - a) * 6;
  return `M46 ${y1}C${bend} ${y1} ${bend} ${y2} 46 ${y2}`;
}
