// The cross-reference arcs as the arc chart reads them (src/components/charts/ArcDiagram.tsx): the chapters, the totals
// and each book's references with the later books from the split's opening (data/split/arcs, about 10 KB compressed,
// scripts/split-data/study-datasets.ts), and a book's own chapter arcs only when it is lit, from its details shard
// (owner, 2026-11-19: the 1.7 MB xref-arcs.json was read whole before the chart drew). Where the split is missing (an
// older release) the whole file is read once and cut the same way in memory.
import { loadArcs, loadSplitManifest, loadSplitPart } from "./data";
import { assembleRows, shardOf, type SplitHead } from "./split-data";
import type { ArcData } from "./types";

export type Arc = ArcData["arcs"][number];
/** One book: its chapter labels, its references (every arc touching it), and its references with each later book. */
export interface ArcBook { code: string; chapters: string[]; count: number; links: Record<string, number> }
export interface ArcSource {
  /** Every chapter's label ("GEN 1"), in Bible order; an arc's ends are indexes into it. */
  chapters: string[];
  /** How many chapter pairs there are, and their references added up: the pre-drawn picture is matched by both. */
  arcs: number;
  references: number;
  books: ArcBook[];
  /** The book's chapter arcs (both ends, every pair touching it), weakest first so the strong ones are drawn on top. */
  bookArcs: (code: string) => Promise<Arc[]>;
}

const DATASET = "arcs";
const weakestFirst = (arcs: Arc[]) => [...arcs].sort((a, b) => a[2] - b[2]);
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

async function fromSplit(): Promise<ArcSource> {
  const manifest = await loadSplitManifest(DATASET);
  const [head, ...parts] = await Promise.all([
    loadSplitPart<SplitHead<{ arcs: number; references: number }>>(DATASET, manifest.head, (v) => isObject(v) && Array.isArray(v.keys) && isObject(v.data)),
    ...manifest.layers.list.files.map((f) => loadSplitPart<unknown[]>(DATASET, f.file, Array.isArray)),
  ]);
  const books = assembleRows(parts as unknown[][], head, manifest.rows) as ArcBook[];
  const details = manifest.details;
  const sorted = new Map<string, Promise<Arc[]>>();
  const bookArcs = (code: string) => {
    if (!details) return Promise.resolve([]);
    let pending = sorted.get(code);
    if (!pending) {
      pending = loadSplitPart<Record<string, { arcs?: Arc[] }>>(DATASET, details.files[shardOf(code, details.shards)], isObject)
        .then((shard) => weakestFirst(shard[code]?.arcs ?? []));
      pending.catch(() => sorted.delete(code));
      sorted.set(code, pending);
    }
    return pending;
  };
  return { chapters: books.flatMap((book) => book.chapters), arcs: head.data.arcs, references: head.data.references, books, bookArcs };
}

/** The same source cut from the whole xref-arcs.json in memory. */
export function arcSourceOf(data: ArcData): ArcSource {
  const bookOf = data.chapters.map((label) => label.split(" ")[0]);
  const byCode = new Map<string, ArcBook & { arcs: Arc[] }>();
  data.chapters.forEach((label, i) => {
    if (!byCode.has(bookOf[i])) byCode.set(bookOf[i], { code: bookOf[i], chapters: [], count: 0, links: {}, arcs: [] });
    byCode.get(bookOf[i])!.chapters.push(label);
  });
  let references = 0;
  for (const arc of weakestFirst(data.arcs)) {
    const [a, b] = [bookOf[arc[0]], bookOf[arc[1]]];
    references += arc[2];
    for (const code of new Set([a, b])) { byCode.get(code)!.arcs.push(arc); byCode.get(code)!.count += arc[2]; }
    if (a !== b) byCode.get(a)!.links[b] = (byCode.get(a)!.links[b] ?? 0) + arc[2];
  }
  const books = [...byCode.values()].map(({ code, chapters, count, links }): ArcBook => ({ code, chapters, count, links }));
  return { chapters: data.chapters, arcs: data.arcs.length, references, books, bookArcs: (code) => Promise.resolve(byCode.get(code)?.arcs ?? []) };
}

let run: Promise<ArcSource> | null = null;
export const loadArcSource = (): Promise<ArcSource> => run ??= fromSplit().catch((error: unknown) => {
  console.warn("Arcs: the split could not be read; reading xref-arcs.json whole.", error);
  return loadArcs().then(arcSourceOf);
}).catch((error: unknown) => { run = null; throw error; });
