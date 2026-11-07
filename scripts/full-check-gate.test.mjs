// node --test scripts/full-check-gate.test.mjs
// The release steps stop unless the translation full check passes (translation system, stage 6 job 23).
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { assertFullCheckPassed, assertPagesUploadArguments, assertWorkerUploadArguments, findChecker, onlyDryRun } from './full-check-gate.mjs';

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
  // wrangler reads a following true/false as the switch's value, and takes camelCase and --no- forms (stage 6 review)
  for (const argv of [['--dry-run', 'false'], ['--dry-run', 'FALSE'], ['--dryRun=false'], ['--no-dryRun'], ['--dryRun'], ['--dry-run', '--dryRun=false'], ['--dry-run', 'otherdir']]) {
    assert.equal(onlyDryRun(argv), false, JSON.stringify(argv));
  }
});

test('the worker upload takes no arguments but --dry-run, so wrangler uploads the folder the gate checked', () => {
  const folder = mkdtempSync(path.join(tmpdir(), 'gate-args-'));
  try {
    for (const argv of [[], ['--dry-run']]) assertWorkerUploadArguments(argv, { env: {}, cwd: folder });
    for (const argv of [['--assets', 'dist'], ['--assets=dist'], ['-c', 'other.jsonc'], ['-c=other.jsonc'], ['-cother.jsonc'], ['--config=x'], ['--env', 'staging'], ['-estaging'], ['--cwd', '../other'], ['otherdir'], ['--dry-run', 'false']]) {
      assert.throws(() => assertWorkerUploadArguments(argv, { env: {}, cwd: folder }), /Release refused: deploy-worker\.mjs takes no arguments/, JSON.stringify(argv));
    }
    assert.throws(() => assertWorkerUploadArguments([], { env: { CLOUDFLARE_ENV: 'staging' }, cwd: folder }), /CLOUDFLARE_ENV/);
    for (const file of ['wrangler.json', 'wrangler.toml', path.join('.wrangler', 'deploy', 'config.json')]) {
      mkdirSync(path.dirname(path.join(folder, file)), { recursive: true });
      writeFileSync(path.join(folder, file), '{}');
      assert.throws(() => assertWorkerUploadArguments([], { env: {}, cwd: folder }), /instead of wrangler\.jsonc/, file);
      rmSync(path.join(folder, file));
    }
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test('the Pages upload runs only as pages deploy <folder> with the options a release uses', () => {
  assertPagesUploadArguments(['pages', 'deploy', 'site', '--project-name', 'bible-project', '--branch', 'main']);
  assertPagesUploadArguments(['pages', 'deploy', 'site', '--project-name=bible-project', '--commit-dirty', '--commit-message', 'release 7']);
  for (const argv of [[], ['pages', 'publish', 'site'], ['pages', 'deployment', 'create', 'site'], ['-c', 'x', 'pages', 'deploy', 'site'],
    ['pages', 'deploy', '--branch', 'main', 'site'], ['pages', 'deploy', 'site', '--directory', 'other'], ['pages', 'deploy', 'site', '--cwd=../x'],
    ['pages', 'deploy', 'site', 'other'], ['pages', 'deploy', 'site', '--branch'], ['pages', 'deploy', 'site', '--skip-caching', 'false'], ['pages', 'deploy', 'site', '--dry-run']]) {
    assert.throws(() => assertPagesUploadArguments(argv), /Release refused/, JSON.stringify(argv));
  }
});

test('the checker is found from the Website folder, and a folder with none refuses', () => {
  assert.match(findChecker().replaceAll('\\', '/'), /SiteTranslation\/system\/quick_check\/quick_check\.py$/);
  assert.throws(() => findChecker('C:/'), /was not found/);
});

test('every upload path runs the gate', () => {
  for (const file of ['deploy-worker.mjs', 'deploy-pages-resumable.mjs', 'prepare-testimonies-release.ts']) {
    assert.match(readFileSync(new URL(file, import.meta.url), 'utf8'), /assertFullCheckPassed\(/, file);
  }
  assert.match(readFileSync(new URL('deploy-worker.mjs', import.meta.url), 'utf8'), /assertWorkerUploadArguments\(process\.argv\.slice\(2\)\)/);
  assert.match(readFileSync(new URL('deploy-pages-resumable.mjs', import.meta.url), 'utf8'), /assertPagesUploadArguments\(process\.argv\.slice\(2\)\)/);
});
