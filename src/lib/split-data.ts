// Split data sets (scripts/split-data.ts): a large list cut into small files so a page downloads and parses only what
// its first screen draws, and the rest when it is needed (owner, 2026-11-19: "pages download and parse big data files
// whole"). One data set lives in data/split/<dataset>/:
//
//   manifest.json            what follows; fetched with the release's ?v=<stamp> like every data file
//   head.<hash>.json         the small figures the page shows at once, the short-key table and the row order
//   <layer>-<n>.<hash>.json  a layer's rows (an array, one per row, every layer in the same row order), e.g. the
//                            list the cards and filters read, the work titles, the search text
//   extra.<hash>.json        large figures read only once the whole list is loaded
//   details-<n>.<hash>.json  { id: what no layer carries }, grouped by shardOf(id), read when one item is opened
//
// Every part's name carries the first 12 hex digits of the SHA-256 of its bytes, so a part never changes under its
// name and is cached for good (public/_headers: /data/* immutable), across releases too: a new release that did not
// change a data set gives the visitor nothing new to download. A row's objects are written with short keys (head.keys)
// to keep the files small; expandRow puts the real keys back, and mergeDeep adds a later layer or the details.
// No imports and no "@/" aliases: the build script loads this file under Node, and the app copies it word for word
// (App/scripts/sync-site-content.py).

/** Raised when the manifest's form changes, so a front end never reads parts it does not understand. */
export const SPLIT_LAYOUT = 1;
/** A part's file name: a short name, a dot, 12 hex digits of its SHA-256, ".json". */
export const SPLIT_PART = /^[a-z][a-z0-9-]{0,40}\.[0-9a-f]{12}\.json$/;
const DATASET = /^[a-z][a-z0-9-]{0,40}$/;
const MAX_FILES = 512;
const MAX_SHARDS = 256;

export interface SplitFile { file: string; rows: number }
export interface SplitLayer { files: SplitFile[] }
export interface SplitManifest {
  layout: number;
  dataset: string;
  builtAt: string;
  /** How many rows the data set has; every layer's files add up to it. */
  rows: number;
  head: string;
  /** How many of the first files of layers.list the page's opening needs (the rows it draws at once come first). */
  first: number;
  layers: Record<string, SplitLayer>;
  extra: string | null;
  details: { shards: number; files: string[] } | null;
}
/** The head part: the figures shown at once, the short keys, and each row's place in the original list. */
export interface SplitHead<T = Record<string, unknown>> { keys: string[]; order: number[]; data: T }

/** The path under data/ of a part (or of the manifest, with no file). */
export const splitPath = (dataset: string, file = "manifest.json") => `split/${dataset}/${file}`;

/** True when a path under data/ is a split part, whose bytes never change: it needs no release stamp to stay fresh. */
export const isSplitPart = (path: string): boolean => {
  const match = /^split\/([a-z][a-z0-9-]{0,40})\/([^/]+)$/.exec(path);
  return Boolean(match && SPLIT_PART.test(match[2]));
};

const fail = (dataset: string, what: string, value: unknown): never => {
  throw new Error(`data/split/${dataset}/manifest.json: ${what} (got ${JSON.stringify(value)?.slice(0, 80)})`);
};
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const count = (value: unknown, max: number) => Number.isInteger(value) && (value as number) >= 0 && (value as number) <= max;

function readFiles(dataset: string, name: string, value: unknown): SplitFile[] {
  if (!Array.isArray(value) || value.length > MAX_FILES) return fail(dataset, `layer ${name} needs a list of at most ${MAX_FILES} files`, value);
  return value.map((entry) => {
    if (!isRecord(entry) || typeof entry.file !== "string" || !SPLIT_PART.test(entry.file) || !count(entry.rows, 10_000_000)) return fail(dataset, `layer ${name} has a bad file entry`, entry);
    return { file: entry.file, rows: entry.rows as number };
  });
}

/** The manifest checked field by field: only plain part names, sane counts, layers that each cover every row. */
export function parseSplitManifest(value: unknown, dataset: string): SplitManifest {
  if (!DATASET.test(dataset)) return fail(dataset, "not a data set name", dataset);
  if (!isRecord(value)) return fail(dataset, "not an object", value);
  if (value.layout !== SPLIT_LAYOUT) return fail(dataset, `layout ${SPLIT_LAYOUT} expected`, value.layout);
  if (value.dataset !== dataset) return fail(dataset, `the manifest of ${dataset} expected`, value.dataset);
  if (!count(value.rows, 10_000_000)) return fail(dataset, "rows must be a whole number", value.rows);
  if (typeof value.head !== "string" || !SPLIT_PART.test(value.head)) return fail(dataset, "head must be a part name", value.head);
  if (!isRecord(value.layers) || !isRecord(value.layers.list)) return fail(dataset, "layers.list is required", value.layers);
  const layers: Record<string, SplitLayer> = {};
  for (const [name, layer] of Object.entries(value.layers)) {
    if (!DATASET.test(name) || !isRecord(layer)) return fail(dataset, "a layer needs a plain name and its files", name);
    layers[name] = { files: readFiles(dataset, name, layer.files) };
    const total = layers[name].files.reduce((sum, f) => sum + f.rows, 0);
    if (total !== value.rows) return fail(dataset, `layer ${name} covers ${total} rows, not ${value.rows}`, total);
  }
  if (!count(value.first, layers.list.files.length)) return fail(dataset, "first must count files of layers.list", value.first);
  if (value.extra !== null && (typeof value.extra !== "string" || !SPLIT_PART.test(value.extra))) return fail(dataset, "extra must be a part name or null", value.extra);
  let details: SplitManifest["details"] = null;
  if (value.details !== null) {
    const d = value.details;
    if (!isRecord(d) || !count(d.shards, MAX_SHARDS) || (d.shards as number) < 1 || !Array.isArray(d.files) || d.files.length !== d.shards || !d.files.every((f) => typeof f === "string" && SPLIT_PART.test(f)))
      return fail(dataset, `details needs 1-${MAX_SHARDS} shards, one part name each`, d);
    details = { shards: d.shards as number, files: d.files as string[] };
  }
  return { layout: SPLIT_LAYOUT, dataset, builtAt: String(value.builtAt ?? ""), rows: value.rows as number, head: value.head, first: value.first as number, layers, extra: value.extra as string | null, details };
}

/** The shard of an id: FNV-1a over its UTF-8 bytes, so the build (Node), the browser and the phone agree. */
export function shardOf(id: string, shards: number): number {
  let hash = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(id)) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash % shards;
}

/** A row written with short keys (an object's key is its index in `keys`, in base 36) with its real keys put back. */
export function expandRow(value: unknown, keys: readonly string[]): unknown {
  if (Array.isArray(value)) return value.map((item) => expandRow(item, keys));
  if (!isRecord(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [short, item] of Object.entries(value)) {
    const key = keys[parseInt(short, 36)];
    if (key === undefined) throw new Error(`Split data: short key "${short}" is not in the head's ${keys.length} keys`);
    out[key] = expandRow(item, keys);
  }
  return out;
}

/** `more` added into `base`: objects merge key by key, anything else in `more` wins. Neither input is changed. */
export function mergeDeep<T>(base: T, more: unknown): T {
  if (!isRecord(base) || !isRecord(more)) return (more === undefined ? base : more) as T;
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(more)) out[key] = key in out ? mergeDeep(out[key], value) : value;
  return out as T;
}

/** A layer's parts, read in order, as one array of rows in the original order (head.order). */
export function assembleRows(parts: readonly unknown[][], head: SplitHead<unknown>, expected: number): unknown[] {
  const rows = parts.flat();
  if (rows.length !== expected) throw new Error(`Split data: ${rows.length} rows read, ${expected} expected`);
  const out = new Array<unknown>(head.order.length);
  rows.forEach((row, i) => { out[head.order[i]] = expandRow(row, head.keys); });
  return out;
}
