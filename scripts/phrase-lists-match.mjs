// Which phrases of a language's phrase list (data/i18n/<folder>/ui.json, {English: translation}) each built code file
// shows, so a page can load a small list first (translation system, stage 5 job 17; SiteTranslation/system/HANDOFF.md).
// A phrase is "in" a code file when every fixed piece of it is written there, at word edges, ignoring case, a closing
// stop and the code's escapes. Anything not found in code (text from data files), anything in the code every page loads,
// short labels, plural messages and phrases sharing their translation go to the core list every page loads first; the
// rest go to the code files that show them. Nothing is lost when this guesses wrong: the full list still loads after
// the first paint (src/lib/phrase-lists.ts).
import fs from 'node:fs';
import path from 'node:path';

const ESCAPE = /\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})|\\x([0-9a-fA-F]{2})|\\(.)/g;
const SPACE = /[\s ]+/g;
const EDGE = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;
const INDEX_WORD = /[a-z0-9]{3,}/g; // the same on both sides (phrase and code), so any letters outside a-z only narrow less
export const MOST_CORE_WORDS = 2; // a label this short is as likely to come from data as from code: every page gets it
export const MOST_FILES = 8; // a phrase written in this many files is shared furniture: every page gets it

/** Built code as the reader would see its words: escapes undone, spaces joined, lower case. */
export function readableCode(code) {
  const decoded = code.replace(ESCAPE, (_all, wide, four, two, other) => {
    if (wide || four || two) return String.fromCodePoint(parseInt(wide || four || two, 16));
    return 'ntrfv'.includes(other) ? ' ' : other;
  });
  return decoded.replace(SPACE, ' ').toLowerCase();
}

/** The fixed pieces of a phrase: split at {n}, each without the marks at its edges, lower case. */
export function phrasePieces(key) {
  if (key.startsWith('plural:')) {
    let forms;
    try { forms = JSON.parse(key.slice('plural:'.length)); } catch { return []; }
    return Array.isArray(forms) ? forms.flatMap((form) => (typeof form === 'string' ? phrasePieces(form) : [])) : [];
  }
  return key.split('{n}').map((part) => part.replace(SPACE, ' ').replace(EDGE, '').toLowerCase()).filter((part) => part.length > 0);
}

const isWordCharacter = (character) => character !== undefined && /[\p{L}\p{N}]/u.test(character);

/** Whether a piece is written in the code with no letter or digit touching either end of it. */
function writtenIn(code, piece) {
  for (let at = code.indexOf(piece); at !== -1; at = code.indexOf(piece, at + 1)) {
    if (!isWordCharacter(code[at - 1]) && !isWordCharacter(code[at + piece.length])) return true;
  }
  return false;
}

/** Every code file the reader's page can load, from index.html outwards (as scripts/prune-release-assets.mjs walks it),
 * and the ones the entry loads before anything else (index.html's own script and its modulepreload links). */
export function liveCode(html, assetsDir) {
  const names = new Set(fs.readdirSync(assetsDir).filter((name) => name.endsWith('.js')));
  const entry = /<script[^>]*type="module"[^>]*src="\/assets\/([\w.-]+\.js)"/.exec(html)?.[1];
  if (!entry || !names.has(entry)) throw new Error(`phrase lists: index.html names no entry script in ${assetsDir} (found ${entry ?? 'none'})`);
  const first = new Set([entry, ...[...html.matchAll(/<link[^>]*rel="modulepreload"[^>]*href="\/assets\/([\w.-]+\.js)"/g)].map((match) => match[1])]);
  const live = new Map(), queue = [entry, ...first];
  for (let index = 0; index < queue.length; index++) {
    const name = queue[index];
    if (live.has(name) || !names.has(name)) continue;
    const code = fs.readFileSync(path.join(assetsDir, name), 'utf8');
    live.set(name, code);
    for (const match of code.matchAll(/[\w.-]+\.js/g)) if (names.has(match[0]) && !live.has(match[0])) queue.push(match[0]);
  }
  return { entry, first: [...first].filter((name) => live.has(name)), code: live };
}

/** The files holding every one of the words, rarest word first; every file when there is no word ("of {n}", "{n}–{n}"). */
function filesWithWords(words, byWord, every) {
  const lists = [...new Set(words)].map((word) => byWord.get(word) ?? []).sort((a, b) => a.length - b.length);
  if (!lists.length) return every;
  let files = lists[0];
  for (const list of lists.slice(1)) {
    if (!files.length) break;
    const other = new Set(list);
    files = files.filter((index) => other.has(index));
  }
  return files;
}

/** For each phrase (the union of every language's keys): the code files that show it. A phrase with no fixed piece
 * (only "{n}") is shown by none, which puts it in core. */
export function filesShowing(keys, code) {
  const files = [...code.keys()].sort();
  const readable = files.map((name) => readableCode(code.get(name)));
  const byWord = new Map();
  readable.forEach((text, index) => {
    for (const word of new Set(text.match(INDEX_WORD) ?? [])) {
      if (!byWord.has(word)) byWord.set(word, []);
      byWord.get(word).push(index);
    }
  });
  const every = readable.map((_text, index) => index);
  const found = new Map();
  for (const key of keys) {
    const pieces = phrasePieces(key);
    if (!pieces.length) { found.set(key, []); continue; }
    const candidates = filesWithWords(pieces.flatMap((piece) => piece.match(INDEX_WORD) ?? []), byWord, every);
    const showing = [];
    for (const index of candidates) {
      if (!pieces.every((piece) => writtenIn(readable[index], piece))) continue;
      showing.push(files[index]);
      if (showing.length >= MOST_FILES) break; // core already: the rest need not be looked for
    }
    found.set(key, showing);
  }
  return found;
}

const wordCount = (key) => (key.replace(/\{n\}/g, ' ').match(/[\p{L}\p{N}]+/gu) ?? []).length;

/** A phrase that goes to core whatever code shows it: a plural message, or a label of a word or two. */
export const coreByRule = (key) => key.startsWith('plural:') || wordCount(key) <= MOST_CORE_WORDS;

/** Whether a phrase the code shows goes to core: shown by no code (data), by the code every page loads, or by many files. */
export const coreByCode = (showing, first) => showing.length === 0 || showing.length >= MOST_FILES || showing.some((name) => first.has(name));
