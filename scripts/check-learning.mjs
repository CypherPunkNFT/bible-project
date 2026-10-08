// Checks the learning materials (content/learning/<id>.json; format in Research/Resources/LEARNING.md) against the
// site's KJV (data/text/kjv) and the site's own pages.
//   node scripts/check-learning.mjs              -> every workbook
//   node scripts/check-learning.mjs <id>         -> one workbook
// Checks: the shape; every reference parses and every verse in it exists in the KJV; every key verse is the KJV text of
// its reference (exact words and punctuation; the pilcrow and apostrophe style ignored); every quotation in double quotes
// inside our own words matches the KJV of that item's references word for word ("..." may join two pieces); every
// question has references, a kind, and ends with a question mark; no confidence words or BC/AD dates in our own words;
// every site page a workbook says it was built from exists. Exit code 1 when anything fails; each failure says where.
// build-learning.mjs imports the helpers below and refuses to build when this check fails.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const CONTENT = path.join(SITE, "content", "learning");
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

/** The site's books: code -> { num, name }, and num -> code. */
export function loadCatalog() {
  const catalog = readJson(path.join(SITE, "data", "catalog.json"));
  const byCode = new Map(catalog.books.map((b) => [b.code, { num: b.num, name: b.name, code: b.code }]));
  return { byCode };
}

/** Verse id (book * 1_000_000 + chapter * 1_000 + verse) -> KJV text, built from data/text/kjv/<BOOK>/<chunk>.json:
 *  plain strings and the first item of word arrays, with notes and paragraph marks left out. */
export function loadKjv(catalog, codes) {
  const text = new Map();
  for (const code of codes) {
    const book = catalog.byCode.get(code);
    const folder = path.join(SITE, "data", "text", "kjv", code);
    if (!book || !existsSync(folder)) continue;
    for (const chunk of readdirSync(folder).filter((f) => f.endsWith(".json"))) {
      for (const [chapter, body] of Object.entries(readJson(path.join(folder, chunk)))) {
        for (const verse of body.v ?? []) {
          if (!/^\d+$/.test(String(verse.n))) continue;
          const words = verse.r.map((part) => (typeof part === "string" ? part : Array.isArray(part) ? part[0] : "")).join("");
          text.set(book.num * 1_000_000 + Number(chapter) * 1_000 + Number(verse.n), words.replace(/\s+/g, " ").trim());
        }
      }
    }
  }
  return new Map([...text].sort((a, b) => a[0] - b[0]));
}

const REF = /^([0-9A-Z]{3}) (\d+)(?::(\d+))?(?:-(\d+)(?::(\d+))?)?$/;

/** "EXO 2", "EXO 5-12", "EXO 2:10", "EXO 2:1-10", "EXO 2:23-3:10" -> { code, c1, v1, c2, v2 } (v null = whole chapter). */
export function parseRef(ref) {
  const m = REF.exec(ref);
  if (!m) return null;
  const [, code, a, b, c, d] = m;
  if (b === undefined) return { code, c1: +a, v1: null, c2: c === undefined ? +a : +c, v2: null }; // chapters
  if (c === undefined) return { code, c1: +a, v1: +b, c2: +a, v2: +b }; // one verse
  if (d === undefined) return { code, c1: +a, v1: +b, c2: +a, v2: +c }; // verses in one chapter
  return { code, c1: +a, v1: +b, c2: +c, v2: +d }; // across chapters
}

/** "EXO 2:23-3:10" -> "Exodus 2:23–3:10". */
export function formatRef(ref, catalog) {
  const r = parseRef(ref);
  const name = catalog.byCode.get(r.code)?.name ?? r.code;
  if (r.v1 === null) return r.c1 === r.c2 ? `${name} ${r.c1}` : `${name} ${r.c1}–${r.c2}`;
  if (r.c1 === r.c2) return r.v1 === r.v2 ? `${name} ${r.c1}:${r.v1}` : `${name} ${r.c1}:${r.v1}–${r.v2}`;
  return `${name} ${r.c1}:${r.v1}–${r.c2}:${r.v2}`;
}

/** The verse ids a reference covers, in order, or an error string. */
export function refVerses(ref, catalog, kjv) {
  const r = parseRef(ref);
  if (!r) return `"${ref}" is not a reference like "EXO 2:1-10"`;
  const book = catalog.byCode.get(r.code);
  if (!book) return `"${ref}": no book with the code ${r.code}`;
  const base = book.num * 1_000_000;
  const inChapter = (c) => [...kjv.keys()].filter((id) => id > base + c * 1_000 && id < base + (c + 1) * 1_000);
  if (!inChapter(r.c1).length) return `"${ref}": ${book.name} has no chapter ${r.c1} in the KJV`;
  if (!inChapter(r.c2).length) return `"${ref}": ${book.name} has no chapter ${r.c2} in the KJV`;
  const first = r.v1 === null ? inChapter(r.c1)[0] : base + r.c1 * 1_000 + r.v1;
  const last = r.v2 === null ? inChapter(r.c2).at(-1) : base + r.c2 * 1_000 + r.v2;
  for (const id of [first, last]) if (!kjv.has(id)) return `"${ref}": verse ${Math.floor((id % 1e6) / 1e3)}:${id % 1e3} is not in the KJV`;
  if (first > last) return `"${ref}": the range runs backwards`;
  return [...kjv.keys()].filter((id) => id >= first && id <= last);
}

/** Lower case, apostrophes and hyphens dropped, every other mark a space; æ spelled ae. */
export function words(text) {
  return text.toLowerCase().replace(/æ/g, "ae").replace(/œ/g, "oe").normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/['’-]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

/** For an exact comparison: the pilcrow dropped, one kind of apostrophe, single spaces. */
const exact = (text) => text.replace(/¶/g, "").replace(/’/g, "'").replace(/\s+/g, " ").trim();

const QUOTE = /["“]([^"”]+)["”]/g;
const ELLIPSIS = /\.\.\.|…/;
const BANNED = /\b(undoubtedly|surely|clearly|proves?|proved|proven|obviously|certainly)\b/i;
const DATES = /\b\d+\s*(BC|B\.C\.|BCE|AD|A\.D\.|CE)\b|\b(AD|A\.D\.)\s*\d+/i;
const KINDS = ["observe", "interpret", "reflect"];

export function ownWords(text) {
  return text.replace(QUOTE, " ");
}

/** Every reference in refs exists; every quotation in text matches the KJV of those refs word for word. */
function checkItem(item, where, catalog, kjv, errors) {
  if (!Array.isArray(item.refs) || !item.refs.length) { errors.push(`${where}: needs at least one reference in "refs"`); return; }
  const ids = [];
  for (const ref of item.refs) {
    const found = refVerses(ref, catalog, kjv);
    if (typeof found === "string") errors.push(`${where}: ${found}`);
    else ids.push(...found);
  }
  if (typeof item.text !== "string" || !item.text.trim()) { errors.push(`${where}: "text" is empty`); return; }
  const scripture = ` ${words(ids.map((id) => kjv.get(id)).join(" "))} `;
  for (const [, quote] of item.text.matchAll(QUOTE)) {
    let at = 0;
    for (const piece of quote.split(ELLIPSIS).map(words).filter(Boolean)) {
      const found = scripture.indexOf(` ${piece} `, at);
      if (found < 0) { errors.push(`${where}: the quotation "${quote}" does not match the KJV of ${item.refs.join("; ")} word for word`); break; }
      at = found + piece.length;
    }
  }
  const own = ownWords(item.text);
  if (BANNED.test(own)) errors.push(`${where}: confidence word in our own words: "${own.match(BANNED)[0]}"`);
  if (DATES.test(own)) errors.push(`${where}: a BC/AD date ("${own.match(DATES)[0]}"); workbooks are from Scripture only`);
}

function checkKeyVerse(key, where, catalog, kjv, errors) {
  const found = refVerses(key.ref ?? "", catalog, kjv);
  if (typeof found === "string") { errors.push(`${where}: ${found}`); return; }
  const scripture = exact(found.map((id) => kjv.get(id)).join(" "));
  if (typeof key.text !== "string" || !scripture.includes(exact(key.text))) {
    errors.push(`${where}: the text is not the KJV of ${key.ref} word for word.\n    KJV:  ${scripture}\n    ours: ${key.text}`);
  }
}

/** A site page path this workbook says it was drawn from exists. */
function checkPage(page, where, errors) {
  const m = /^\/people\/([a-z0-9-]+)(?:\/(rule|word|mission))?$/.exec(page?.path ?? "");
  if (!m || !page.title) { errors.push(`${where}: needs a "path" like /people/<id> or /people/<id>/rule and a "title"`); return; }
  const [, id, aspect] = m;
  if (!existsSync(path.join(SITE, "data", "study", "people", `${id}.json`))) { errors.push(`${where}: no person ${id}`); return; }
  if (!aspect) return;
  const folder = path.join(SITE, "src", "data", "people-pages");
  const key = { rule: "rulers", word: "prophets", mission: "apostles" }[aspect];
  const has = readdirSync(folder).filter((f) => f.endsWith(".json") && f !== "index.json")
    .some((f) => (readJson(path.join(folder, f))[key] ?? []).some((p) => p.id === id));
  if (!has) errors.push(`${where}: ${id} has no "${aspect}" page in src/data/people-pages`);
}

export function checkWorkbook(book, file, catalog, kjv) {
  const errors = [];
  const need = (cond, message) => { if (!cond) errors.push(`${file}: ${message}`); };
  need(book.id === path.basename(file, ".json"), `"id" must be the file name (${path.basename(file, ".json")})`);
  for (const key of ["title", "subtitle", "summary", "checked"]) need(typeof book[key] === "string" && book[key].trim(), `"${key}" is missing`);
  need(book.kind === "workbook", `"kind" must be "workbook"`);
  need(Array.isArray(book.howToUse) && book.howToUse.length, `"howToUse" needs at least one paragraph`);
  need(Array.isArray(book.sessions) && book.sessions.length, `"sessions" is empty`);
  need(Array.isArray(book.builtFrom) && book.builtFrom.length, `"builtFrom" must name the site pages it was drawn from`);
  (book.builtFrom ?? []).forEach((page, i) => checkPage(page, `${file} builtFrom[${i}]`, errors));
  (book.intro?.paragraphs ?? []).forEach((p, i) => checkItem(p, `${file} intro paragraph ${i + 1}`, catalog, kjv, errors));
  (book.intro?.keyVerses ?? []).forEach((k, i) => checkKeyVerse(k, `${file} intro key verse ${i + 1}`, catalog, kjv, errors));
  (book.sessions ?? []).forEach((s, n) => {
    const where = `${file} session ${n + 1} (${s.title})`;
    if (s.number !== n + 1) errors.push(`${where}: "number" should be ${n + 1}`);
    if (!Array.isArray(s.read) || !s.read.length) errors.push(`${where}: "read" needs the passage to read`);
    for (const ref of s.read ?? []) { const r = refVerses(ref, catalog, kjv); if (typeof r === "string") errors.push(`${where} read: ${r}`); }
    (s.summary ?? []).forEach((p, i) => checkItem(p, `${where} summary ${i + 1}`, catalog, kjv, errors));
    if (!s.summary?.length) errors.push(`${where}: no summary`);
    (s.keyVerses ?? []).forEach((k, i) => checkKeyVerse(k, `${where} key verse ${i + 1}`, catalog, kjv, errors));
    if ((s.keyVerses ?? []).length < 2 || s.keyVerses.length > 3) errors.push(`${where}: 2 or 3 key verses`);
    const questions = s.questions ?? [];
    if (questions.length < 5 || questions.length > 7) errors.push(`${where}: 5 to 7 questions (has ${questions.length})`);
    questions.forEach((q, i) => {
      const at = `${where} question ${i + 1}`;
      checkItem(q, at, catalog, kjv, errors);
      if (!KINDS.includes(q.kind)) errors.push(`${at}: "kind" must be one of ${KINDS.join(", ")}`);
      if (!/\?["”)]?$/.test(q.text?.trim() ?? "")) errors.push(`${at}: a question ends with a question mark`);
    });
  });
  return errors;
}

/** Every book code a workbook uses, so only those books are loaded. */
export function codesIn(book) {
  const refs = JSON.stringify(book).match(/"[0-9A-Z]{3} \d[^"]*"/g) ?? [];
  return new Set(refs.map((r) => r.slice(1, 4)));
}

export function loadWorkbooks(only) {
  const files = readdirSync(CONTENT).filter((f) => f.endsWith(".json") && (!only || f === `${only}.json`)).sort();
  return files.map((f) => ({ file: f, book: readJson(path.join(CONTENT, f)) }));
}

function main() {
  const only = process.argv[2];
  const books = loadWorkbooks(only);
  if (!books.length) { console.error(`No workbooks in ${CONTENT}${only ? ` named ${only}.json` : ""}`); return 1; }
  const catalog = loadCatalog();
  const kjv = loadKjv(catalog, new Set(books.flatMap(({ book }) => [...codesIn(book)])));
  let failures = 0;
  for (const { file, book } of books) {
    const errors = checkWorkbook(book, file, catalog, kjv);
    failures += errors.length;
    console.log(`${file}: ${errors.length ? `${errors.length} problem(s)` : "OK"}`);
    for (const e of errors) console.log(`  ${e}`);
  }
  return failures ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) process.exit(main());
