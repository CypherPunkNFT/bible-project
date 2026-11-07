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

/** Whether wrangler will only pretend: the one argument is exactly --dry-run. Anything else ("--dry-run false",
 *  "--dryRun=false", "--no-dryRun") is not trusted as a dry run, so the gate runs. */
export function onlyDryRun(argv) {
  return argv.length === 1 && argv[0] === '--dry-run';
}

/** deploy-worker.mjs uploads the assets folder wrangler.jsonc names, the folder the gate checks. Any argument but
 *  --dry-run (--assets, -c, --cwd, a positional folder...), another config file wrangler would read first, or an
 *  environment chosen by CLOUDFLARE_ENV could make wrangler upload something else, so each is refused. */
export function assertWorkerUploadArguments(argv, { env = process.env, cwd = process.cwd() } = {}) {
  if (argv.length > 1 || (argv.length === 1 && argv[0] !== '--dry-run')) {
    throw new Error(`Release refused: deploy-worker.mjs takes no arguments, or only --dry-run, so wrangler uploads the folder the full check judged; got ${JSON.stringify(argv)}.`);
  }
  if (env.CLOUDFLARE_ENV) throw new Error(`Release refused: CLOUDFLARE_ENV is set (${env.CLOUDFLARE_ENV}), which can make wrangler upload another environment's assets folder; unset it.`);
  const others = ['wrangler.json', 'wrangler.toml', path.join('.wrangler', 'deploy', 'config.json')].filter((file) => existsSync(path.join(cwd, file)));
  if (others.length) throw new Error(`Release refused: ${others.join(', ')} in ${cwd} could be read instead of wrangler.jsonc, whose assets folder the full check judged; expected wrangler.jsonc alone.`);
}

const PAGES_VALUE_FLAGS = new Set(['--project-name', '--branch', '--commit-hash', '--commit-message']);
const PAGES_SWITCHES = new Set(['--commit-dirty', '--skip-caching', '--upload-source-maps', '--no-bundle']);

/** deploy-pages-resumable.mjs runs only as "pages deploy <site directory>" plus the options a release uses, so the
 *  folder the gate checks is the folder uploaded (no "pages publish", --directory, --cwd, -c or extra folder). */
export function assertPagesUploadArguments(argv) {
  const [command, subcommand, directory, ...rest] = argv;
  const refuse = (why) => { throw new Error(`Release refused: ${why}; expected 'pages deploy <site directory> [--project-name X] [--branch X] [--commit-hash X] [--commit-message X] [--commit-dirty] [--skip-caching] [--upload-source-maps] [--no-bundle]', got ${JSON.stringify(argv)}.`); };
  if (command !== 'pages' || subcommand !== 'deploy') refuse("this uploader only runs as 'pages deploy'");
  if (!directory || directory.startsWith('-')) refuse("put the site directory right after 'pages deploy' so the release checks can find it");
  for (let index = 0; index < rest.length; index += 1) {
    const [flag, inline] = rest[index].split(/=(.*)/s);
    if (PAGES_VALUE_FLAGS.has(flag)) {
      if (inline === undefined && (index + 1 >= rest.length || rest[index + 1].startsWith('-'))) refuse(`${flag} needs a value`);
      if (inline === undefined) index += 1;
    } else if (!(PAGES_SWITCHES.has(flag) && inline === undefined)) {
      refuse(`${rest[index]} is not an option this uploader accepts`);
    }
  }
}
