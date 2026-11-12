// The two splits every release package needs, run by prepare-testimonies-release.ts since 2026-11-12 (before that a
// hand step after prepare, HANDOFF §4 step 13, which the releases after 2026-11-07 missed, so the live site served the
// 23 MB scholars index and the 7.6 MB source directory whole). The same two splits build-portable.mjs runs on dist/:
//   split-scholar-index.mjs     the contributor list, search text, per-scholar details and the Analysis page's names
//   split-source-directory.mjs  the source directory's summary and its records
// The site's pages and the phone app read both forms. A file already split is left as it is.
import fs from 'node:fs';
import path from 'node:path';
import { splitScholarIndex } from './split-scholar-index.mjs';
import { splitSourceDirectory } from './split-source-directory.mjs';

/** A folder of the package that holds `file` and is the package's own, with no link inside that a split could write through. */
export function ownFolder(site, relative, file) {
  const dir = path.join(site, relative);
  const root = fs.realpathSync(site);
  const real = fs.realpathSync(dir);
  if (!real.startsWith(root + path.sep)) throw Error(`Refusing to split ${dir}: it resolves to ${real}, outside the release folder ${root}`);
  const link = fs.readdirSync(dir, { recursive: true, withFileTypes: true }).find((entry) => entry.isSymbolicLink());
  if (link) throw Error(`Refusing to split ${dir}: ${path.join(link.parentPath, link.name)} is a link, and the split would write through it`);
  if (!fs.existsSync(path.join(dir, file))) throw Error(`The release has no ${relative}/${file} to split (looked in ${dir})`);
  return dir;
}

/** Splits the scholars index and the source directory in a release package's site folder. */
export function splitReleaseFiles(site) {
  return {
    scholarIndex: splitScholarIndex(ownFolder(site, 'content/scholar-population', 'index.json')),
    sourceDirectory: splitSourceDirectory(ownFolder(site, 'content/sources', 'directory.json')),
  };
}
