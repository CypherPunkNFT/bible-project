// The source directory as a split data set (scripts/split-data/datasets.ts): the Sources and Versions pages
// (src/components/sources/useSourceDirectory.ts) read it instead of directory.json (7.8 MB, 16,895 records) and
// facets.json (1.6 MB of author metadata), which a phone downloaded whole (about 760 KB compressed, job 44d0c454).
// Both are made by scripts/source-directory.ts on every build, which writes this split straight after them.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Dataset } from "./engine.ts";

type Row = Record<string, unknown>;
const FACETS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../public/content/sources/facets.json");

/** The author metadata facets.json holds for each record, or null when it was made from other records than these (the
 *  check the page made itself before the split: the SHA-256 of the records as JSON). */
function currentFacets(entries: Row[]): Record<string, Row> | null {
  const facets = JSON.parse(readFileSync(FACETS, "utf8")) as { schemaVersion?: number; entriesSha256?: string; records?: Record<string, Row> };
  const hash = createHash("sha256").update(JSON.stringify(entries)).digest("hex");
  return facets.schemaVersion === 1 && facets.entriesSha256 === hash && facets.records ? facets.records : null;
}

/** Records and author groups in each collection: the Overview and Collections show them before the list loads. */
function collectionCounts(collections: Row[], entries: Row[]) {
  return Object.fromEntries(collections.map(({ id }) => {
    const members = entries.filter((entry) => (entry.categories as string[]).includes(id as string));
    return [id, { records: members.length, authors: new Set(members.map((entry) => entry.author)).size }];
  }));
}

/** The opening is the head alone: the collections, providers, corpus figures and the counts above (about 10 KB
 *  compressed). The list layer is what the catalogue's cards, search, filters and counts, the collections' previews and
 *  the review queues read, with the two author facts the Tradition and Era filters count; links stay whole (the engine
 *  keeps an array whole). A record's status, role, use basis and its authors' names, dates and evidence come from its
 *  details shard when it is opened. */
export const sources: Dataset = {
  name: "sources",
  source: "public/content/sources/directory.json",
  rows: (source) => {
    const entries = source.entries as Row[];
    const facets = currentFacets(entries);
    return facets ? entries.map((entry) => (facets[entry.id as string] ? { ...entry, metadata: facets[entry.id as string] } : entry)) : entries;
  },
  id: (row) => row.id as string,
  head: (source) => {
    const { entries, ...summary } = source as Row & { entries: Row[] };
    const counts = collectionCounts(source.collections as Row[], entries);
    return { ...summary, split: { schemaVersion: 1, records: entries.length, collections: counts, facets: currentFacets(entries) ? "ready" : "stale" } };
  },
  extra: null,
  opening: () => false,
  layers: {
    list: { id: 1, title: 1, author: 1, categories: 1, kind: 1, held: 1, citedOn: 1, links: 1, metadata: { traditions: 1, eras: 1 } },
  },
  detailShards: 64,
};
