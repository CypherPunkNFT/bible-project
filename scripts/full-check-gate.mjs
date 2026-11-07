// The translation full check's release gate (SiteTranslation/system/quick_check/qc_gate.py, translation system stage 6).
// Every release step runs it before anything can go live, and stops unless it passes:
//   prepare-testimonies-release.ts   assertFullCheckPassed(built, { data, languages })  the build and data being released
//   deploy-worker.mjs, deploy-pages-resumable.mjs   assertFullCheckPassed(site, { package: true })  a prepared package
// It passes only when the full check read exactly this build on its fixed copy, and judging those readings again with
// today's rules and rulings leaves nothing unexplained. Anything else (no checker, no Python, a timeout) refuses.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CHECKER = path.join('SiteTranslation', 'system', 'quick_check', 'quick_check.py');
const STAMP = 'FULL-CHECK-STAMP ';
const LIMIT_MS = 30 * 60 * 1000; // the gate judges stored readings (a few minutes); it never reads pages

/** The checker beside the Website folder. Walks up, because releases are also prepared in Website/.local/release-languages. */
export function findChecker(from = path.dirname(fileURLToPath(import.meta.url))) {
  for (let folder = path.resolve(from); ; folder = path.dirname(folder)) {
    if (existsSync(path.join(folder, CHECKER))) return path.join(folder, CHECKER);
    if (path.dirname(folder) === folder) throw new Error(`Release refused: the translation full check (${CHECKER}) was not found above ${from}.`);
  }
}

function defaultRunner(command, args, options) {
  const result = spawnSync(command, args, { ...options, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: LIMIT_MS });
  // py.exe leaves its python.exe running when it is killed, so end the whole tree.
  if (result.error?.code === 'ETIMEDOUT' && result.pid) spawnSync('taskkill', ['/T', '/F', '/PID', String(result.pid)]);
  return result;
}

/** Runs the gate; returns the stamp a prepared release keeps in release.json, or throws saying why the release stops. */
export function assertFullCheckPassed(site, { data, languages = [], package: isPackage = false, runner = defaultRunner, checker } = {}) {
  const script = checker ?? findChecker();
  const args = ['-3.12', script, ...(isPackage ? ['--release-gate-package', path.resolve(site)] : ['--release-gate', path.resolve(site), '--data', path.resolve(data)])];
  if (!isPackage && languages.length) args.push('--languages', languages.join(','));
  console.log(`Translation full check (release gate): ${path.basename(script)} ${args.slice(2).join(' ')}`);
  const result = runner('py', args, { cwd: path.dirname(path.dirname(path.dirname(script))) });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (output.trim()) console.log(output.trim().split('\n').slice(-60).join('\n'));
  if (result.error) throw new Error(`Release refused: the translation full check could not run (${result.error.code ?? result.error.message}).`);
  if (result.status !== 0) throw new Error(`Release refused: the translation full check exited ${result.status} (0 is the only pass; 1 unexplained findings, 2 refused, 3 failed, 4 still reading). Its reasons are above.`);
  const line = output.split('\n').reverse().find((text) => text.startsWith(STAMP));
  if (!line) throw new Error('Release refused: the translation full check passed but printed no stamp; expected a line starting FULL-CHECK-STAMP.');
  return JSON.parse(line.slice(STAMP.length));
}

/** Whether wrangler will only pretend: exactly --dry-run, and nothing that turns it back off. */
export function onlyDryRun(argv) {
  return argv.includes('--dry-run') && !argv.some((arg) => /^--(no-dry-run|dry-run=(false|0|no))$/i.test(arg));
}
