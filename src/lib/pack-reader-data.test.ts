// The release groups chapter files (scripts/pack-reader-data.mjs). Every chapter must sit in the file the site opens
// for it (textChunkPath / crossRefPath here), and the data must be stamped from its contents.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, expect, it } from 'vitest';
import { packReaderData } from '../../scripts/pack-reader-data.mjs';
import { CHUNK, crossRefPath, setLayout, textChunkPath } from './data';
import type { Catalog } from './types';

const root = mkdtempSync(path.join(tmpdir(), 'reader-pack-'));
const data = path.join(root, '.release', 'site', 'data');
const write = (file: string, value: unknown) => { mkdirSync(path.dirname(path.join(data, file)), { recursive: true }); writeFileSync(path.join(data, file), JSON.stringify(value)); };
const read = <T,>(file: string) => JSON.parse(readFileSync(path.join(data, file), 'utf8')) as T;
afterAll(() => rmSync(root, { recursive: true, force: true }));

// Psalms-like: 23 chapters, with a label that is not a plain number, as some versions number chapters.
const labels = [...Array.from({ length: 22 }, (_, i) => String(i + 1)), '151'];
write('catalog.json', { stamp: 'old', translations: [{ slug: 'kjv', books: { PSA: labels } }] });
write('study/index.json', { stamp: 'old', corrections: [] });
for (let k = 0; k * CHUNK < labels.length; k++) write(`text/kjv/PSA/${k}.json`, Object.fromEntries(labels.slice(k * CHUNK, (k + 1) * CHUNK).map(c => [c, { c, v: [] }])));
for (let n = 1; n <= 23; n++) write(`xref/PSA/${n}.json`, { [`${n}:1`]: [`ref-${n}`] });
const first = packReaderData(path.join(root, '.release', 'site'));
const catalog = read<Catalog>('catalog.json');

it('puts every chapter where the site will look for it', () => {
  setLayout(catalog.layout);
  try {
    labels.forEach((label, index) => expect(read<Record<string, unknown>>(textChunkPath('kjv', 'PSA', index))[label], label).toBeDefined());
    for (let n = 1; n <= 23; n++) expect(read<Record<string, unknown>>(crossRefPath('PSA', String(n)))[String(n)], `xref ${n}`).toEqual({ [`${n}:1`]: [`ref-${n}`] });
  } finally { setLayout(undefined); }
});

it('replaces the originals and counts them', () => {
  expect(first.text).toEqual({ before: 5, after: 3 });
  expect(first.xref).toEqual({ before: 23, after: 3 });
  expect(readdirSync(path.join(data, 'text/kjv/PSA')).sort()).toEqual(['c10-0.json', 'c10-1.json', 'c10-2.json']);
  expect(existsSync(path.join(data, 'xref/PSA/1.json'))).toBe(false);
});

it('stamps the catalogue and study index from the contents, and refuses to pack twice', () => {
  expect(catalog.stamp).toMatch(/^[0-9a-f]{12}$/);
  expect(read<{ stamp: string }>('study/index.json').stamp).toBe(catalog.stamp);
  expect(() => packReaderData(path.join(root, '.release', 'site'))).toThrow(/already packed/);
});

it('reads the local layout unchanged when the catalogue has none', () => {
  expect(textChunkPath('kjv', 'PSA', 12)).toBe('text/kjv/PSA/2.json');
  expect(crossRefPath('PSA', '12')).toBe('xref/PSA/12.json');
});
