// The build splits the scholars index (scripts/split-scholar-index.mjs). Putting each record's details back must give
// the original record exactly, and the page must look for a record's details in the bundle the build wrote it to.
import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, expect, it } from 'vitest';
// @ts-expect-error The build script is plain JavaScript without type declarations.
import { detailsShard as buildShard, splitScholarIndex } from '../../../../scripts/split-scholar-index.mjs';
import { detailsShard, withDetails, type PopulationDetails, type PopulationSnapshot } from './population';

const source = 'public/content/scholar-population/index.json';
const dir = mkdtempSync(path.join(tmpdir(), 'scholar-split-'));
cpSync(source, path.join(dir, 'index.json'));
const original = JSON.parse(readFileSync(source, 'utf8')) as PopulationSnapshot;
const result = splitScholarIndex(dir);
const read = <T,>(file: string) => JSON.parse(readFileSync(path.join(dir, file), 'utf8')) as T;
const slim = read<PopulationSnapshot>('index.json'), search = read<Record<string, string>>('search.json');
afterAll(() => rmSync(dir, { recursive: true, force: true }));

it('restores every record exactly from the list, its details bundle and the search text', () => {
  expect(result.entries).toBe(original.entries.length);
  expect(slim.split?.shards).toBe(64);
  const bundles = new Map<string, Record<string, PopulationDetails>>();
  original.entries.forEach((entry, i) => {
    const shard = buildShard(entry.id) as string;
    if (!bundles.has(shard)) bundles.set(shard, read(`details/${shard}.json`));
    const details = bundles.get(shard)![entry.id];
    expect(details, entry.id).toBeDefined();
    const restored = { ...withDetails(slim.entries[i], details), searchText: search[entry.id] };
    expect(JSON.parse(JSON.stringify(restored))).toEqual(entry);
  });
});

it('finds details in the same bundle the build wrote them to', async () => {
  for (const entry of original.entries.slice(0, 500)) expect(await detailsShard(entry.id)).toBe(buildShard(entry.id));
});

it('keeps the list free of detail-only fields and refuses to split twice', () => {
  const text = readFileSync(path.join(dir, 'index.json'), 'utf8');
  expect(text).not.toContain('"searchText"');
  expect(text).not.toContain('"joinBasis"');
  expect(splitScholarIndex(dir)).toEqual({ skipped: 'already split' });
});
