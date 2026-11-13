// The Bible files the phone app downloads (data/bibles/v1, written by App/scripts/publish-bibles.py; the app's
// LANGUAGES_PLAN.md 3.11). data/ is generated and out of git, so a release could go out without them, or with an index
// naming a file that is not there; the live site then answers the app with its HTML page, and every download fails.
// The release stops instead.
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const FILE = /^[a-z0-9]+(-[a-z0-9]+)*-[0-9a-f]{12}\.bgb$/;

/** Throws unless data/bibles/v1/index.json lists every catalogue version with a whole file; returns the count and bytes. */
export function assertPublishedBibles(dataDir) {
  const folder = path.join(dataDir, 'bibles', 'v1');
  const indexPath = path.join(folder, 'index.json');
  const fix = 'run `npm run publish:bibles` in the App folder (App/scripts/publish-bibles.py)';
  if (!existsSync(indexPath)) throw new Error(`The app's Bible downloads are missing: no ${indexPath}; ${fix}.`);
  const index = JSON.parse(readFileSync(indexPath, 'utf8'));
  if (index.format !== 1) throw new Error(`${indexPath}: format ${index.format}, expected 1; ${fix}.`);
  const catalog = JSON.parse(readFileSync(path.join(dataDir, 'catalog.json'), 'utf8'));
  const problems = [];
  let bytes = 0;
  for (const { slug } of catalog.translations) {
    const entry = index.versions?.[slug];
    if (!entry) {
      problems.push(`${slug}: not in index.json`);
      continue;
    }
    if (!FILE.test(entry.file) || !entry.file.startsWith(`${slug}-`)) {
      problems.push(`${slug}: file name ${JSON.stringify(entry.file)} is not <slug>-<12 hex>.bgb`);
      continue;
    }
    const file = path.join(folder, entry.file);
    const size = existsSync(file) ? statSync(file).size : null;
    if (size !== entry.size) problems.push(`${slug}: ${entry.file} is ${size === null ? 'missing' : `${size} bytes`}, index says ${entry.size}`);
    bytes += entry.size;
  }
  if (problems.length) throw new Error(`The app's Bible downloads do not match data/bibles/v1/index.json (${fix}):\n  ${problems.join('\n  ')}`);
  return { versions: catalog.translations.length, bytes };
}
