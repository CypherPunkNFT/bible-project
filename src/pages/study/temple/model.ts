// The temple and Israel's worship: the research record, the generated data (scripts/build-temple-study.py: the verses by id,
// the plans' measurements, the divisions, the feasts' places, the witness tags), and the address values the page accepts.
// Every address value is looked up in a Map or a fixed set, so an unknown one falls back and nothing here throws while loading.
import dossier from "../../../../content/academic-research/44-the-temple-and-israels-worship.json";
import generated from "./temple-data.json";
import { plainText } from "@/pages/study/check-notes/checked";

/** A verse by book, chapter and verse; its words come from the reader's Bible (src/lib/verses.ts). */
export type Verse = { code: string; chapter: number; verse: number };
export type Three = { evidence: string; inference: string; limit: string };
export type House = Three & { id: string; name: string; num: number; verses: string[] };
export type Site = Three & { id: string; name: string };
export type Find = Three & { id: string; name: string };
export type PriestRecord = Three & { id: string; head: string; verses: string[] };
export type DayStep = { id: string; head: string; text: string };
export type Feast = { id: string; jewish: string; when: string; scripture: string; practice: string; today: string; nt: string[]; ntNote: string };
export type AtonementStep = { id: string; head: string; scripture: string; text: string };
export type FallRecord = Three & { id: string; head: string };
export type TestItem = { question: string; options: { text: string; right: boolean; why: string }[] };
export type Claim = Three & { id: string; claim: string; head: string; verses: string[]; sources: string[]; test: TestItem };
export type Source = { id: string; title: string; kind: string; status: string; answers: string; read: string };
export type Row = { id: string; name: string; start: number | null; end: number | null; note: string; kind: string };
export type Shape = { id: string; house: string; part: string; x: number; y: number; w: number; h: number; kind: "scripture" | "berean" | "inferred" | "mishnah"; verse?: string };
export type FeastPlace = { id: string; month: number; day: number; days: number; argued?: boolean; words: string };
export type Witness = "scripture" | "josephus" | "rabbinic" | "ground" | "other";

export const D = dossier as unknown as {
  title: string; premise: string; question: string; outcomes: string[]; boundaries: { in: string; out: string[] };
  confusedWords: { word: string; note: string }[]; houses: House[];
  parallels: { lead: string; sites: Site[]; tabernacle: Three }; ground: { lead: string; finds: Find[] };
  priesthood: { lead: string; records: PriestRecord[]; highPriest: string };
  offerings: { lead: string; day: DayStep[]; kinds: string; ceased: string };
  feasts: { lead: string; list: Feast[] };
  atonement: Three & { verses: string[]; steps: AtonementStep[] };
  fall: { lead: string; records: FallRecord[]; scripture: string; care: string };
  stance: { head: string; scripture: string; confession: string; confessionSource: string; body: string; meaning: string; verses: string[] };
  critical: { head: string; view: string; answer: string; link: string };
  claims: Claim[]; timeline: { from: number; to: number; rows: Row[] }; reach: string[]; sources: Source[];
  pictures: { id: string; subject: string; status: string; note: string }[];
  links: { academic: string[]; theology: string[] }; checkNotes: unknown[];
};
export const TD = generated as unknown as {
  recordHash: string; counts: { houses: number; feasts: number; divisions: number; checks: number; open: number; quotations: number };
  plans: Shape[]; decree: { w: number; h: number; verse: string }; hall: { l: number; verse: string };
  divisions: { n: number; name: string; verse: string }[]; psalms: number[]; feasts: FeastPlace[];
  zones: Record<string, "inner" | "wilderness" | "people" | "unstated">; accounts: { who: string; text: string }[];
  finds: Record<string, "west" | "southwest" | "east" | null>; types: Record<string, "long" | "broad">;
  tags: Record<string, Witness[]>; verses: Record<string, Verse>; refs: Record<string, string[]>; links: Record<string, string>;
};

export const CUBIT_M = 0.45;
export const DEFAULT_HOUSE = "solomon";
export const DEFAULT_FEAST = "pesach";
export const houseById = new Map(D.houses.map((h) => [h.id, h]));
export const feastById = new Map(D.feasts.list.map((f) => [f.id, f]));
export const findById = new Map(D.ground.finds.map((f) => [f.id, f]));
export const siteById = new Map(D.parallels.sites.map((s) => [s.id, s]));
export const sourceById = new Map(D.sources.map((s) => [s.id, s]));
export const feastPlaceById = new Map(TD.feasts.map((f) => [f.id, f]));
export const refByKey = new Map(Object.entries(TD.refs));
const own = (object: object, key: string): boolean => Object.prototype.hasOwnProperty.call(object, key);
export const tagsOf = (key: string): Witness[] => (own(TD.tags, key) ? TD.tags[key] : []);
export const linkFor = (name: string): string | null => (own(TD.links, name) ? TD.links[name] : null);

/** Every verse link opens the Bible reader in the Berean (study rule 3). */
export const readerHref = (code: string, chapter: number, verse: number): string => `/read/bsb/${code}/${chapter}?hl=${verse}-${verse}`;

/** The verses a reference names, in order; empty when the build did not supply it. */
export function versesOf(key: string): Verse[] {
  return (refByKey.get(key) ?? []).map((id) => TD.verses[id]).filter(Boolean);
}

/** A metric estimate at about 45 cm to the cubit, rounded to the metre: the record says every conversion is an estimate. */
export const metres = (cubits: number): number => Math.round(cubits * CUBIT_M);

// ---- Years on the time strip: negative is BC, and there is no year zero ----
export const axisYear = (year: number): number => (year < 0 ? year + 1 : year);
export const yearWord = (year: number): string => (year < 0 ? `${-year} BC` : `AD ${year}`);

// ---- The address ----
export const findHouse = (value: string | null): House => (value ? houseById.get(value) : undefined) ?? houseById.get(DEFAULT_HOUSE)!;
export const findFeast = (value: string | null): Feast => (value ? feastById.get(value) : undefined) ?? feastById.get(DEFAULT_FEAST)!;
export const findFind = (value: string | null): Find | null => (value ? findById.get(value) : undefined) ?? null;
export const findScale = (value: string | null): "close" | "wide" => (value === "wide" ? "wide" : "close");

export type Opened =
  | { kind: "record"; key: string; kicker: string; title: string; evidence: string; inference: string; limit: string; tags: Witness[]; verses: string[] }
  | { kind: "ref"; key: string; label: string; verses: Verse[] };

const openable = new Map<string, Opened>();
const addRecord = (group: string, kicker: string, item: Three & { id: string; name?: string; head?: string; verses?: string[] }) => {
  const key = `${group}:${item.id}`;
  openable.set(key, { kind: "record", key, kicker, title: item.name ?? item.head ?? item.id, evidence: item.evidence, inference: item.inference, limit: item.limit, tags: tagsOf(key), verses: item.verses ?? [] });
};
for (const s of D.parallels.sites) addRecord("site", "A temple in its world", s);
for (const f of D.ground.finds) addRecord("find", "Herod's platform", f);
for (const r of D.priesthood.records) addRecord("priest", "The priests", r);
for (const r of D.fall.records) addRecord("fall", "AD 70", r);
for (const key of refByKey.keys()) openable.set(`ref:${key}`, { kind: "ref", key: `ref:${key}`, label: key, verses: versesOf(key) });

/** The record or reference the address opens; null for anything unknown. */
export const findOpened = (value: string | null): Opened | null => (value ? openable.get(value) : undefined) ?? null;

export const titleOf = (item: Opened): string => (item.kind === "ref" ? item.label : plainText(item.title));

/** What was read of a source, in its own words when it gives them. */
export const readingTag = (status: string): string => (status === "read" ? "read" : status === "part" ? "part read" : "located, not read");

/** A record's place on the platform outline, or null where it has none. */
export const sideOf = (id: string): "west" | "southwest" | "east" | null => (own(TD.finds, id) ? TD.finds[id] : null);
