// The Learning materials division (Research/Resources/LEARNING.md section 6): who each title is for, what kind it is,
// what it is about, its series and the site pages it is written from (learning-catalogue.json), merged with the
// workbooks scripts/build-learning.mjs has actually built (learning.json). A title is "ready" only when its built record
// exists; everything else is "planned": a title and its sources, never a download, a page count or sample pages.
import CATALOGUE_JSON from "./learning-catalogue.json";
import type { Workbook } from "./index";

export interface Audience { id: string; name: string; age: string; how: string; art: string; tone: string; setting?: boolean; line: string }
export interface Kind { id: string; name: string; plural: string; glyph: string }
export interface Track { id: string; name: string; short: string; from: string; path: string }
export interface Series { id: string; name: string; type: string; line: string }
export interface SourcePage { path: string; title: string }
export type Status = "ready" | "planned";
export interface CatalogueItem {
  id: string; status: Status; title: string; sub: string; audience: string; kind: string; track: string;
  series?: { id: string; step: number }[]; sessions?: number; minutes?: number; guide?: boolean; builtFrom: SourcePage[];
}
export interface Catalogue { about: string; audiences: Audience[]; kinds: Kind[]; tracks: Track[]; series: Series[]; items: CatalogueItem[] }

/** One title as the site shows it: the catalogue's entry, with the built record when there is one. */
export interface Title extends Omit<CatalogueItem, "status" | "series"> {
  status: Status;
  series: { id: string; step: number }[];
  /** Only for a ready title: the built workbook (PDFs, cover, page images, outline). */
  record?: Workbook;
  /** Only for a ready title: what was checked, and when. */
  review?: string;
}

export interface Division {
  audiences: Audience[]; kinds: Kind[]; tracks: Track[]; series: Series[]; titles: Title[];
  audience: Record<string, Audience>; kind: Record<string, Kind>; track: Record<string, Track>; seriesById: Record<string, Series>; title: Record<string, Title>;
  ready: Title[]; planned: Title[];
  /** The titles behind a door: its own age, plus (for Leaders) every title that comes with a leader guide. */
  forAudience: (id: string) => Title[];
  /** A series' titles in their order. */
  inSeries: (id: string) => Title[];
}

export const CATALOGUE = CATALOGUE_JSON as Catalogue;

const byId = <T extends { id: string }>(list: T[]) => Object.fromEntries(list.map((x) => [x.id, x])) as Record<string, T>;

function reviewOf(record: Workbook) {
  const o = record.outline;
  return o ? `Checked ${record.checked}: ${o.questions} questions, ${o.keyVerses} key verses and every quotation matched word for word to the King James text.`
    : `Checked ${record.checked} against the King James text.`;
}

/** The catalogue with the built workbooks merged in by id. */
export function buildDivision(catalogue: Catalogue, built: Workbook[]): Division {
  const records = new Map(built.map((w) => [w.id, w]));
  // The declared status is not read here: a title is ready only when it has been built.
  const titles: Title[] = catalogue.items.map(({ series, ...declared }) => {
    const { status: _status, ...item } = declared; // eslint-disable-line @typescript-eslint/no-unused-vars
    const record = records.get(item.id);
    return record
      ? { ...item, series: series ?? [], status: "ready", record, sessions: record.sessions, review: reviewOf(record) }
      : { ...item, series: series ?? [], status: "planned" };
  });
  const step = (t: Title, sid: string) => t.series.find((s) => s.id === sid)?.step ?? 0;
  return {
    audiences: catalogue.audiences, kinds: catalogue.kinds, tracks: catalogue.tracks, series: catalogue.series, titles,
    audience: byId(catalogue.audiences), kind: byId(catalogue.kinds), track: byId(catalogue.tracks), seriesById: byId(catalogue.series), title: byId(titles),
    ready: titles.filter((t) => t.status === "ready"), planned: titles.filter((t) => t.status === "planned"),
    forAudience: (id) => titles.filter((t) => t.audience === id || (id === "leaders" && t.guide === true)),
    inSeries: (sid) => titles.filter((t) => t.series.some((s) => s.id === sid)).sort((a, b) => step(a, sid) - step(b, sid)),
  };
}

/** The station's line for the division, from the catalogue's own status (a unit test keeps it equal to what is built). */
export function divisionCounts(catalogue: Catalogue = CATALOGUE) {
  const ready = catalogue.items.filter((i) => i.status === "ready").length;
  return { ready, planned: catalogue.items.length - ready, readers: catalogue.audiences.length };
}
