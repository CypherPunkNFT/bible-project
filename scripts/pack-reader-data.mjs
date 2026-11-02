// Release only: groups the reader's chapter files so the release stays well inside Cloudflare Workers' 100,000-file limit
// (17,949 files before this, 2026-10-20), and stamps the data with a hash of its contents so browsers may keep it.
//   text/<slug>/<book>/<k>.json    five chapters each (scripts/build-data.py)  ->  c10-<k>.json, ten chapters each
//   xref/<book>/<chapter>.json     one chapter each                             ->  g<k>.json, ten chapters each
// Reads the shared data folder, which local preview and the Python builds read, and never changes it; writes only into the release copy.
// The site reads the grouped files only when the catalogue says "layout" (src/lib/data.ts setLayout).
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { readAhead } from './read-ahead.mjs';

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
function assertReleaseCopy(site, source) {
  const data = path.join(site, 'data');
  if (fs.lstatSync(data).isSymbolicLink()) throw Error(`Reader packing refused: ${data} is a link, not a copied folder.`);
  if (!fs.realpathSync(data).includes(`${path.sep}.release${path.sep}`)) throw Error(`Reader packing refused: ${data} is outside a .release copy.`);
  if (fs.realpathSync(source) === fs.realpathSync(data)) throw Error(`Reader packing refused: the source ${source} is the release copy itself.`);
  for (const dir of [path.join(data, 'text'), path.join(data, 'xref')]) {
    fs.mkdirSync(dir, { recursive: true });
    if (fs.lstatSync(dir).isSymbolicLink()) throw Error(`Reader packing refused: ${dir} is a link, not a copied folder.`);
  }
  return data;
}

const numbered = (dir, pattern) => fs.readdirSync(dir).map((name) => {
  const match = pattern.exec(name);
  if (!match) throw Error(`Reader packing refused: unexpected file ${path.join(dir, name)}`);
  return [Number(match[1]), name];
});

const filesIn = (dir) => fs.readdirSync(dir, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile()).map((entry) => path.join(entry.parentPath, entry.name));

/** Ten chapters to a text file; checks every chapter of the catalogue is in the file the site will open. */
function packText(source, data, catalog) {
  const ratio = TEXT_CHUNK / SOURCE_CHUNK, packed = new Set();
  let before = 0, after = 0;
  for (const version of catalog.translations) for (const [code, labels] of Object.entries(version.books)) {
    const dir = path.join(source, 'text', version.slug, code), target = path.join(data, 'text', version.slug, code);
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
    fs.mkdirSync(target, { recursive: true });
    for (const [g, group] of groups) { writeJson(path.join(target, `c${TEXT_CHUNK}-${g}.json`), group); after++; }
    packed.add(path.resolve(dir));
  }
  // Anything the catalogue does not list stays in the release as it is.
  fs.cpSync(path.join(source, 'text'), path.join(data, 'text'), { recursive: true, dereference: true, filter: (file) => !packed.has(path.resolve(file)) });
  return { before, after };
}

/** Ten chapters to a cross-reference file. */
function packCrossRefs(source, data) {
  let before = 0, after = 0;
  for (const code of fs.readdirSync(path.join(source, 'xref'))) {
    const dir = path.join(source, 'xref', code), target = path.join(data, 'xref', code), groups = new Map(), originals = numbered(dir, /^(\d+)\.json$/);
    for (const [chapter, name] of originals) {
      const g = Math.floor((chapter - 1) / XREF_CHUNK);
      groups.set(g, { ...groups.get(g), [String(chapter)]: readJson(path.join(dir, name)) });
      before++;
    }
    fs.mkdirSync(target, { recursive: true });
    for (const [g, group] of groups) { writeJson(path.join(target, `g${g}.json`), group); after++; }
    for (const [chapter] of originals) {
      if (!readJson(path.join(target, `g${Math.floor((chapter - 1) / XREF_CHUNK)}.json`))[String(chapter)]) throw Error(`Cross-references for ${code} ${chapter} are missing from their group.`);
    }
  }
  return { before, after };
}

const STAMP_WINDOW = 64;

/** A hash of every data file but the two indexes that carry it, so any change to any file gives new addresses. */
async function contentStamp(data, skip) {
  const hash = createHash('sha256');
  const files = fs.readdirSync(data, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile())
    .map((entry) => path.relative(data, path.join(entry.parentPath, entry.name)).replaceAll('\\', '/')).filter((file) => !skip.includes(file)).sort();
  // Reads a window at once and hashes it in order: the stamp must not depend on which read finished first.
  for (let at = 0; at < files.length; at += STAMP_WINDOW) {
    const window = files.slice(at, at + STAMP_WINDOW);
    const bodies = await Promise.all(window.map((file) => fs.promises.readFile(path.join(data, file))));
    window.forEach((file, index) => hash.update(file).update('\0').update(bodies[index]).update('\0'));
  }
  return { stamp: hash.digest('hex').slice(0, 12), files: files.length };
}

/** Packs the source folder's text and cross-references into the release site, then stamps the catalogue and the study index. */
export async function packReaderData(site, source) {
  const data = assertReleaseCopy(site, source);
  const catalogFile = path.join(data, 'catalog.json'), studyFile = path.join(data, 'study', 'index.json');
  const catalog = readJson(catalogFile);
  if (catalog.layout) throw Error('Reader packing refused: this release copy is already packed.');
  // The catalogue was copied minutes ago and the text is read now: a data build in between would pair them wrongly.
  if (!fs.readFileSync(path.join(source, 'catalog.json')).equals(fs.readFileSync(path.join(data, 'catalog.json')))) throw Error(`Reader packing refused: ${source} changed during this prepare (its catalog.json differs from the release copy's). Prepare again.`);
  // Writing stays in one thread: more threads made this USB disk nearly four times slower (48 s against 180 s, 41,000 files).
  await readAhead([...filesIn(path.join(source, 'text')), ...filesIn(path.join(source, 'xref'))]);
  const text = packText(source, data, catalog), xref = packCrossRefs(source, data);
  const { stamp, files } = await contentStamp(data, ['catalog.json', 'study/index.json']);
  writeJson(catalogFile, { ...catalog, stamp, layout: { textChunk: TEXT_CHUNK, xrefChunk: XREF_CHUNK } });
  if (fs.existsSync(studyFile)) writeJson(studyFile, { ...readJson(studyFile), stamp });
  return { text, xref, stamp, stampedFiles: files };
}
