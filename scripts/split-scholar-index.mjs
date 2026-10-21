// Splits the built scholars index (dist/content/scholar-population/index.json, 23 MB for 9,106 scholars) so the
// Scholars, Preachers and Analysis pages stop downloading everything up front (load scan, 2026-10-20):
//   index.json          the list: everything the cards, filters, timelines and counts use
//   search.json         { id: searchText }, fetched when a visitor first searches
//   details/<xx>.json   per-scholar sources and review evidence, fetched when a scholar's record is opened;
//                       64 bundles keyed like the page's detailsShard() in population.ts
//   analysis.json       names, dates and work counts only: the Analysis page's whole list (1.9 MB instead of the
//                       13 MB list; 2026-10-21). The page falls back to index.json where this file is absent (dev mode).
// The source file in public/ is never touched; dev mode serves it whole and the page handles both forms.
// Usage: node scripts/split-scholar-index.mjs [dir]   (default dist/content/scholar-population)
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const SHARDS = 64;
export const detailsShard = (id) => (createHash('sha256').update(id).digest()[0] >> 2).toString(16).padStart(2, '0');

/** Moves an entry's detail-only fields out; returns them, or null when there were none. */
function takeDetails(entry) {
  const dates = entry.facts?.dates ?? {}, identity = entry.identity ?? {};
  const fieldBasis = Object.fromEntries(Object.entries(entry.fields ?? {}).filter(([, f]) => f && 'basis' in f).map(([key, f]) => [key, f.basis]));
  const details = { provenance: entry.provenance, evidence: dates.evidence, legacyLabels: dates.legacyLabels,
    joinBasis: identity.joinBasis, authorities: identity.authorities, fieldBasis };
  delete entry.provenance; delete dates.evidence; delete dates.legacyLabels; delete identity.joinBasis; delete identity.authorities;
  for (const f of Object.values(entry.fields ?? {})) if (f) delete f.basis;
  return details;
}

/** The fields AnalysisPage.tsx reads, in the shape of the full entry. */
function analysisEntry(entry) {
  const { status, born, died, floruit, approximate, sourceConflict } = entry.facts?.dates ?? {};
  return { id: entry.id, name: entry.name, aliases: entry.aliases ?? [], verifiedAliases: entry.verifiedAliases ?? [],
    facts: { dates: { status, born, died, floruit, approximate, sourceConflict } }, counts: { workGroups: entry.counts?.workGroups ?? 0 } };
}

export function splitScholarIndex(dir) {
  const file = path.join(dir, 'index.json');
  const snapshot = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (snapshot.split) return { skipped: 'already split' };
  if (!Array.isArray(snapshot.entries)) throw Error(`Unexpected scholars index at ${file}: no entries array`);
  const search = {}, shards = new Map();
  for (const entry of snapshot.entries) {
    if (typeof entry.id !== 'string') throw Error(`Scholars index entry without an id in ${file}`);
    search[entry.id] = entry.searchText ?? '';
    delete entry.searchText;
    const shard = detailsShard(entry.id);
    if (!shards.has(shard)) shards.set(shard, {});
    shards.get(shard)[entry.id] = takeDetails(entry);
  }
  const detailsDir = path.join(dir, 'details');
  fs.mkdirSync(detailsDir, { recursive: true });
  for (const [shard, rows] of shards) fs.writeFileSync(path.join(detailsDir, `${shard}.json`), JSON.stringify(rows), 'utf8');
  fs.writeFileSync(path.join(dir, 'search.json'), JSON.stringify(search), 'utf8');
  fs.writeFileSync(path.join(dir, 'analysis.json'), JSON.stringify({ entries: snapshot.entries.map(analysisEntry) }), 'utf8');
  snapshot.split = { schemaVersion: 1, search: 'search.json', details: 'details', shards: SHARDS };
  fs.writeFileSync(file, JSON.stringify(snapshot), 'utf8');
  return { entries: snapshot.entries.length, detailFiles: shards.size, indexBytes: fs.statSync(file).size };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const dir = path.resolve(process.argv[2] ?? path.join(root, 'dist/content/scholar-population'));
  if (!dir.startsWith(path.join(root, 'dist')) && !dir.includes(`${path.sep}.release${path.sep}`)) throw Error(`Refusing to split outside dist/ or a release copy: ${dir}`);
  console.log('Scholars index split:', splitScholarIndex(dir));
}
