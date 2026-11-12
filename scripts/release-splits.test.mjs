// node --test scripts/release-splits.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { splitReleaseFiles } from './release-splits.mjs';

const write = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value)); };
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

function packageSite() {
  const site = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'release-splits-')), 'site');
  write(path.join(site, 'content/scholar-population/index.json'), { builtAt: 'x', entries: [
    { id: 'a', name: 'A', searchText: 'alpha text', provenance: ['p'], facts: { dates: { status: 'source-supported', born: 1800, evidence: [1] } }, fields: { history: { count: 1, basis: 'b' } } },
  ] });
  write(path.join(site, 'content/sources/directory.json'), { collections: [{ id: 'c' }], entries: [{ id: 'e', author: 'X', categories: ['c'] }] });
  return site;
}

test('splits the scholars index and the source directory in place', () => {
  const site = packageSite();
  const result = splitReleaseFiles(site);
  assert.equal(result.scholarIndex.entries, 1);
  assert.equal(result.sourceDirectory.entries, 1);
  const index = read(path.join(site, 'content/scholar-population/index.json'));
  assert.equal(index.split.search, 'search.json');
  assert.equal(index.entries[0].searchText, undefined);
  assert.deepEqual(read(path.join(site, 'content/scholar-population/search.json')), { a: 'alpha text' });
  assert.ok(fs.readdirSync(path.join(site, 'content/scholar-population/details')).length === 1);
  const directory = read(path.join(site, 'content/sources/directory.json'));
  assert.equal(directory.entries, undefined);
  assert.equal(directory.split.records, 1);
});

test('a second run leaves the split files as they are', () => {
  const site = packageSite();
  splitReleaseFiles(site);
  assert.deepEqual(splitReleaseFiles(site), { scholarIndex: { skipped: 'already split' }, sourceDirectory: { skipped: 'already split' } });
});

test('refuses a folder that is a link to somewhere else, and writes nothing there', () => {
  const site = packageSite();
  const outside = path.join(path.dirname(site), 'public-sources');
  fs.renameSync(path.join(site, 'content/sources'), outside);
  fs.symlinkSync(outside, path.join(site, 'content/sources'), 'junction');
  const before = fs.readFileSync(path.join(outside, 'directory.json'), 'utf8');
  assert.throws(() => splitReleaseFiles(site), /outside the release folder/);
  assert.equal(fs.readFileSync(path.join(outside, 'directory.json'), 'utf8'), before);
});

test('refuses a link inside a folder', () => {
  const site = packageSite();
  const outside = path.join(path.dirname(site), 'elsewhere');
  fs.mkdirSync(outside);
  fs.symlinkSync(outside, path.join(site, 'content/scholar-population/details'), 'junction');
  assert.throws(() => splitReleaseFiles(site), /details is a link/);
});

test('refuses a package without the file, naming it', () => {
  const site = packageSite();
  fs.unlinkSync(path.join(site, 'content/sources/directory.json'));
  assert.throws(() => splitReleaseFiles(site), /no content\/sources\/directory\.json to split/);
});
