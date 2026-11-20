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

/** One row of the Analysis page (layer analysis): what its cards, search and sorts read, with its place in the original
 *  list (the split leaves the ids out, so the place is its key and breaks ties between equal names). An id is there only
 *  when the row came from a fallback file. */
export interface AnalysisRow {
  place: number;
  id?: string;
  name: string;
  aliases: string[];
  verifiedAliases: string[];
  facts: { dates: Pick<PopulationEntry['facts']['dates'], 'status' | 'born' | 'died' | 'floruit' | 'approximate' | 'sourceConflict'> };
  counts: { workGroups: number };
}
type AnalysisSource = Partial<Omit<AnalysisRow, 'place' | 'facts' | 'counts'>> & { facts?: Partial<AnalysisRow['facts']>; counts?: Partial<AnalysisRow['counts']> };

/** A row in the page's shape whichever file it came from (keys a row lacks are absent in the split). */
export const analysisRow = (row: AnalysisSource, place: number): AnalysisRow => ({
  place, ...(row.id ? { id: row.id } : {}), name: row.name ?? '', aliases: row.aliases ?? [], verifiedAliases: row.verifiedAliases ?? [],
  facts: { dates: (row.facts?.dates ?? {}) as AnalysisRow['facts']['dates'] }, counts: { workGroups: row.counts?.workGroups ?? 0 },
});

/** The Analysis page's whole list: the manifest, the head and the analysis layer (about 170 KB compressed, instead of the
 *  285 KB analysis.json or the whole list layer). */
export async function loadSplitAnalysis(): Promise<AnalysisRow[]> {
  const m = await manifest();
  if (!m.layers.analysis) throw new Error('data/split/scholars/manifest.json has no analysis layer: run npm run split-data');
  const [h, parts] = await Promise.all([head(m), layer(m, 'analysis')]);
  return (assembleRows(parts, h, m.rows) as AnalysisSource[]).map(analysisRow);
}
