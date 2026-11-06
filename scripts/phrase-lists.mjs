// Small phrase lists per page (translation system, stage 5 job 17; SiteTranslation/system/HANDOFF.md, "Carried over from
// the Academic chat", part 1). Each language's full list (data/i18n/<folder>/ui.json) is split by the built code:
//   data/i18n/<folder>/phrases/core.json   {build, groups: {code file: group}, phrases}  every page loads it first
//   data/i18n/<folder>/phrases/gNN.json    {build, phrases}                              loaded when its code runs
// "build" is the entry file's name (index-<hash>.js), which changes whenever any code file does; the site uses the lists
// only when it matches the code running, and otherwise reads ui.json as before. The full list still loads after the
// first paint, so a phrase this puts in the wrong place is late, never lost. Group names do not depend on the language,
// so every language has the same files (the release refuses languages whose files differ).
//   node scripts/phrase-lists.mjs                 dist/ and data/i18n of this Website folder, under the dist lock
//   node scripts/phrase-lists.mjs --site <dir>    a release copy: <dir>/index.html, <dir>/assets, <dir>/data/i18n
// The release steps also stamp the pages with a hash of the lists (writeStamp), so browsers may keep them until it changes.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { coreByCode, coreByRule, filesShowing, liveCode } from './phrase-lists-match.mjs';

export const LIST_FOLDER = 'phrases';
export const OWN_GROUP_BYTES = 24 * 1024; // a code file whose phrases weigh this much (in English) gets a list of its own
export const GROUP_BYTES = 48 * 1024; // smaller ones share lists up to this weight
export const MOST_GROUPS = 64; // a release limit of 100,000 files: refuse rather than grow without bound
const FOLDER = /^[a-z]{2,3}$/;
const LIST_FILE = /^(core|g\d{2,3})\.json$/;
const STAMP = /^[0-9a-f]{12}$/;
export const STAMP_MARKER = /\/\*phrase-stamp\*\/"[0-9a-f]*"/g;

/** The language folders under i18n that have a phrase list. */
export function phraseFolders(i18nDir) {
  return fs.readdirSync(i18nDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && FOLDER.test(entry.name) && fs.existsSync(path.join(i18nDir, entry.name, 'ui.json')))
    .map((entry) => entry.name).sort();
}

function readList(file) {
  let value;
  try {
    value = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`phrase lists: could not read ${file} as JSON (${error.message}); expected {English: translation}`);
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`phrase lists: ${file} is not a JSON object of {English: translation}`);
  return value;
}

/** Code file -> group name, from the English weight of each file's own phrases: heavy files alone, light ones together. */
export function planGroups(keysByFile) {
  const weight = (keys) => keys.reduce((sum, key) => sum + 2 * Buffer.byteLength(key) + 8, 0);
  const files = [...keysByFile.keys()].sort();
  const lists = [];
  let shared = null;
  for (const file of files) {
    const bytes = weight(keysByFile.get(file));
    if (bytes >= OWN_GROUP_BYTES) lists.push([file]);
    else {
      if (!shared || shared.bytes + bytes > GROUP_BYTES) lists.push((shared = { files: [], bytes: 0 }).files);
      shared.files.push(file);
      shared.bytes += bytes;
    }
  }
  if (lists.length > MOST_GROUPS) throw new Error(`phrase lists: ${lists.length} groups would be made, more than ${MOST_GROUPS}; raise GROUP_BYTES rather than add files to every language`);
  const groups = new Map();
  lists.forEach((group, index) => group.forEach((file) => groups.set(file, `g${String(index + 1).padStart(2, '0')}`)));
  return groups;
}

/** English keys whose translation another key shares: the page translator keeps the first English it meets for a
 * translation, so these stay in core, in ui.json's order, to meet them in the same order as before. */
function sharedTranslations(list) {
  const seen = new Map(), shared = new Set();
  for (const [key, value] of Object.entries(list)) {
    if (typeof value !== 'string') continue;
    const normal = value.replace(/\s+/g, ' ').trim();
    for (const form of [normal, normal.toUpperCase()]) {
      if (seen.has(form) && seen.get(form) !== key) { shared.add(key); shared.add(seen.get(form)); }
      else seen.set(form, key);
    }
  }
  return shared;
}

function writeAtomically(file, value) {
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(value), 'utf8');
  for (let attempt = 1; ; attempt++) {
    try {
      fs.renameSync(temporary, file);
      return;
    } catch (error) {
      // The always-on preview may be sending the old file this moment; Windows refuses the swap until it closes.
      if (attempt >= 5 || !['EPERM', 'EBUSY', 'EACCES'].includes(error.code)) {
        fs.rmSync(temporary, { force: true });
        throw new Error(`phrase lists: could not put ${file} in place (${error.message})`);
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100 * attempt);
    }
  }
}

/** Splits every language's list by the code in assetsDir that html loads; returns what it wrote. */
export function writePhraseLists({ html, assetsDir, i18nDir, folders = phraseFolders(i18nDir) }) {
  for (const folder of folders) if (!FOLDER.test(folder)) throw new Error(`phrase lists: "${folder}" is not a language folder (two or three small letters)`);
  const { entry, first, code } = liveCode(html, assetsDir);
  const lists = new Map(folders.map((folder) => [folder, readList(path.join(i18nDir, folder, 'ui.json'))]));
  const keys = [...new Set([...lists.values()].flatMap((list) => Object.keys(list)))];
  const core = new Set(keys.filter(coreByRule));
  const showing = filesShowing(keys.filter((key) => !core.has(key)), code);
  const firstFiles = new Set(first), byFile = new Map();
  for (const [key, files] of showing) {
    if (coreByCode(files, firstFiles)) core.add(key);
    else for (const file of files) byFile.set(file, [...(byFile.get(file) ?? []), key]);
  }
  const groups = planGroups(byFile);
  const groupNames = [...new Set(groups.values())];
  const report = { build: entry, codeFiles: code.size, coreKeys: core.size, groups: groupNames.length, folders: {} };
  for (const [folder, list] of lists) report.folders[folder] = writeFolder(path.join(i18nDir, folder, LIST_FOLDER), { entry, list, core, byFile, groups, groupNames });
  return report;
}

function writeFolder(target, { entry, list, core, byFile, groups, groupNames }) {
  const shared = sharedTranslations(list);
  const wanted = (key) => key in list && list[key] !== key;
  const coreList = Object.fromEntries(Object.entries(list).filter(([key]) => wanted(key) && (core.has(key) || shared.has(key))));
  const groupLists = new Map(groupNames.map((name) => [name, {}]));
  for (const [file, keys] of byFile) for (const key of keys) if (wanted(key) && !(key in coreList)) groupLists.get(groups.get(file))[key] = list[key];
  fs.mkdirSync(target, { recursive: true });
  if (fs.lstatSync(target).isSymbolicLink()) throw new Error(`phrase lists: ${target} is a link, not a folder; refused`);
  writeAtomically(path.join(target, 'core.json'), { build: entry, groups: Object.fromEntries(groups), phrases: coreList });
  for (const [name, phrases] of groupLists) writeAtomically(path.join(target, `${name}.json`), { build: entry, phrases });
  const written = new Set(['core.json', ...groupNames.map((name) => `${name}.json`)]);
  let removed = 0;
  for (const name of fs.readdirSync(target)) {
    const file = path.join(target, name);
    if (written.has(name) || !(LIST_FILE.test(name) || name.endsWith('.tmp')) || !fs.lstatSync(file).isFile()) continue;
    fs.rmSync(file);
    removed++;
  }
  return { core: Object.keys(coreList).length, inGroups: [...groupLists.values()].reduce((sum, phrases) => sum + Object.keys(phrases).length, 0), removed };
}

/** A hash of every language's lists: changes whenever any of them does. */
export function phraseStamp(i18nDir, folders = phraseFolders(i18nDir)) {
  const hash = createHash('sha256');
  for (const folder of [...folders].sort()) {
    const dir = path.join(i18nDir, folder, LIST_FOLDER);
    for (const name of fs.readdirSync(dir).filter((file) => LIST_FILE.test(file)).sort()) {
      hash.update(`${folder}/${name}`).update('\0').update(fs.readFileSync(path.join(dir, name))).update('\0');
    }
  }
  return hash.digest('hex').slice(0, 12);
}

/** Writes the stamp into a page's language script; refuses a page without exactly one marker. */
export function writeStamp(htmlFile, stamp) {
  if (!STAMP.test(stamp)) throw new Error(`phrase lists: the stamp must be 12 hex letters; got ${JSON.stringify(stamp)}`);
  const html = fs.readFileSync(htmlFile, 'utf8');
  const count = (html.match(STAMP_MARKER) ?? []).length;
  if (count !== 1) throw new Error(`phrase lists: expected one /*phrase-stamp*/ marker in ${htmlFile}, found ${count}`);
  fs.writeFileSync(htmlFile, html.replace(STAMP_MARKER, `/*phrase-stamp*/"${stamp}"`), 'utf8');
}

/** The release copy: split the lists for its own code, then stamp every page that carries the language script. */
export function preparePhraseLists(site) {
  const i18nDir = path.join(site, 'data', 'i18n');
  const report = writePhraseLists({ html: fs.readFileSync(path.join(site, 'index.html'), 'utf8'), assetsDir: path.join(site, 'assets'), i18nDir });
  const stamp = phraseStamp(i18nDir, Object.keys(report.folders));
  const pages = fs.readdirSync(site, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html')).map((entry) => path.join(entry.parentPath, entry.name))
    .filter((file) => (fs.readFileSync(file, 'utf8').match(STAMP_MARKER) ?? []).length > 0);
  for (const file of pages) writeStamp(file, stamp);
  return { ...report, stamp, stampedPages: pages.length };
}

async function main() {
  const at = process.argv.indexOf('--site');
  if (at > 0) return console.log('Phrase lists:', JSON.stringify(preparePhraseLists(path.resolve(process.argv[at + 1] ?? ''))));
  const root = fileURLToPath(new URL('../', import.meta.url));
  const { acquireDistLock, releaseDistLock } = await import('./dist-mirror.mjs');
  const dist = path.join(root, 'dist');
  if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error(`phrase lists: ${dist} has no index.html; build the site first`);
  const acquired = acquireDistLock(root); // a build mirroring into dist/ meanwhile would show this half old code, half new
  try {
    const report = writePhraseLists({ html: fs.readFileSync(path.join(dist, 'index.html'), 'utf8'), assetsDir: path.join(dist, 'assets'), i18nDir: path.join(root, 'data', 'i18n') });
    console.log('Phrase lists:', JSON.stringify(report));
  } finally {
    if (acquired) releaseDistLock(root);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
