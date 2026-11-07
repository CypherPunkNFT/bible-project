// node --test scripts/full-check-gate.test.mjs
// The release steps stop unless the translation full check passes (translation system, stage 6 job 23).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { assertFullCheckPassed, findChecker, onlyDryRun } from './full-check-gate.mjs';

const STAMP = { copy: '2026-11-07T02:46:41Z', bundle: '/assets/index-a.js', languages: ['es'] };
const runner = (status, stdout = '', error) => () => ({ status, stdout, stderr: '', error });
const checker = 'X:/BibleProject/SiteTranslation/system/quick_check/quick_check.py';

test('only exit 0 with a stamp lets a release go on', () => {
  assert.deepEqual(assertFullCheckPassed('site', { package: true, checker, runner: runner(0, `0 unexplained\nFULL-CHECK-STAMP ${JSON.stringify(STAMP)}\n`) }), STAMP);
  assert.throws(() => assertFullCheckPassed('site', { package: true, checker, runner: runner(0, 'passed\n') }), /no stamp/);
});

test('every other answer refuses the release', () => {
  for (const status of [1, 2, 3, 4, null]) {
    assert.throws(() => assertFullCheckPassed('site', { package: true, checker, runner: runner(status) }), /Release refused/);
  }
  assert.throws(() => assertFullCheckPassed('site', { package: true, checker, runner: runner(null, '', Object.assign(new Error('spawn py ENOENT'), { code: 'ENOENT' })) }), /could not run \(ENOENT\)/);
});

test('the source gate names the build, the data and the released languages', () => {
  let seen;
  const capture = (command, args, options) => { seen = { command, args, options }; return { status: 1, stdout: '', stderr: '' }; };
  assert.throws(() => assertFullCheckPassed('dist', { data: 'data', languages: ['es', 'pt'], checker, runner: capture }));
  assert.equal(seen.command, 'py');
  assert.deepEqual([seen.args[0], seen.args[1], seen.args[2], seen.args[4], seen.args.at(-1)], ['-3.12', checker, '--release-gate', '--data', 'es,pt']);
  assert.match(seen.options.cwd.replaceAll('\\', '/'), /SiteTranslation$/);
});

test('a dry run is only exactly --dry-run, never one turned back off', () => {
  assert.equal(onlyDryRun(['--dry-run']), true);
  assert.equal(onlyDryRun([]), false);
  assert.equal(onlyDryRun(['--dry-run', '--dry-run=false']), false);
  assert.equal(onlyDryRun(['--dry-run', '--no-dry-run']), false);
});

test('the checker is found from the Website folder, and a folder with none refuses', () => {
  assert.match(findChecker().replaceAll('\\', '/'), /SiteTranslation\/system\/quick_check\/quick_check\.py$/);
  assert.throws(() => findChecker('C:/'), /was not found/);
});

test('every upload path runs the gate', () => {
  for (const file of ['deploy-worker.mjs', 'deploy-pages-resumable.mjs', 'prepare-testimonies-release.ts']) {
    assert.match(readFileSync(new URL(file, import.meta.url), 'utf8'), /assertFullCheckPassed\(/, file);
  }
});
