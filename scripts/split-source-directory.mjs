// Splits the built source directory (dist/content/sources/directory.json, 7.6 MB, 16,884 records) so the Versions and
// Sources pages open on a small summary (load scan, 2026-10-20):
//   directory.json   collections, providers and corpus measurements, plus the record and author counts per collection
//   entries.json     { entries }, fetched when a visitor nears the collections or the bibliography
// The source file in public/ is never touched; dev mode serves it whole and the page handles both forms.
// Usage: node scripts/split-source-directory.mjs [dir]   (default dist/content/sources)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Same policy as isScholarsOnlySource() in src/lib/editorial-sources.ts, so the counts match the records shown.
const scholarsOnly = (entry) => /\bjosephus\b|gutenberg\.org\/ebooks\/2848\b/i.test(JSON.stringify(entry));

export function splitSourceDirectory(dir) {
  const file = path.join(dir, 'directory.json');
  const directory = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (directory.split) return { skipped: 'already split' };
  if (!Array.isArray(directory.entries) || !Array.isArray(directory.collections)) throw Error(`Unexpected source directory at ${file}: no entries or collections array`);
  const { entries, ...summary } = directory;
  const shown = entries.filter((entry) => !scholarsOnly(entry));
  const collections = Object.fromEntries(directory.collections.map(({ id }) => {
    const members = shown.filter((entry) => entry.categories?.includes(id));
    return [id, { records: members.length, authors: new Set(members.map((entry) => entry.author)).size }];
  }));
  fs.writeFileSync(path.join(dir, 'entries.json'), JSON.stringify({ entries }), 'utf8');
  summary.split = { schemaVersion: 1, entries: 'entries.json', records: shown.length, collections };
  fs.writeFileSync(file, JSON.stringify(summary), 'utf8');
  return { entries: entries.length, summaryBytes: fs.statSync(file).size };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const dir = path.resolve(process.argv[2] ?? path.join(root, 'dist/content/sources'));
  if (!dir.startsWith(path.join(root, 'dist')) && !dir.includes(`${path.sep}.release${path.sep}`)) throw Error(`Refusing to split outside dist/ or a release copy: ${dir}`);
  console.log('Source directory split:', splitSourceDirectory(dir));
}
