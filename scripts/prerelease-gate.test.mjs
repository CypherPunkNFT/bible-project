// node --test scripts/prerelease-gate.test.mjs (in npm run test:release)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertPreReleaseCheckPassed, findPreReleaseChecker } from './prerelease-gate.mjs';

const fake = (result) => () => result;
const checker = 'x/a/b/c.py';

test('the checker is found beside the Website folder', () => {
  assert.match(findPreReleaseChecker(), /SiteTranslation[\\/]system[\\/]turnkey[\\/]prerelease_check\.py$/);
});

test('only an exit of 0 with the pass line lets the release go on', () => {
  assert.doesNotThrow(() => assertPreReleaseCheckPassed({ checker, runner: fake({ status: 0, stdout: 'ok\nPRE-RELEASE CHECK PASSED\n' }) }));
  assert.throws(() => assertPreReleaseCheckPassed({ checker, runner: fake({ status: 1, stdout: 'PRE-RELEASE CHECK REFUSED: 5 new' }) }), /exited 1/);
  assert.throws(() => assertPreReleaseCheckPassed({ checker, runner: fake({ status: 0, stdout: 'ok' }) }), /printed no/);
  assert.throws(() => assertPreReleaseCheckPassed({ checker, runner: fake({ status: null, error: { code: 'ENOENT' } }) }), /could not run \(ENOENT\)/);
  assert.throws(() => assertPreReleaseCheckPassed({ checker, runner: fake({ status: null, error: { code: 'ETIMEDOUT' } }) }), /could not run \(ETIMEDOUT\)/);
});
