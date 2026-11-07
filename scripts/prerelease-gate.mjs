// The translation pre-release check (SiteTranslation/system/turnkey/prerelease_check.py --release-gate, translation
// system stage 7, job 29). The release steps run it before anything goes live, next to the full check's gate:
//   prepare-testimonies-release.ts, deploy-worker.mjs, deploy-pages-resumable.mjs   assertPreReleaseCheckPassed()
// It passes only when collecting the site's English would add or carry nothing (every text registered for
// translation), the English build check passes (the full release runs no build of its own) and the quick check exits 0.
// It never writes or spends. Anything else (no checker, no Python, a time-out, no pass line) refuses.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CHECKER = path.join('SiteTranslation', 'system', 'turnkey', 'prerelease_check.py');
const PASSED = 'PRE-RELEASE CHECK PASSED';
const LIMIT_MS = 60 * 60 * 1000; // collecting (a minute), the English check and the quick check (a few minutes)

/** The checker beside the Website folder; walks up, because releases are also prepared in Website/.local/release-languages. */
export function findPreReleaseChecker(from = path.dirname(fileURLToPath(import.meta.url))) {
  for (let folder = path.resolve(from); ; folder = path.dirname(folder)) {
    if (existsSync(path.join(folder, CHECKER))) return path.join(folder, CHECKER);
    if (path.dirname(folder) === folder) throw new Error(`Release refused: the translation pre-release check (${CHECKER}) was not found above ${from}.`);
  }
}

function defaultRunner(command, args, options) {
  const result = spawnSync(command, args, { ...options, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: LIMIT_MS });
  // py.exe leaves its python.exe running when it is killed, so end the whole tree.
  if (result.error?.code === 'ETIMEDOUT' && result.pid) spawnSync('taskkill', ['/T', '/F', '/PID', String(result.pid)]);
  return result;
}

/** Runs the pre-release check; returns quietly when it passed, or throws saying why the release stops. */
export function assertPreReleaseCheckPassed({ runner = defaultRunner, checker } = {}) {
  const script = checker ?? findPreReleaseChecker();
  console.log(`Translation pre-release check: ${path.basename(script)} --release-gate`);
  const result = runner('py', ['-3.12', script, '--release-gate'], { cwd: path.dirname(path.dirname(path.dirname(script))) });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (output.trim()) console.log(output.trim().split('\n').slice(-40).join('\n'));
  if (result.error) throw new Error(`Release refused: the translation pre-release check could not run (${result.error.code ?? result.error.message}).`);
  if (result.status !== 0) throw new Error(`Release refused: the translation pre-release check exited ${result.status} (0 is the only pass). Its reasons are above; python system/turnkey/translate_new.py collects and translates new English.`);
  if (!output.split('\n').some((line) => line.trim() === PASSED)) throw new Error(`Release refused: the translation pre-release check exited 0 but printed no "${PASSED}" line.`);
}
