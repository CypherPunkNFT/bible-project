// node --test scripts/published-bibles.test.mjs
// A site release stops unless the app's Bible downloads (data/bibles/v1) are all there.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { assertPublishedBibles } from './published-bibles.mjs';

function dataDir(files, index) {
  const dir = mkdtempSync(path.join(tmpdir(), 'bibles-'));
  writeFileSync(path.join(dir, 'catalog.json'), JSON.stringify({ translations: [{ slug: 'kjv' }, { slug: 'swh' }] }));
  const folder = path.join(dir, 'bibles', 'v1');
  mkdirSync(folder, { recursive: true });
  for (const [name, size] of Object.entries(files)) writeFileSync(path.join(folder, name), Buffer.alloc(size));
  if (index) writeFileSync(path.join(folder, 'index.json'), JSON.stringify(index));
  return dir;
}

const entry = (slug, size) => ({ file: `${slug}-0123456789ab.bgb`, size, sha256: 'x', source: 'y' });

test('every catalogue version with a whole file passes', () => {
  const dir = dataDir({ 'kjv-0123456789ab.bgb': 10, 'swh-0123456789ab.bgb': 20 }, { format: 1, versions: { kjv: entry('kjv', 10), swh: entry('swh', 20) } });
  try {
    assert.deepEqual(assertPublishedBibles(dir), { versions: 2, bytes: 30 });
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test('a missing index, a missing version, a short or missing file, or a bad name stops the release', () => {
  const cases = [
    [{}, undefined, /no .*index\.json/],
    [{ 'kjv-0123456789ab.bgb': 10 }, { format: 1, versions: { kjv: entry('kjv', 10) } }, /swh: not in index/],
    [{ 'kjv-0123456789ab.bgb': 9 }, { format: 1, versions: { kjv: entry('kjv', 10), swh: entry('swh', 20) } }, /kjv: .* is 9 bytes[\s\S]*swh: .* is missing/],
    [{}, { format: 1, versions: { kjv: { ...entry('kjv', 1), file: '../kjv.bgb' }, swh: entry('swh', 1) } }, /kjv: file name/],
    [{}, { format: 2, versions: {} }, /format 2/],
  ];
  for (const [files, index, message] of cases) {
    const dir = dataDir(files, index);
    try {
      assert.throws(() => assertPublishedBibles(dir), message);
    } finally {
      rmSync(dir, { recursive: true });
    }
  }
});

test('the real data folder, when present, passes', { skip: !process.env.CHECK_REAL_BIBLES }, () => {
  assert.equal(assertPublishedBibles(path.resolve('data')).versions > 0, true);
});
