// Circles of study's data as the explorer reads it (runtime.mjs), from its split (data/split/circles,
// scripts/split-data/study-datasets.ts): the categories, studies, leaders and featured works, and the catalogue's works,
// at once (about 115 KB compressed instead of 310 KB); a leader's own works (Spurgeon's sermons) when that leader's page
// opens; a work's records and its reading copy when the work is opened. Where the split is missing (an older release)
// it reads public/circles/catalogue.json and readers.json whole, as before.
import { loadSplitManifest, loadSplitPart } from "@/lib/data";
import { assembleRows, expandRow, shardOf, type SplitHead, type SplitManifest } from "@/lib/split-data";

type Work = Record<string, unknown> & { id: string; leader: string; records?: unknown[] };
type Reader = Record<string, unknown>;
interface Head { categories: unknown[]; studies: unknown[]; leaders: unknown[]; featured: string[]; works: number; leaderWorks: Record<string, number> }
export interface CirclesData {
  categories: unknown[]; studies: unknown[]; leaders: unknown[]; works: Work[]; featured: string[];
  /** Each leader's own works, by leader id: every leader's in the whole file, filled in by leaderWorksOf from the split. */
  leaderWorks: Record<string, Work[]>;
  /** A leader's own works ([] for a leader without any). */
  leaderWorksOf: (leaderId: string) => Promise<Work[]>;
  /** A work's records (where it appears on the site) and its reading copy's place, or nothing known. */
  detailsOf: (workId: string) => Promise<{ records: unknown[]; reader: Reader | undefined }>;
}

const DATASET = "circles";
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isHead = (v: unknown) => isObject(v) && Array.isArray(v.keys) && isObject(v.data);

async function fromWholeFiles(signal?: AbortSignal): Promise<CirclesData> {
  const response = await fetch("/circles/catalogue.json", { signal });
  if (!response.ok) throw new Error("The study catalogue could not load.");
  const readerResponse = await fetch("/circles/readers.json", { signal });
  const readerData: { readers: Record<string, Reader>; featured?: string[] } = readerResponse.ok ? await readerResponse.json() : { readers: {} };
  const catalogue = await response.json();
  const works = [...catalogue.works, ...Object.values(catalogue.leaderWorks ?? {}).flat()] as Work[];
  const byId = new Map(works.map((work) => [work.id, work]));
  return { categories: catalogue.categories, studies: catalogue.studies, leaders: catalogue.leaders, works: catalogue.works, featured: readerData.featured ?? [],
    leaderWorks: catalogue.leaderWorks ?? {}, leaderWorksOf: async (id) => catalogue.leaderWorks?.[id] ?? [],
    detailsOf: async (id) => ({ records: byId.get(id)?.records ?? [], reader: readerData.readers[id] }) };
}

async function fromSplit(): Promise<CirclesData> {
  const manifest: SplitManifest = await loadSplitManifest(DATASET);
  const list = manifest.layers.list.files;
  const [head, ...opening] = await Promise.all([loadSplitPart<SplitHead<Head>>(DATASET, manifest.head, isHead),
    ...list.slice(0, manifest.first).map((f) => loadSplitPart<unknown[]>(DATASET, f.file, Array.isArray))]);
  // The opening's rows with their places in the original list: the catalogue's works are its first head.data.works.
  const place = (i: number) => (head.order ? head.order[i] : i);
  const works: Work[] = [];
  opening.flat().forEach((row, i) => { if (place(i) < head.data.works) works[place(i)] = expandRow(row, head.keys) as Work; });
  if (works.length !== head.data.works || works.includes(undefined as unknown as Work)) throw new Error(`Circles: the opening holds ${works.filter(Boolean).length} of the catalogue's ${head.data.works} works`);
  const leaderWorks: Record<string, Work[]> = {};
  let everyRow: Promise<Work[]> | null = null;
  const leaderWorksOf = async (id: string) => {
    if (leaderWorks[id] || !head.data.leaderWorks[id]) return leaderWorks[id] ?? [];
    everyRow ??= Promise.all(list.map((f) => loadSplitPart<unknown[]>(DATASET, f.file, Array.isArray)))
      .then((parts) => assembleRows(parts, head, manifest.rows) as Work[]);
    const rows = await everyRow.catch((error: unknown) => { everyRow = null; throw error; });
    return leaderWorks[id] = rows.slice(head.data.works).filter((work) => work.leader === id);
  };
  const details = manifest.details;
  const detailsOf = async (id: string) => {
    if (!details) return { records: [], reader: undefined };
    const shard = await loadSplitPart<Record<string, { records?: unknown[]; reader?: Reader }>>(DATASET, details.files[shardOf(id, details.shards)], isObject);
    return { records: shard[id]?.records ?? [], reader: shard[id]?.reader };
  };
  return { categories: head.data.categories, studies: head.data.studies, leaders: head.data.leaders, works, featured: head.data.featured, leaderWorks, leaderWorksOf, detailsOf };
}

export function loadCircles(signal?: AbortSignal): Promise<CirclesData> {
  return fromSplit().catch((error: unknown) => {
    if (signal?.aborted) throw error;
    console.warn("Circles: the split catalogue could not be read; reading catalogue.json and readers.json whole.", error);
    return fromWholeFiles(signal);
  });
}
