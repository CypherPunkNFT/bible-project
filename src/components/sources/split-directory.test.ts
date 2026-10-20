// The build splits the source directory (scripts/split-source-directory.mjs). The summary plus its records must give the
// original file back exactly, and the counts it carries must equal what the page used to count from the records.
import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, expect, it } from 'vitest';
// @ts-expect-error The build script is plain JavaScript without type declarations.
import { splitSourceDirectory } from '../../../scripts/split-source-directory.mjs';
import { isScholarsOnlySource } from '@/lib/editorial-sources';
import type { Directory, SourceEntry } from './types';

const source = 'public/content/sources/directory.json';
const dir = mkdtempSync(path.join(tmpdir(), 'source-split-'));
cpSync(source, path.join(dir, 'directory.json'));
const original = JSON.parse(readFileSync(source, 'utf8')) as Directory & { entries: SourceEntry[] };
const result = splitSourceDirectory(dir);
const read = <T,>(file: string) => JSON.parse(readFileSync(path.join(dir, file), 'utf8')) as T;
const summary = read<Directory>('directory.json'), records = read<{ entries: SourceEntry[] }>('entries.json');
afterAll(() => rmSync(dir, { recursive: true, force: true }));

it('restores the original directory exactly from the summary and its records', () => {
  expect(result.entries).toBe(original.entries.length);
  expect(summary.entries).toBeUndefined();
  const { split, ...rest } = summary;
  expect(split?.entries).toBe('entries.json');
  expect({ ...rest, entries: records.entries }).toEqual(original);
});

it('carries the same counts the page computes from the records', () => {
  const shown = original.entries.filter(entry => !isScholarsOnlySource(JSON.stringify(entry)));
  expect(summary.split?.records).toBe(shown.length);
  for (const { id } of original.collections) {
    const members = shown.filter(entry => entry.categories.includes(id));
    expect(summary.split?.collections[id], id).toEqual({ records: members.length, authors: new Set(members.map(e => e.author)).size });
  }
});

it('keeps the summary small and refuses to split twice', () => {
  expect(result.summaryBytes).toBeLessThan(100_000);
  expect(splitSourceDirectory(dir)).toEqual({ skipped: 'already split' });
});
