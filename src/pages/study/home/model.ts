// The Home and household study's data and its small rules: the research record, the generated verses, the Berean reader link, and
// the address values it accepts. Everything the address asks for is looked up in a Map, so an unknown value falls back to the default.
import dossier from "../../../../content/academic-research/27-home-and-household.json";
import generated from "./home-data.json";

export type Kind = "found" | "rebuilt" | "written";
export type Verse = { code: string; chapter: number; verse: number };
export type Room = { id: string; name: string; kind: Kind; line: string; evidence: string; inference: string; limit: string; verses: string[]; sources: string[] };
export type Mark = { kind: Kind; source: string; why: string };
export type Task = { id: string; name: string; halif: string; marks: Record<string, Mark | undefined>; note: string; disagree?: string; verses: string[] };
export type HouseObject = { id: string; name: string; picture: string; line: string; date: string; from: string; culture: string; evidence: string; inference: string; limit: string; verses: string[] };
export type Picture = { id: string; src: string; alt: string; credit: string; licence: string; licenceUrl: string; href: string; retrieved: string; width: number; height: number };
export type Step = { id: string; name: string; line: string; source: string; verse: string };
export type Ladder = { id: string; name: string; from: string; to: string; steps: Step[] };
export type Source = { id: string; title: string; url: string; kind: string; status: string; answers: string; read: string };
export type Claim = { id: string; claim: string; head: string; evidence: string; inference: string; limit: string; verses: string[]; sources: string[];
  test: { question: string; options: { text: string; right: boolean; why: string }[] } };
export type Opened = { type: "room"; room: Room } | { type: "object"; object: HouseObject };

export const D = dossier as unknown as {
  outcomes: string[]; question: string; boundaries: { in: string; out: string[] }; scale: { id: Kind; word: string; note: string }[];
  rooms: Room[]; places: { id: string; label: string }[]; tasks: Task[]; ladders: Ladder[]; words: { id: string; label: string; count: number }[];
  objects: HouseObject[]; pictures: Picture[]; claims: Claim[]; sources: Source[];
  kin: { rings: { id: string; word: string; name: string; verse: string }[]; gloss: string; clusters: string; unequal: string };
  sizes: { id: string; label: string; length: number; width: number; note: string; source: string }[];
  confusedWords: { word: string; note: string }[]; reach: string[];
};
export const HH = generated as { verses: Record<string, Verse>; breadTags: number };

export const ext = { target: "_blank", rel: "noopener" } as const;
export const DEFAULT_TASK = "bake";

export const sourceById = new Map(D.sources.map((s) => [s.id, s]));
export const pictureById = new Map(D.pictures.map((p) => [p.id, p]));
export const scaleById = new Map(D.scale.map((s) => [s.id, s]));
export const verseByLabel = new Map(Object.entries(HH.verses));
const taskById = new Map(D.tasks.map((t) => [t.id, t]));
const openable = new Map<string, Opened>([
  ...D.rooms.map((room) => [`room:${room.id}`, { type: "room", room }] as [string, Opened]),
  ...D.objects.map((object) => [`object:${object.id}`, { type: "object", object }] as [string, Opened]),
]);

/** Every verse on this page opens in the Berean, whatever the reader last read (study rule 3). */
export function readerHref(code: string, chapter: number, verse: number): string {
  return `/read/bsb/${code}/${chapter}?hl=${verse}-${verse}`;
}

export function findTask(value: string | null): Task {
  return (value ? taskById.get(value) : undefined) ?? taskById.get(DEFAULT_TASK)!;
}

export function findOpened(value: string | null): Opened | null {
  return (value ? openable.get(value) : undefined) ?? null;
}

export function kindWord(kind: Kind): string {
  return scaleById.get(kind)?.word ?? kind;
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
