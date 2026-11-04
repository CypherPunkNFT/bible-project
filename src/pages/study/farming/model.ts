// The farming year study's data and its small rules: the research record, the generated verses, the wheel's geometry, the Berean
// reader link, and the address values it accepts. Everything the address asks for is looked up in a Map, so an unknown value falls
// back to the default.
import dossier from "../../../../content/academic-research/29-the-farming-year.json";
import generated from "./farming-data.json";

export type Verse = { code: string; chapter: number; verse: number };
export type Kind = "stone" | "scripture" | "ground" | "later";
export type Season = { id: string; months: number; start: number; hebrew: string; translit: string; reading: string; short: string; work: string; doubt: string;
  sameWord: { verse: string; tags: string[]; english: string; note: string }; sources: string[] };
export type StoneLine = { n: number; hebrew: string; seasons: string[] };
export type Passage = { id: string; name: string; verses: string[]; seasons: string[]; chords?: [string, string][]; says: string; agrees: string; limit: string };
export type Job = { id: string; name: string; seasons: string[]; line: string; witness: Kind[]; groundNote?: string; evidence: string; inference: string; limit: string;
  verses: string[]; sources: string[]; picture?: string; picture2?: string };
export type HearerItem = { id: string; verse: string; seasons: string[]; parable?: string; knew: string; limit: string; sources: string[] };
export type HearerGroup = { id: string; name: string; head: string; lead: string; link: { href: string; label: string }; items: HearerItem[] };
export type Picture = { id: string; src: string; alt: string; credit: string; licence: string; licenceUrl: string; href: string; retrieved: string; width: number; height: number };
export type Source = { id: string; title: string; url: string; kind: string; status: string; answers: string; read: string };
export type Claim = { id: string; claim: string; head: string; evidence: string; inference: string; limit: string; verses: string[]; sources: string[];
  test: { question: string; options: { text: string; right: boolean; why: string }[] } };

export const D = dossier as unknown as {
  outcomes: string[]; question: string; boundaries: { in: string; out: string[] }; evidenceKinds: { id: Kind; word: string; note: string }[];
  seasons: Season[]; lines: StoneLine[]; placing: { note: string; laterMonths: number; sources: string[] }; stoneFacts: string[]; purposes: { name: string; held: string }[];
  clock: Passage[]; jobs: Job[]; hearers: HearerGroup[]; claims: Claim[]; confusedWords: { word: string; note: string }[]; reach: string[];
  sources: Source[]; pictures: Picture[]; verses: { label: string }[];
};
export const FY = generated as { verses: Record<string, Verse>; threshingFloorTags: number; harvestTags: number };

export const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
export const DEFAULT_SEASON = "barley";
export const DEFAULT_PASSAGE = "exodus";
export const MONTHS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

export const sourceById = new Map(D.sources.map((s) => [s.id, s]));
export const pictureById = new Map(D.pictures.map((p) => [p.id, p]));
export const kindById = new Map(D.evidenceKinds.map((k) => [k.id, k]));
export const verseByLabel = new Map(Object.entries(FY.verses));
export const seasonById = new Map(D.seasons.map((s) => [s.id, s]));
const passageById = new Map(D.clock.map((p) => [p.id, p]));
const openable = new Map(D.jobs.map((job) => [`job:${job.id}`, job]));

/** Every verse on this page opens in the Berean, whatever the reader last read (study rule 3). */
export function readerHref(code: string, chapter: number, verse: number): string {
  return `/read/bsb/${code}/${chapter}?hl=${verse}-${verse}`;
}

export function findSeason(value: string | null): Season {
  return (value ? seasonById.get(value) : undefined) ?? seasonById.get(DEFAULT_SEASON)!;
}

export function findPassage(value: string | null): Passage {
  return (value ? passageById.get(value) : undefined) ?? passageById.get(DEFAULT_PASSAGE)!;
}

export function findOpened(value: string | null): Job | null {
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

/** A point on the wheel: month 0 stands at the top, and the year runs clockwise. */
export function wheelPoint(month: number, radius: number, centre = 200): [number, number] {
  const angle = ((month * 30 - 90) * Math.PI) / 180;
  return [centre + radius * Math.cos(angle), centre + radius * Math.sin(angle)];
}

export function arcPath(start: number, months: number, outer: number, inner: number): string {
  const gap = 0.06;
  const from = start + gap, to = start + months - gap, large = months > 6 ? 1 : 0;
  const [ax, ay] = wheelPoint(from, outer), [bx, by] = wheelPoint(to, outer), [cx, cy] = wheelPoint(to, inner), [dx, dy] = wheelPoint(from, inner);
  const n = (value: number) => value.toFixed(2);
  return `M${n(ax)} ${n(ay)}A${outer} ${outer} 0 ${large} 1 ${n(bx)} ${n(by)}L${n(cx)} ${n(cy)}A${inner} ${inner} 0 ${large} 0 ${n(dx)} ${n(dy)}Z`;
}

/** The middle of a season, in months from the top of the wheel. */
export function seasonMiddle(season: Season): number {
  return season.start + season.months / 2;
}

/** The modern months a season falls in, on this study's placing. */
export function monthSpan(season: Season): string {
  const first = MONTHS[season.start], last = MONTHS[(season.start + season.months) % 12];
  return `mid-${first} to mid-${last}`;
}

/** Touching seasons merge into one bar on the twelve-month strip. */
export function monthBars(seasonIds: string[]): { start: number; months: number }[] {
  const bars: { start: number; months: number }[] = [];
  const known = seasonIds.flatMap((id) => { const s = seasonById.get(id); return s ? [s] : []; }).sort((a, b) => a.start - b.start);
  for (const season of known) {
    const last = bars[bars.length - 1];
    if (last && last.start + last.months === season.start) last.months += season.months;
    else bars.push({ start: season.start, months: season.months });
  }
  return bars;
}

export function seasonNames(ids: string[]): string {
  return ids.map((id) => seasonById.get(id)?.short ?? id).join(", ");
}
