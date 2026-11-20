// The Scholars population read from its split files (scripts/split-data/datasets.ts, src/lib/split-data.ts) instead of
// the 13-23 MB index.json (owner, 2026-11-19): the opening reads the head and the first list files only (the timeline's
// supported birth years, about 275 KB compressed); the whole list (list, titles and extra) once a section below the
// opening, a search or a profile wants it (catalogue/useLibrary.ts); the search
// text when someone searches; the rest of one record when it is opened. Where data/split/scholars is missing (a fresh
// checkout before npm run split-data, an older release) the page falls back to index.json (catalogue/useLibrary.ts).
import { loadSplitManifest, loadSplitPart } from '@/lib/data';
import { assembleRows, expandRow, mergeDeep, shardOf, type SplitHead, type SplitManifest } from '@/lib/split-data';
import type { PopulationEntry, PopulationSnapshot } from './population';

const DATASET = 'scholars';
type HeadData = Pick<PopulationSnapshot, 'schemaVersion' | 'builtAt' | 'summary' | 'factSummary'>;
type Extra = Pick<PopulationSnapshot, 'sourceCredits' | 'reconciliation'>;
const isHead = (v: unknown) => typeof v === 'object' && v !== null && Array.isArray((v as SplitHead).keys) && Array.isArray((v as SplitHead).order);

/** The population as the page reads it, with the split it came from (for the search text and a record's details). */
export interface SplitPopulation { manifest: SplitManifest; head: SplitHead<HeadData>; snapshot: PopulationSnapshot }

let manifestRun: Promise<SplitManifest> | null = null;
const manifest = () => manifestRun ??= loadSplitManifest(DATASET).catch(error => { manifestRun = null; throw error; });
const head = async (m: SplitManifest) => loadSplitPart<SplitHead<HeadData>>(DATASET, m.head, isHead);
const layer = (m: SplitManifest, name: string, files = m.layers[name].files) => Promise.all(files.map(f => loadSplitPart<unknown[]>(DATASET, f.file, Array.isArray)));

const snapshotOf = (h: SplitHead<HeadData>, entries: PopulationEntry[], extra: Partial<Extra>): PopulationSnapshot =>
  ({ ...h.data, sourceCredits: {}, ...extra, entries } as PopulationSnapshot);

/** The opening: the head's figures and the rows the first list files hold (every supported birth year), in their
 *  original order. Counts that need the whole list wait for loadSplitPopulation. */
export async function loadSplitOpening(): Promise<SplitPopulation> {
  const m = await manifest(), h = await head(m);
  const files = m.layers.list.files.slice(0, m.first), parts = await layer(m, 'list', files);
  const entries: [number, PopulationEntry][] = parts.flat().map((row, i) => [h.order ? h.order[i] : i, expandRow(row, h.keys) as PopulationEntry]);
  entries.sort((a, b) => a[0] - b[0]);
  return { manifest: m, head: h, snapshot: snapshotOf(h, entries.map(([, e]) => e), {}) };
}

/** The whole list: every list row with its work titles, and the large figures (source credits, reconciliation). The
 *  opening's manifest and head are used when it has loaded, so they are not read twice. */
export async function loadSplitPopulation(opening: SplitPopulation | null = null): Promise<SplitPopulation> {
  const m = opening?.manifest ?? await manifest();
  const [h, list, titles, extra] = await Promise.all([opening?.head ?? head(m), layer(m, 'list'), m.layers.titles ? layer(m, 'titles') : null,
    m.extra ? loadSplitPart<Extra>(DATASET, m.extra) : null]);
  const rows = assembleRows(list, h, m.rows) as PopulationEntry[];
  const withTitles = titles ? assembleRows(titles, h, m.rows) : null;
  const entries = withTitles ? rows.map((row, i) => mergeDeep(row, withTitles[i])) : rows;
  return { manifest: m, head: h, snapshot: snapshotOf(h, entries, extra ?? {}) };
}

/** Every entry's search text (the titles of all its works), by id. */
export async function loadSplitSearch(split: SplitPopulation): Promise<Record<string, string>> {
  const rows = assembleRows(await layer(split.manifest, 'search'), split.head, split.manifest.rows) as { searchText?: string }[];
  const ids = split.snapshot.entries.length === rows.length ? split.snapshot.entries.map(e => e.id) : null;
  if (!ids) throw new Error(`Scholars search text: ${rows.length} rows for ${split.snapshot.entries.length} entries`);
  return Object.fromEntries(rows.map((row, i) => [ids[i], row.searchText ?? '']));
}

/** One entry with everything the list leaves out (sources, evidence, join basis, example ids) put back. */
export async function loadSplitDetails(split: SplitPopulation, entry: PopulationEntry): Promise<PopulationEntry> {
  const details = split.manifest.details;
  if (!details) return entry;
  const shard = await loadSplitPart<Record<string, unknown>>(DATASET, details.files[shardOf(entry.id, details.shards)]);
  return Object.prototype.hasOwnProperty.call(shard, entry.id) ? mergeDeep(entry, shard[entry.id]) : entry;
}
