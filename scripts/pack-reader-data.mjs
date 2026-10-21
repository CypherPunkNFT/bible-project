// Release only: groups the reader's chapter files so the release stays well inside Cloudflare Pages' 20,000-file limit
// (17,949 files before this, 2026-10-20), and stamps the data with a hash of its contents so browsers may keep it.
//   text/<slug>/<book>/<k>.json    five chapters each (scripts/build-data.py)  ->  c10-<k>.json, ten chapters each
//   xref/<book>/<chapter>.json     one chapter each                             ->  g<k>.json, ten chapters each
// Works on the release COPY; the shared data folder, which local preview and the Python builds read, is never touched.
// The site reads the grouped files only when the catalogue says "layout" (src/lib/data.ts setLayout).
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const TEXT_CHUNK = 10, XREF_CHUNK = 10;
const SOURCE_CHUNK = 5; // CHUNK in scripts/build-data.py and src/lib/data.ts
const MAX_FILE_BYTES = 24 * 1024 * 1024;

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, value) => {
  const body = JSON.stringify(value);
  if (Buffer.byteLength(body) > MAX_FILE_BYTES) throw Error(`${file} would be ${Buffer.byteLength(body)} bytes; Cloudflare refuses files over 25 MiB.`);
  fs.writeFileSync(file, body, 'utf8');
};

/** Refuses anything but real folders inside a .release copy: a link here would rewrite the shared originals. */
function assertReleaseCopy(site) {
  const data = path.join(site, 'data');
  for (const dir of [data, path.join(data, 'text'), path.join(data, 'xref')]) {
    if (fs.lstatSync(dir).isSymbolicLink()) throw Error(`Reader packing refused: ${dir} is a link, not a copied folder.`);
  }
  if (!fs.realpathSync(data).includes(`${path.sep}.release${path.sep}`)) throw Error(`Reader packing refused: ${data} is outside a .release copy.`);
  return data;
}

const numbered = (dir, pattern) => fs.readdirSync(dir).map((name) => {
  const match = pattern.exec(name);
  if (!match) throw Error(`Reader packing refused: unexpected file ${path.join(dir, name)}`);
  return [Number(match[1]), name];
});

/** Ten chapters to a text file; checks every chapter of the catalogue is in the file the site will open. */
function packText(data, catalog) {
  const ratio = TEXT_CHUNK / SOURCE_CHUNK;
  let before = 0, after = 0;
  for (const version of catalog.translations) for (const [code, labels] of Object.entries(version.books)) {
    const dir = path.join(data, 'text', version.slug, code);
    const groups = new Map(), originals = numbered(dir, /^(\d+)\.json$/);
    for (const [k, name] of originals) {
      const chapters = readJson(path.join(dir, name));
      const group = groups.get(Math.floor(k / ratio)) ?? {};
      for (const [label, chapter] of Object.entries(chapters)) {
        if (label in group) throw Error(`Chapter ${label} of ${version.slug} ${code} appears in two text files.`);
        group[label] = chapter;
      }
      groups.set(Math.floor(k / ratio), group);
      before++;
    }
    labels.forEach((label, index) => {
      if (!groups.get(Math.floor(index / TEXT_CHUNK))?.[label]) throw Error(`${version.slug} ${code} ${label} would not be found in c${TEXT_CHUNK}-${Math.floor(index / TEXT_CHUNK)}.json.`);
    });
    for (const [g, group] of groups) { writeJson(path.join(dir, `c${TEXT_CHUNK}-${g}.json`), group); after++; }
    for (const [, name] of originals) fs.unlinkSync(path.join(dir, name));
  }
  return { before, after };
}

/** Ten chapters to a cross-reference file. */
function packCrossRefs(data) {
  let before = 0, after = 0;
  for (const code of fs.readdirSync(path.join(data, 'xref'))) {
    const dir = path.join(data, 'xref', code), groups = new Map(), originals = numbered(dir, /^(\d+)\.json$/);
    for (const [chapter, name] of originals) {
      const g = Math.floor((chapter - 1) / XREF_CHUNK);
      groups.set(g, { ...groups.get(g), [String(chapter)]: readJson(path.join(dir, name)) });
      before++;
    }
    for (const [g, group] of groups) { writeJson(path.join(dir, `g${g}.json`), group); after++; }
    for (const [chapter, name] of originals) {
      if (!readJson(path.join(dir, `g${Math.floor((chapter - 1) / XREF_CHUNK)}.json`))[String(chapter)]) throw Error(`Cross-references for ${code} ${chapter} are missing from their group.`);
      fs.unlinkSync(path.join(dir, name));
    }
  }
  return { before, after };
}

/** A hash of every data file but the two indexes that carry it, so any change to any file gives new addresses. */
function contentStamp(data, skip) {
  const hash = createHash('sha256');
  const files = fs.readdirSync(data, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile())
    .map((entry) => path.relative(data, path.join(entry.parentPath, entry.name)).replaceAll('\\', '/')).filter((file) => !skip.includes(file)).sort();
  for (const file of files) hash.update(file).update('\0').update(fs.readFileSync(path.join(data, file))).update('\0');
  return { stamp: hash.digest('hex').slice(0, 12), files: files.length };
}

/** Packs the release site's text and cross-references, then stamps the catalogue and the study index. */
export function packReaderData(site) {
  const data = assertReleaseCopy(site);
  const catalogFile = path.join(data, 'catalog.json'), studyFile = path.join(data, 'study', 'index.json');
  const catalog = readJson(catalogFile);
  if (catalog.layout) throw Error('Reader packing refused: this release copy is already packed.');
  const text = packText(data, catalog), xref = packCrossRefs(data);
  const { stamp, files } = contentStamp(data, ['catalog.json', 'study/index.json']);
  writeJson(catalogFile, { ...catalog, stamp, layout: { textChunk: TEXT_CHUNK, xrefChunk: XREF_CHUNK } });
  if (fs.existsSync(studyFile)) writeJson(studyFile, { ...readJson(studyFile), stamp });
  return { text, xref, stamp, stampedFiles: files };
}
