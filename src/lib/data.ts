import type { ArcData, BookPlace, Catalog, Chapter, CrossRefBook, PlainBook, Place, Stats } from "./types";

/** A data file that is missing or malformed. The reader turns this into "not in this version". */
export class DataUnavailable extends Error {
  constructor(
    public readonly path: string,
    reason: string,
  ) {
    super(`data ${path}: ${reason}`);
    this.name = "DataUnavailable";
  }
}

const cache = new Map<string, Promise<unknown>>();
let stamp = "";

/** Every later request carries the catalogue's build stamp, so a data rebuild is never served stale. */
export function setStamp(value: string): void {
  stamp = value;
}

const SAFE_PATH = /^[A-Za-z0-9_\-/.]+$/;

async function fetchJson(path: string, check: (value: unknown) => boolean): Promise<unknown> {
  if (!SAFE_PATH.test(path) || path.includes("..")) throw new DataUnavailable(path, "unsafe path");
  const url = `/data/${path}${stamp ? `?v=${stamp}` : ""}`;
  const response = await fetch(url, { cache: stamp ? "default" : "no-cache" });
  if (!response.ok) throw new DataUnavailable(path, `HTTP ${response.status}`);
  if (!(response.headers.get("content-type") ?? "").includes("json")) {
    throw new DataUnavailable(path, `expected JSON, got ${response.headers.get("content-type")}`);
  }
  const value: unknown = await response.json();
  if (!check(value)) throw new DataUnavailable(path, "unexpected shape");
  return value;
}

/** One request per file for the whole session; concurrent callers share the in-flight request. */
function load<T>(path: string, check: (value: unknown) => boolean): Promise<T> {
  let pending = cache.get(path);
  if (!pending) {
    pending = fetchJson(path, check);
    pending.catch(() => cache.delete(path));
    cache.set(path, pending);
  }
  return pending as Promise<T>;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const loadCatalog = () =>
  load<Catalog>("catalog.json", (v) => isObject(v) && Array.isArray(v.translations) && Array.isArray(v.books));

// The reader's pieces are one small file per chapter (data layout 2, scripts/build-data.py), so a page downloads only
// the chapter it shows.

export const loadChapter = (slug: string, code: string, chapter: string) =>
  load<Chapter>(`text/${slug}/${code}/${chapter}.json`, (v) => isObject(v) && Array.isArray(v.v));

/** One chapter's verses as plain words ("chapter:verse" -> text), for previews and single-verse lookups. */
export const loadChapterPlain = (slug: string, code: string, chapter: string) =>
  load<PlainBook>(`plain/${slug}/${code}/${chapter}.json`, isObject);

/** A whole book's plain words: only for search, which has to read a whole version. */
export const loadPlain = (slug: string, code: string) => load<PlainBook>(`plain/${slug}/${code}.json`, isObject);

export const loadCrossRefs = (code: string, chapter: string) => load<CrossRefBook>(`xref/${code}/${chapter}.json`, isObject);

/** The places named in one book, with that book's verse ids only (the reader's "places in this chapter"). */
export const loadBookPlaces = (code: string) => load<BookPlace[]>(`places-by-book/${code}.json`, Array.isArray);

export const loadStats = () => load<Stats>("stats.json", (v) => isObject(v) && Array.isArray(v.books));

export const loadArcs = () => load<ArcData>("xref-arcs.json", (v) => isObject(v) && Array.isArray(v.arcs));

export const loadBookPairs = () => load<[string, string, number][]>("xref-books.json", Array.isArray);

export const loadPlaces = () => load<Place[]>("places.json", Array.isArray);
