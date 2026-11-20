// The source directory's split (scripts/split-data/sources.ts): the head carries the counts the page used to count from
// the records, the list carries what the list views read and nothing a record's dialog alone needs, and author facets
// made from other records are left out rather than laid on the wrong ones. Every row coming back whole is checked by the
// engine itself (buildDataset throws otherwise).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readBudget } from '../../../scripts/split-data.ts';
import { buildDataset } from '../../../scripts/split-data/engine.ts';
import { sources } from '../../../scripts/split-data/sources.ts';
import { assembleRows, shardOf, type SplitHead } from '../../lib/split-data';
import type { Directory, SourceEntry } from './types';

const original = JSON.parse(readFileSync('public/content/sources/directory.json', 'utf8')) as Directory & { entries: SourceEntry[] };
const build = (source: typeof original) => {
  const { manifest, files } = buildDataset(sources, source as unknown as Record<string, unknown>, readBudget(), '');
  const read = <T,>(file: string) => JSON.parse(files.get(file)!.toString('utf8')) as T;
  const head = read<SplitHead<Directory>>(manifest.head);
  const list = assembleRows(manifest.layers.list.files.map(f => read<unknown[]>(f.file)), head, manifest.rows) as SourceEntry[];
  const shard = (id: string) => read<Record<string, Partial<SourceEntry>>>(manifest.details!.files[shardOf(id, manifest.details!.shards)])[id];
  return { manifest, head, list, shard };
};
const built = build(original);

describe('source directory split', () => {
  it('opens on the head alone, with the counts the page computes from the records', () => {
    const { manifest, head } = built;
    expect(manifest.first).toBe(0);
    expect(head.data.entries).toBeUndefined();
    expect(head.data.split?.records).toBe(original.entries.length);
    for (const { id } of original.collections) {
      const members = original.entries.filter(entry => entry.categories.includes(id));
      expect(head.data.split?.collections[id], id).toEqual({ records: members.length, authors: new Set(members.map(e => e.author)).size });
    }
    expect(head.data.collections).toEqual(original.collections);
  });

  it('lists what the cards, search and filters read; the rest comes with the opened record', () => {
    const { list, shard } = built;
    expect(list.map(e => e.id)).toEqual(original.entries.map(e => e.id));
    const withMetadata = list.find(e => e.metadata)!;
    expect(Object.keys(withMetadata.metadata!).sort()).toEqual(['eras', 'traditions']);
    for (const entry of list) expect([entry.status, entry.role, entry.basis]).toEqual([undefined, undefined, undefined]);
    const first = original.entries[0];
    expect(list[0].links).toEqual(first.links);
    expect(shard(first.id)?.status).toBe(first.status);
    expect(shard(withMetadata.id)?.metadata).toHaveProperty('authors');
  });

  it('leaves the author facets out, and says so, when they were made from other records', () => {
    const changed = { ...original, entries: original.entries.map((e, i) => (i ? e : { ...e, title: `${e.title} (changed)` })) };
    const { head, list } = build(changed);
    expect(head.data.split?.facets).toBe('stale');
    expect(list.some(e => e.metadata)).toBe(false);
    expect(built.head.data.split?.facets).toBe('ready');
  });
});
