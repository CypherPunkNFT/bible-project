// The split engine (scripts/split-data.ts): one data set cut into layers, details, head and extra, in memory. Kept apart
// from the command so the budget test (src/lib/data-budgets.test.ts) builds exactly what the command writes.
// The form of the parts and how a page reads them: src/lib/split-data.ts.
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { mergeDeep, SPLIT_LAYOUT, shardOf, type SplitManifest } from "../../src/lib/split-data.ts";

/** Which parts of a row a layer keeps: 1 keeps the value whole, an object keeps those keys ("*" every key). */
export type Shape = 1 | { [key: string]: Shape };
type Row = Record<string, unknown>;

export interface Dataset {
  name: string;
  /** The file the rows come from, relative to Website/. */
  source: string;
  rows: (source: Row) => Row[];
  id: (row: Row) => string;
  /** The figures shown at once, kept small: they are part of every page's first load. */
  head: (source: Row) => Record<string, unknown>;
  /** Large figures read only with the whole list, or null. */
  extra: ((source: Row) => Record<string, unknown>) | null;
  /** The rows the page's opening draws, which go first so the first few list files hold them. */
  opening: (row: Row) => boolean;
  /** layers.list is required; every layer keeps the same row order. */
  layers: Record<string, Shape>;
  detailShards: number;
}

export interface Budget { gzipBytes: number; rawBytes: number; level: number }
export interface Built { manifest: SplitManifest; files: Map<string, Buffer> }

const isRecord = (value: unknown): value is Row => typeof value === "object" && value !== null && !Array.isArray(value);
export const gzipSize = (bytes: Buffer, level: number) => gzipSync(bytes, { level }).length;

/** The parts of `value` that `shape` keeps; keys absent in the row stay absent. */
export function prune(value: unknown, shape: Shape): unknown {
  if (shape === 1 || !isRecord(value)) return value;
  const out: Row = {};
  for (const [key, item] of Object.entries(value)) {
    const sub = shape[key] ?? shape["*"];
    if (sub !== undefined) out[key] = prune(item, sub);
  }
  return out;
}

/** What no layer keeps, or undefined when the layers keep everything. */
export function remainder(value: unknown, shapes: Shape[]): unknown {
  if (!isRecord(value)) return shapes.length ? undefined : value;
  const out: Row = {};
  for (const [key, item] of Object.entries(value)) {
    const subs = shapes.flatMap((shape) => shape === 1 ? [1 as const] : (shape[key] ?? shape["*"]) !== undefined ? [shape[key] ?? shape["*"]] : []);
    if (subs.includes(1)) continue;
    // A key no layer names stays whole, even an empty object; a key a layer names keeps only what that layer drops.
    if (!subs.length) { out[key] = item; continue; }
    const rest = remainder(item, subs);
    if (rest !== undefined) out[key] = rest;
  }
  return Object.keys(out).length ? out : undefined;
}

/** Equal as JSON values, whatever the order of an object's keys. */
export function sameJson(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) || Array.isArray(b)) return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((item, i) => sameJson(item, b[i]));
  if (isRecord(a) && isRecord(b)) {
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every((key) => key in b && sameJson(a[key], b[key]));
  }
  return a === b;
}

/** Objects written with short keys: each key's index in the shared table, in base 36. */
function shorten(value: unknown, table: Map<string, string>): unknown {
  if (Array.isArray(value)) return value.map((item) => shorten(item, table));
  if (!isRecord(value)) return value;
  const out: Row = {};
  for (const [key, item] of Object.entries(value)) {
    if (!table.has(key)) table.set(key, table.size.toString(36));
    out[table.get(key)!] = shorten(item, table);
  }
  return out;
}

const json = (value: unknown) => Buffer.from(JSON.stringify(value));
function named(files: Map<string, Buffer>, stem: string, bytes: Buffer): string {
  const file = `${stem}.${createHash("sha256").update(bytes).digest("hex").slice(0, 12)}.json`;
  files.set(file, bytes);
  return file;
}

/** Rows cut into files that each stay under the budget: sized from the whole layer's gzip ratio, halved if one is over. */
function chunk(rows: unknown[], budget: Budget): unknown[][] {
  const whole = json(rows), ratio = whole.length / Math.max(1, gzipSize(whole, budget.level));
  const target = Math.min(budget.gzipBytes * 0.85 * ratio, budget.rawBytes * 0.85);
  const chunks: unknown[][] = [];
  let current: unknown[] = [], size = 0;
  for (const row of rows) {
    const length = JSON.stringify(row).length + 1;
    if (current.length && size + length > target) { chunks.push(current); current = []; size = 0; }
    current.push(row); size += length;
  }
  if (current.length) chunks.push(current);
  const fit = (part: unknown[]): unknown[][] => {
    const bytes = json(part);
    if (part.length < 2 || (gzipSize(bytes, budget.level) <= budget.gzipBytes && bytes.length <= budget.rawBytes)) return [part];
    return [...fit(part.slice(0, part.length >> 1)), ...fit(part.slice(part.length >> 1))];
  };
  return chunks.flatMap((part) => fit(part));
}

/** The data set built in memory; throws if any row would not come back exactly as it went in. */
export function buildDataset(dataset: Dataset, source: Row, budget: Budget, builtAt: string): Built {
  if (!dataset.layers.list) throw new Error(`Split data ${dataset.name}: layers.list is required`);
  const all = dataset.rows(source);
  const ids = new Set<string>();
  for (const row of all) {
    const id = dataset.id(row);
    if (typeof id !== "string" || !id || ids.has(id)) throw new Error(`Split data ${dataset.name}: every row needs its own id; "${id}" is missing or repeated`);
    ids.add(id);
  }
  // Rows the opening draws first; order[i] is the original place of the i-th row written.
  const order = all.map((_, i) => i).sort((a, b) => Number(dataset.opening(all[b])) - Number(dataset.opening(all[a])) || a - b);
  const openingRows = all.filter(dataset.opening).length;
  const table = new Map<string, string>(), files = new Map<string, Buffer>();
  const layers: SplitManifest["layers"] = {};
  let first = 0;
  for (const [name, shape] of Object.entries(dataset.layers)) {
    const parts = chunk(order.map((i) => shorten(prune(all[i], shape), table)), budget);
    layers[name] = { files: parts.map((part, n) => ({ file: named(files, `${name}-${n}`, json(part)), rows: part.length })) };
    if (name === "list") for (let seen = 0; seen < openingRows; first++) seen += parts[first].length;
  }
  const shapes = Object.values(dataset.layers);
  const shards: Record<string, unknown>[] = Array.from({ length: dataset.detailShards }, () => ({}));
  for (const row of all) {
    const rest = remainder(row, shapes);
    if (rest !== undefined) shards[shardOf(dataset.id(row), dataset.detailShards)][dataset.id(row)] = rest;
    const back = mergeDeep(shapes.reduce<unknown>((sum, shape) => mergeDeep(sum, prune(row, shape)), {}), rest);
    if (!sameJson(back, row)) throw new Error(`Split data ${dataset.name}: row ${dataset.id(row)} does not come back whole from its layers and details`);
  }
  const keys = [...table.keys()];
  const head = named(files, "head", json({ keys, order, data: dataset.head(source) }));
  const extra = dataset.extra ? named(files, "extra", json(dataset.extra(source))) : null;
  const details = { shards: dataset.detailShards, files: shards.map((shard, n) => named(files, `details-${n}`, json(shard))) };
  const manifest: SplitManifest = { layout: SPLIT_LAYOUT, dataset: dataset.name, builtAt, rows: all.length, head, first, layers, extra, details };
  return { manifest, files };
}
