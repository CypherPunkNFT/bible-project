// The Learning materials division (Research/Resources/LEARNING.md section 6): who each title is for, what kind it is,
// what it is about, its series and the site pages it is written from (learning-catalogue.json), merged with the
// workbooks scripts/build-learning.mjs has actually built (learning.json). A title is "ready" only when its built record
// exists; everything else is "planned": a title and its sources, never a download, a page count or sample pages.
import CATALOGUE_JSON from "./learning-catalogue.json";
import OPEN_COUNT from "./open-workbooks-count.json";
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
  /** Only for a workbook made by someone else that anyone may share: who made it, its terms and its files. */
  open?: OpenWork;
}

/** One file of an open workbook: on this site, or (over the 25 MiB hosting limit) at its maker's own address. */
export interface OpenFile { href: string; label: string; bytes: number; kind: string; external?: boolean }
/** A workbook by someone else whose terms let anyone share it (Research/Resources/OpenWorkbooks; open-workbooks.json). */
export interface OpenWork {
  id: string; title: string; author?: string | null; publisher?: string | null; doors: string[]; ages?: string | null; kind: string;
  subjects: string[]; description?: string | null; pages?: number | null; sourcePage: string; files: OpenFile[]; linkOnly?: string;
  rights: { basis: string; licence: string; licenceUrl?: string | null; creditLine?: string | null; conditions?: string | null };
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

/**
 * The page as the owner asked for it on 24 October 2026: only what we have. Our own built workbooks, plus every open
 * workbook by someone else that has been downloaded, each behind every door it serves; no planned titles, and only the
 * series that still join two titles or more.
 */
export function buildShelf(catalogue: Catalogue, built: Workbook[], open: OpenWork[]): Division {
  const ours = buildDivision(catalogue, built).ready;
  const tracks = new Set(catalogue.tracks.map((t) => t.id));
  const others: Title[] = open.filter((w) => w.files.length > 0).map((w) => ({
    id: w.id, status: "ready", title: w.title, sub: w.description ?? "", audience: w.doors[0], kind: w.kind,
    track: w.subjects.find((s) => tracks.has(s)) ?? "life", series: [], builtFrom: [], open: w,
  }));
  // A series keeps its place only while two of its titles are here; a title forgets the series that are gone.
  const series = catalogue.series.filter((s) => ours.filter((t) => t.series.some((x) => x.id === s.id)).length > 1);
  const kept = new Set(series.map((s) => s.id));
  const titles = [...ours.map((t) => ({ ...t, series: t.series.filter((s) => kept.has(s.id)) })), ...others];
  const step = (t: Title, sid: string) => t.series.find((s) => s.id === sid)?.step ?? 0;
  const inSeries = (sid: string) => titles.filter((t) => t.series.some((s) => s.id === sid)).sort((a, b) => step(a, sid) - step(b, sid));
  return {
    audiences: catalogue.audiences, kinds: catalogue.kinds, tracks: catalogue.tracks, series, titles,
    audience: byId(catalogue.audiences), kind: byId(catalogue.kinds), track: byId(catalogue.tracks), seriesById: byId(series), title: byId(titles),
    ready: titles, planned: [],
    forAudience: (id) => titles.filter((t) => (t.open ? t.open.doors.includes(id) : t.audience === id || (id === "leaders" && t.guide === true))),
    inSeries,
  };
}

/** What the shelf holds without loading it: our ready titles, plus the downloaded open workbooks (a unit test keeps it equal). */
export function shelfCounts(catalogue: Catalogue = CATALOGUE) {
  return { titles: divisionCounts(catalogue).ready + OPEN_COUNT.titles, readers: catalogue.audiences.length };
}

/** The station's line for the division, from the catalogue's own status (a unit test keeps it equal to what is built). */
export function divisionCounts(catalogue: Catalogue = CATALOGUE) {
  const ready = catalogue.items.filter((i) => i.status === "ready").length;
  return { ready, planned: catalogue.items.length - ready, readers: catalogue.audiences.length };
}
