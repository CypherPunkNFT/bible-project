import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { archiveOlderPackages } from './archive-older-packages.mjs';
import { acquireDistLock, mirrorIntoDist, releaseDistLock } from './dist-mirror.mjs';
import { assetRenames, classifyChange, missingAssets, planChanges, renameAssets, repointPages } from './quick-release.mjs';

const shell = (entry, css = 'index-BDEbH34s.css') => `<head><script type="module" crossorigin src="/assets/${entry}"></script>\n<link rel="modulepreload" crossorigin href="/assets/react-BERcpc7_.js">\n<link rel="stylesheet" crossorigin href="/assets/${css}"></head>`;
const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'quick-release-'));
const put = (root, name, text) => { fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true }); fs.writeFileSync(path.join(root, name), text); };

test('sorts changed files into what a quick release can carry', () => {
  assert.equal(classifyChange('src/pages/Home.tsx'), 'build');
  assert.equal(classifyChange('public/robots.txt'), 'public');
  assert.equal(classifyChange('design/catalog.json'), 'ignore');
  assert.equal(classifyChange('notes.md'), 'ignore');
  for (const file of ['data/catalog.json', 'server/site-worker.mjs', 'functions/api/x.ts', 'migrations/1.sql', 'vite.config.ts', 'package.json', 'public/_routes.json', 'public/content/scholar-population/index.json', 'public/content/sources/directory.json', 'src/lib/page-head.ts']) assert.equal(classifyChange(file), 'refuse', file);
});

test('checks every commit before any is applied', () => {
  const lists = { aaa: 'M\tsrc/a.tsx\nM\tpublic/robots.txt', bbb: 'M\tdata/x.json\nD\tpublic/old.png' };
  const plan = planChanges((commit) => lists[commit], ['aaa', 'bbb']);
  assert.deepEqual(plan.refused, ['bbb data/x.json']);
  assert.deepEqual(plan.publicFiles, ['public/robots.txt', 'public/old.png']);
});

test('maps several changed names, and leaves unchanged ones out', () => {
  const renames = assetRenames(shell('index-CVD8y9h9.js'), shell('index-AAAAAAAA.js', 'index-BBBBBBB-.css'));
  assert.deepEqual([...renames], [['index-CVD8y9h9.js', 'index-AAAAAAAA.js'], ['index-BDEbH34s.css', 'index-BBBBBBB-.css']]);
  const page = `<title>A page</title>${shell('index-CVD8y9h9.js')}<p>index-CVD8y9h9.js as words stays</p>`;
  const next = renameAssets(page, renames);
  assert.ok(next.includes('src="/assets/index-AAAAAAAA.js"') && next.includes('href="/assets/index-BBBBBBB-.css"'));
  assert.ok(next.includes('<p>index-CVD8y9h9.js as words stays</p>'));
});

test('a page stamped with its phrase lists still matches a fresh build, which has no stamp yet (job 17)', () => {
  const stamped = (entry, stamp) => `<script>const stamp = /*phrase-stamp*/"${stamp}";</script>${shell(entry)}`;
  const renames = assetRenames(stamped('index-CVD8y9h9.js', '0123456789ab'), stamped('index-AAAAAAAA.js', ''));
  assert.deepEqual([...renames], [['index-CVD8y9h9.js', 'index-AAAAAAAA.js']]);
  assert.throws(() => assetRenames(stamped('index-CVD8y9h9.js', ''), shell('index-AAAAAAAA.js')), /full prepare/);
});

test('refuses a page shell that changed beyond its file names', () => {
  assert.throws(() => assetRenames(shell('index-CVD8y9h9.js'), `${shell('index-AAAAAAAA.js')}<meta name="new">`), /full prepare/);
  assert.throws(() => assetRenames(shell('index-CVD8y9h9.js'), shell('index-CVD8y9h9.js').replace('</head>', '<link rel="modulepreload" href="/assets/d3-COLcoCmf.js"></head>')), /full prepare/);
  assert.throws(() => assetRenames(shell('index-CVD8y9h9.js'), shell('main-AAAAAAAA.js')), /full prepare/);
});

test('repoints pages with the shell last, and a rerun finishes a crashed run', () => {
  const site = tempDir();
  put(site, 'index.html', shell('index-CVD8y9h9.js'));
  put(site, 'study/a.html', shell('index-CVD8y9h9.js'));
  put(site, 'study/b.html', shell('index-AAAAAAAA.js')); // already done before a crash
  put(site, 'assets/index-AAAAAAAA.js', '');
  put(site, 'assets/react-BERcpc7_.js', '');
  put(site, 'assets/index-BDEbH34s.css', '');
  const result = repointPages(site, new Map([['index-CVD8y9h9.js', 'index-AAAAAAAA.js']]));
  assert.deepEqual(result, { pages: 3, changed: 2 });
  assert.deepEqual(missingAssets(site), []);
  fs.rmSync(path.join(site, 'assets/react-BERcpc7_.js'));
  assert.equal(missingAssets(site).length, 3);
  fs.rmSync(site, { recursive: true });
});

test('mirror copies only what changed, the build wins, and stale files leave', () => {
  const root = tempDir(), publicDir = path.join(root, 'public'), stage = path.join(root, 'stage'), dist = path.join(root, 'dist');
  put(publicDir, 'same.txt', 'same'); put(publicDir, 'both.txt', 'public');
  put(stage, 'index.html', 'shell'); put(stage, 'both.txt', 'built'); put(stage, 'assets/a-11111111.js', 'a');
  assert.equal(mirrorIntoDist({ publicDir, stage, dist }).copied, 4);
  assert.equal(fs.readFileSync(path.join(dist, 'both.txt'), 'utf8'), 'built');
  put(dist, 'assets/old-22222222.js', 'old');
  const old = new Date(Date.now() - 60000);
  fs.utimesSync(path.join(publicDir, 'same.txt'), old, old);
  const second = mirrorIntoDist({ publicDir, stage, dist });
  assert.equal(second.removed, 1);
  assert.ok(!fs.existsSync(path.join(dist, 'assets/old-22222222.js')));
  const before = fs.statSync(path.join(dist, 'same.txt')).mtimeMs;
  mirrorIntoDist({ publicDir, stage, dist });
  assert.equal(fs.statSync(path.join(dist, 'same.txt')).mtimeMs, before);
  fs.rmSync(path.join(stage, 'index.html'));
  assert.throws(() => mirrorIntoDist({ publicDir, stage, dist }), /no index.html/);
  fs.rmSync(root, { recursive: true });
});

test('after a release, older packages move to the archive and newer ones stay', () => {
  const root = tempDir(), release = path.join(root, 'tree/.release'), archive = path.join(root, 'ARCHIVE/release-copies');
  const make = (name) => { fs.mkdirSync(path.join(release, name), { recursive: true }); fs.writeFileSync(path.join(release, name, 'release.json'), name); };
  const later = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  make('older'); later(50); make('current'); later(50); make('newer');
  assert.deepEqual(archiveOlderPackages(path.join(release, 'current'), archive), ['older']);
  assert.deepEqual(fs.readdirSync(release).sort(), ['current', 'newer']);
  assert.equal(fs.readFileSync(path.join(archive, 'tree__older/release.json'), 'utf8'), 'older');
  assert.deepEqual(archiveOlderPackages(path.join(root, 'elsewhere'), archive), []);
  fs.rmSync(root, { recursive: true });
});

test('lock: the holder can reenter, and a dead holder does not block', () => {
  const root = tempDir();
  assert.equal(acquireDistLock(root), true);
  assert.equal(acquireDistLock(root), false);
  releaseDistLock(root);
  assert.ok(!fs.existsSync(path.join(root, '.dist-lock')));
  fs.writeFileSync(path.join(root, '.dist-lock'), '999999');
  assert.equal(acquireDistLock(root), true);
  releaseDistLock(root);
  fs.rmSync(root, { recursive: true });
});
