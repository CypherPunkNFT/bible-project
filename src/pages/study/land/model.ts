// The land of the Bible's data and its small rules: the research record, the generated verses, quotations, figures and map,
// the slice's geometry, the rain year, and the address values the page accepts. Everything the address asks for is looked up
// in a Map, so an unknown value (or one like "__proto__") falls back to the default, and nothing here throws while the page loads.
import dossier from "../../../../content/academic-research/40-the-land-of-the-bible.json";
import generated from "./land-data.json";
import { plainText } from "@/pages/study/check-notes/checked";

export type Band = "coast" | "shephelah" | "hills" | "rift" | "east";
export type Point = { id: string; name: string; km: number; elevation: number; band: Band; note: string; verses?: string[]; elevationCheck?: string; distanceCheck?: string };
export type Item = { id: string; name: string; evidence: string; inference: string; limit: string; background?: string; where?: string; band?: string; verses: string[]; sources?: string[]; link?: string };
export type Rain = { id: string; name: string; months: string; evidence: string; inference: string; limit: string };
export type Part3 = { evidence: string; inference: string; limit: string };
export type Placement = { site: string; held: string };
export type Disputed = { id: string; name: string; verses: string[]; evidence: string; placements: Placement[]; limit: string; link?: string };
export type TestItem = { question: string; options: { text: string; right: boolean; why: string }[] };
export type Claim = { id: string; claim: string; head: string; evidence: string; inference: string; limit: string; verses: string[]; sources: string[]; test: TestItem };
export type Source = { id: string; title: string; url: string; kind: string; status: string; answers: string; read: string };
export type Verse = { code: string; chapter: number; verse: number; text: string };

export const D = dossier as unknown as {
  title: string; premise: string; question: string; outcomes: string[]; boundaries: { in: string; out: string[] };
  transect: { lead: string; points: Point[]; otherLines: string; limit: string };
  regions: Item[]; roads: { lead: string; items: Item[] }; water: { lead: string; items: Item[] }; battles: { lead: string; items: Item[] };
  trade: { lead: string; items: Item[] }; faith: { lead: string; items: Item[] };
  climate: { lead: string; rains: Rain[]; gradient: Part3; winds: Part3; dew: Part3; drought: Part3; verses: string[]; sources: string[] };
  egyptAndCanaan: { head: string; verses: string[]; evidence: string; background: string; inference: string; limit: string };
  disputedSites: { lead: string; items: Disputed[]; rule: string }; claims: Claim[];
  confusedWords: { word: string; note: string }[]; reach: string[]; links: { title: string; why: string }[];
  stance: { head: string; confession: string; confessionSource: string; body: string };
  sources: Source[]; openQuestions: string[]; checkNotes: { id: string; path: string; marker: boolean; status: string }[];
};
export const LD = generated as unknown as {
  recordHash: string; verses: Record<string, Verse>; phrases: Record<string, { phrase: string; way: "up" | "down" | "" }>; links: Record<string, string>;
  figures: { drop: { metres: number; km: number; exact: number }; climb: { metres: number; km: number }; rise: number; rain: { id: string; place: string; mm: number; words: string }[]; rainRatio: number; regions: number; battles: number };
  map: { width: number; height: number; land: string; coast: string; points: Record<string, { name: string; x: number; y: number }>; lakes: Record<string, { x: number; y: number; rx: number; ry: number }>;
    rings: { site: string; name: string; x: number; y: number }[]; slice: [number, number][]; labels: { name: string; x: number; y: number }[]; kmPx: number };
};

export const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
export const BAND_NAME: Record<Band, string> = { coast: "Coast", shephelah: "Low hills", hills: "Ridge", rift: "Rift", east: "Plateau" };
export const DEFAULT_POINT = "ridge";
export const LAYERS = ["rain", "roads", "water"] as const;
export type Layer = (typeof LAYERS)[number];

export const verseByLabel = new Map(Object.entries(LD.verses));
export const phraseByLabel = new Map(Object.entries(LD.phrases));
export const linkByTitle = new Map(Object.entries(LD.links));
export const sourceById = new Map(D.sources.map((s) => [s.id, s]));
const pointById = new Map(D.transect.points.map((p) => [p.id, p]));
const layerSet = new Map(LAYERS.map((l) => [l, l]));

/** Every record the sheet can open, by its address key ("region:coast"). */
export type Openable = { kind: "region" | "road" | "water" | "battle" | "trade" | "faith"; item: Item } | { kind: "verse"; label: string; verse: Verse };
const KIND_LABEL = { region: "Region", road: "Road", water: "Water", battle: "Battle place", trade: "Trade", faith: "Faith and the land" } as const;
export const kindLabel = (kind: keyof typeof KIND_LABEL): string => KIND_LABEL[kind];
const records = new Map<string, Openable>();
for (const item of D.regions) records.set(`region:${item.id}`, { kind: "region", item });
for (const item of D.roads.items) records.set(`road:${item.id}`, { kind: "road", item });
for (const item of D.water.items) records.set(`water:${item.id}`, { kind: "water", item });
for (const item of D.battles.items) records.set(`battle:${item.id}`, { kind: "battle", item });
for (const item of D.trade.items) records.set(`trade:${item.id}`, { kind: "trade", item });
for (const item of D.faith.items) records.set(`faith:${item.id}`, { kind: "faith", item });

/** What `open=` asks for: a record by its key, or a verse by "verse:" and its label (split at the first colon only: "verse:Luke 10:30"). */
export function findOpened(value: string | null): Openable | null {
  if (!value) return null;
  const record = records.get(value);
  if (record) return record;
  const at = value.indexOf(":");
  if (at < 0 || value.slice(0, at) !== "verse") return null;
  const label = value.slice(at + 1), verse = verseByLabel.get(label);
  return verse ? { kind: "verse", label, verse } : null;
}

/** A record's or verse's name for a button, from its address key. */
export function openName(key: string): string {
  const opened = findOpened(key);
  if (!opened) return key;
  return opened.kind === "verse" ? opened.label : opened.item.name;
}

export const findPoint = (value: string | null): Point => (value ? pointById.get(value) : undefined) ?? pointById.get(DEFAULT_POINT)!;
export const findLayer = (value: string | null): Layer => (value ? layerSet.get(value as Layer) : undefined) ?? "rain";

/** Every verse on this page opens in the Berean, whatever the reader last read (study rule 3). */
export function readerHref(verse: Pick<Verse, "code" | "chapter" | "verse">): string {
  return `/read/bsb/${verse.code}/${verse.chapter}?hl=${verse.verse}-${verse.verse}`;
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

/** A source's address only if it is a plain https link; "" (not settled) or anything else gets no link. */
export const safeUrl = (url: string): string | null => (/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(url) ? url : null);

/** The check note that stands for a source's missing address (a note with no mark in the text), if the record has one. */
export function urlNote(index: number): string | null {
  return D.checkNotes.find((n) => n.path === `.sources[${index}].url`)?.id ?? null;
}

// The slice: straight lines between the record's eight points, so no ground is drawn that the record does not give.
export const SLICE = { width: 1000, height: 300, left: 40, right: 960, top: 40, sea: 190, metresPx: 0.17 } as const;
const KM_MAX = Math.max(...D.transect.points.map((p) => p.km));
export const sliceX = (km: number): number => SLICE.left + (km / KM_MAX) * (SLICE.right - SLICE.left);
export const sliceY = (metres: number): number => SLICE.sea - metres * SLICE.metresPx;
/** How many times the height is stretched against the width, rounded down to a whole number. */
export const STRETCH = Math.floor(SLICE.metresPx / (((SLICE.right - SLICE.left) / KM_MAX) / 1000));

export function slicePath(points: Pick<Point, "km" | "elevation">[]): string {
  return points.map((p, i) => `${i ? "L" : "M"}${sliceX(p.km).toFixed(1)} ${sliceY(p.elevation).toFixed(1)}`).join("");
}

export function groundPath(points: Pick<Point, "km" | "elevation">[]): string {
  const bottom = sliceY(-600).toFixed(1);
  return `${slicePath(points)}L${sliceX(points[points.length - 1].km).toFixed(1)} ${bottom}L${sliceX(points[0].km).toFixed(1)} ${bottom}Z`;
}

/** The climb of section 02 at two scales: the true one (one metre up the same as one metre along) and a stated stretch. */
export function climbLine(width: number, stretch: number, from: Point, to: Point): { x1: number; y1: number; x2: number; y2: number } {
  const px = width / ((to.km - from.km) * 1000);
  const drop = (from.elevation - to.elevation) * px * stretch;
  return { x1: 0, y1: 0, x2: width, y2: Math.round(drop * 10) / 10 };
}

/** What each band below the slice says at a point. Placed by this page from the record's own descriptions, and labelled so. */
export const LAYER_AT: Record<Layer, Record<string, string>> = {
  rain: Object.fromEntries(LD.figures.rain.filter((r) => pointById.has(r.id)).map((r) => [r.id, `${r.words} mm`])),
  roads: { plain: "Coastal road", shephelah: "Climbing roads", ridge: "Ridge road", wilderness: "Climbing roads", jericho: "Climbing roads", plateau: "King's Highway" },
  water: { plain: "Wells", shephelah: "Wells", ridge: "Spring · cisterns", wilderness: "Cisterns", jericho: "Spring" },
};
export const LAYER_RECORD: Record<Layer, string[]> = { rain: [], roads: ["road:coastal", "road:ascents", "road:ridge", "road:kings"], water: ["water:springs", "water:wells", "water:cisterns"] };

// The rain year, October to May, as twelve-month positions from October. A season's months come from the record's words.
const MONTHS = ["october", "november", "december", "january", "february", "march", "april", "may", "june", "july", "august", "september"];
export const MONTH_SHORT = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
export function rainSpan(months: string): { from: number; to: number } | null {
  const words = months.toLowerCase().split(/\s+to\s+/).map((w) => MONTHS.indexOf(w.trim()));
  if (words.length !== 2 || words.some((w) => w < 0) || words[1] < words[0]) return null;
  return { from: words[0], to: words[1] + 1 };
}

/** The site's own page for a title the record names, only where the build settled it. */
export const linkFor = (title: string | undefined): string | null => (title ? linkByTitle.get(title) ?? null : null);

/** A card's one line: the first sentence of a research string, without its markers, ending in one full stop. */
export function firstSentence(text: string): string {
  return `${plainText(text).split(". ")[0].replace(/\.$/, "")}.`;
}
