// Changes the words on screen to the chosen language in place, with no reload and no re-render.
// Two sources of words: the page code's own text (headings, buttons, labels) from data/i18n/<folder>/ui.json,
// {English: translation}, written by content/translation/apply.py from the "page" chunks; and, when the language
// changes, each content file already read, fetched in English and in the old and new languages and paired string by
// string. Every text is traced back to its English and then out to the chosen language, so it works in any direction.
// A text matches when it is one of the known strings, or one with other numbers, or known pieces joined by " · ". React keeps whatever it rendered; when it writes a
// text or label again, the observer swaps it again. Files read after the change come in the new language (data.ts).
// Anything inside translate="no" is left alone.
import { fadeWordsIn, fadeWordsOut, holdNewWords } from "./language-fade";
import { languageDirection, languageFolder, loadedData, setSiteLanguage, siteLanguage, type LanguageCode } from "./language";

const ATTRIBUTES = ["aria-label", "title", "placeholder", "alt"];
const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE", "PRE"]);

const toEnglish = new Map<string, string>(); // for text first seen already translated; several English strings can share one translation, so the first stands
const fromEnglish = new Map<string, Map<string, string>>(); // folder -> English -> translation
const loaded = new Map<string, Promise<void>>(); // "folder ui" and "folder path": read, or being read
let target: string | null = null;
let observer: MutationObserver | null = null;
// What each text or label said before it was changed: it goes back to exactly that, however many languages came between.
const originals = new WeakMap<Text | Attr, { source: string; written: string }>();

const BIBLE_WAIT_MS = 800;
const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));

const normal = (text: string) => text.replace(/\s+/g, " ").trim();

function learn(folder: string, english: string, translated: string): void {
  const [en, tr] = [normal(english), normal(translated)];
  if (!en || en === tr) return;
  if (!toEnglish.has(tr)) toEnglish.set(tr, en);
  if (!fromEnglish.has(folder)) fromEnglish.set(folder, new Map());
  fromEnglish.get(folder)!.set(en, translated.trim());
}

/** The same string in the English and the translated copy of a file, at the same place. */
function pair(folder: string, english: unknown, translated: unknown): void {
  if (typeof english === "string" && typeof translated === "string") learn(folder, english, translated);
  else if (Array.isArray(english) && Array.isArray(translated)) {
    if (english.length === translated.length) english.forEach((item, index) => pair(folder, item, translated[index]));
  } else if (english && translated && typeof english === "object" && typeof translated === "object") {
    const other = translated as Record<string, unknown>;
    for (const [key, value] of Object.entries(english)) if (key in other) pair(folder, value, other[key]);
  }
}

async function readJson(url: string): Promise<unknown> {
  // A release replaces these files under the same address, and /data/ is stored for a long time: ask each time whether they changed.
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function loadStrings(folder: string, path: string | null): Promise<void> {
  const key = `${folder} ${path ?? "ui"}`;
  const started = loaded.get(key);
  if (started) return started;
  const reading = readStrings(folder, path, key);
  loaded.set(key, reading);
  return reading;
}

async function readStrings(folder: string, path: string | null, key: string): Promise<void> {
  try {
    if (path === null) {
      const strings = (await readJson(`/data/i18n/${folder}/ui.json`)) as Record<string, string>;
      for (const [english, translated] of Object.entries(strings)) {
        learn(folder, english, translated);
        // Pages also type labels in capitals ("ISAIAH 40:8", "OLD TESTAMENT").
        if (english !== english.toUpperCase()) learn(folder, english.toUpperCase(), translated.toUpperCase());
      }
    } else {
      const [english, translated] = await Promise.all([readJson(`/data/${path}`), readJson(`/data/i18n/${folder}/${path}`)]);
      pair(folder, english, translated);
    }
  } catch (error) {
    loaded.delete(key);
    console.warn(`page translation: could not read the ${folder} strings for ${path ?? "the page text"} (${String(error)}); that text keeps its current language`);
  }
}

// The study pages' own text (the Academic studies' bodies and the like) is a second, larger file, read only on the pages that
// show it: data/i18n/<folder>/ui-study.json, {English: translation}, written by apply.py from the "studytext" chunks.
const STUDY_PATH = /^\/(study|teachers)(\/|$)/;
const onStudyPage = () => typeof location !== "undefined" && STUDY_PATH.test(location.pathname);

function loadStudyStrings(folder: string): Promise<void> {
  const key = `${folder} study`;
  const started = loaded.get(key);
  if (started) return started;
  const reading = (async () => {
    try {
      const strings = (await readJson(`/data/i18n/${folder}/ui-study.json`)) as Record<string, string>;
      for (const [english, translated] of Object.entries(strings)) {
        learn(folder, english, translated);
        // Names of God and the like are set in capitals on the page ("KING OF GLORY").
        if (english !== english.toUpperCase()) learn(folder, english.toUpperCase(), translated.toUpperCase());
      }
    } catch (error) {
      // Kept as read: a missing file is reported once, not on every change to the page.
      console.warn(`page translation: could not read the ${folder} study strings (${String(error)}); those pages keep their current language`);
    }
  })();
  loaded.set(key, reading);
  return reading;
}

/** Called as the page changes: arriving on a study page in a translated language reads its extra strings, then translates what is shown. */
function wantStudyStrings(): void {
  if (!target || !onStudyPage() || loaded.has(`${target} study`)) return;
  const folder = target;
  void loadStudyStrings(folder).then(() => {
    if (target === folder) translateTree(document.body);
  });
}

function lookup(key: string): string | null {
  const english = toEnglish.get(key) ?? key;
  const value = target ? fromEnglish.get(target)?.get(english) : english;
  return value && value !== key ? value : null;
}

// A known name or label followed only by numbers: "Isaiah 40:8 · RVR", "1 Peter 3:15", "Chapter 3", "Part 01".
const NAME_AND_NUMBER = /^((?:[1-3] )?\D+?) (\d[\d:.,–-]*(?: ?[·|].*)?)$/;
// Counts stand as "{n}" in the strings ("{n} versions", "{n} mi E of city hall"), so one entry serves every number.
const NUMBER = /\d(?:[\d,.]*\d)?/g;
// A line put together from pieces, each translated on its own: "Pregnancy · 3.3 mi E of city hall", "Continue: Psalms 105".
const PIECES = /(\s+·\s+|\s+\|\s+|:\s+)/;

function withNumbers(key: string): string | null {
  const numbers = key.match(NUMBER);
  const shape = key.replace(NUMBER, "{n}");
  // A number alone stays a number: "{n}" in the strings comes from phrases like "the {n}", which say nothing about a bare "6".
  const template = numbers && shape !== "{n}" && lookup(shape);
  if (!template) return null;
  let index = 0;
  return template.replace(/\{n\}/g, () => numbers[index++] ?? "");
}

/** A known label written with a small first letter or a closing stop: "for adults and families." */
function withCase(key: string): string | null {
  const [, body, end] = /^(.*?)([.:,;!?]*)$/.exec(key)!;
  const label = body.charAt(0).toUpperCase() + body.slice(1);
  const value = label && label !== key ? lookup(label) ?? withNumbers(label) : null;
  if (!value) return null;
  return (body.charAt(0) === label.charAt(0) ? value : value.charAt(0).toLowerCase() + value.slice(1)) + end;
}

function translatedPiece(key: string): string | null {
  const whole = lookup(key) ?? withNumbers(key) ?? withCase(key);
  if (whole) return whole;
  const parts = NAME_AND_NUMBER.exec(key);
  const name = parts && lookup(parts[1]);
  return name ? `${name} ${parts[2]}` : null;
}

function translated(text: string): string | null {
  const key = normal(text);
  if (!key) return null;
  const whole = translatedPiece(key);
  if (whole) return whole;
  const parts = key.split(PIECES);
  if (parts.length < 3) return null;
  let changed = false;
  const joined = parts.map((part, index) => {
    const value = index % 2 ? null : translatedPiece(part);
    if (value) changed = true;
    return value ?? part;
  }).join("");
  return changed ? joined : null;
}

// Arabic reads a verse range "6:24–25" as "25–6:24" unless the invisible marks around it hold it together, left to right.
const VERSE_RANGE = /\d+:\d+[–-]\d+(?::\d+)?/g;
const heldTogether = (value: string) => (target === "ar" ? value.replace(VERSE_RANGE, "\u2066$&\u2069") : value);

function retranslate(node: Text | Attr): void {
  const raw = node.nodeValue ?? "";
  const original = originals.get(node);
  const source = original?.written === raw ? original.source : raw;
  const value = translated(source);
  const next = value ? source.match(/^\s*/)![0] + heldTogether(value) + source.match(/\s*$/)![0] : source;
  if (next === raw) return;
  originals.set(node, { source, written: next });
  node.nodeValue = next;
}

const leftAlone = (element: Element | null) =>
  !element || SKIP.has(element.tagName) || element.closest("[translate='no']:not(html)") !== null;

// A Bible's own words are never page text: the reader sets some of them a word to a node, so "of" would become "de".
// Anything marked with its own language is such a text already in the language it means to be.
const isScripture = (element: Element | null) => element?.closest(".scripture, [lang]:not(html)") != null;

function translateText(node: Text): void {
  if (!leftAlone(node.parentElement) && !isScripture(node.parentElement)) retranslate(node);
}

function translateAttribute(element: Element, name: string): void {
  const attribute = element.getAttributeNode(name);
  // A text box's contents are the reader's own words, but its placeholder and label are page text.
  if (attribute && !leftAlone(element.tagName === "TEXTAREA" ? element.parentElement : element)) retranslate(attribute);
}

function translateTree(root: Node): void {
  if (root.nodeType === Node.TEXT_NODE) return translateText(root as Text);
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let node: Node | null = root; node; node = walker.nextNode()) {
    if (node.nodeType === Node.TEXT_NODE) translateText(node as Text);
    else for (const name of ATTRIBUTES) if ((node as Element).hasAttribute(name)) translateAttribute(node as Element, name);
  }
}

function watch(): void {
  if (observer) return;
  observer = new MutationObserver((records) => {
    wantStudyStrings();
    for (const record of records) {
      if (record.type === "characterData") translateText(record.target as Text);
      else if (record.type === "attributes") translateAttribute(record.target as Element, record.attributeName!);
      else record.addedNodes.forEach((node) => {
        translateTree(node);
        holdNewWords(node);
      });
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRIBUTES });
}

function markDocument(code: LanguageCode, folder: string | null): void {
  const root = document.documentElement;
  root.lang = code;
  root.dir = languageDirection(code);
  // The reader chose this language here, so the browser's own "translate this page?" bar would only undo it.
  if (folder) root.setAttribute("translate", "no");
  else root.removeAttribute("translate");
  document.querySelector("meta[name='google'][content='notranslate']")?.remove();
  if (folder) document.head.append(Object.assign(document.createElement("meta"), { name: "google", content: "notranslate" }));
}

/** A reader on screen moves to the new language's Bible just after the change: the words come back once its verses have arrived. */
async function bibleInLanguage(code: LanguageCode): Promise<void> {
  const start = performance.now();
  const other = `.scripture:not(:lang(${code.split("-")[0]}))`;
  do await wait(32);
  while (location.pathname.startsWith("/read/") && document.querySelector(other) && performance.now() - start < BIBLE_WAIT_MS);
}

/** At startup: resolves once the page strings are read, so the first paint is already in the chosen language. */
export async function startPageTranslator(): Promise<void> {
  const folder = languageFolder();
  markDocument(siteLanguage(), folder);
  if (!folder) return;
  await Promise.all([loadStrings(folder, null), onStudyPage() ? loadStudyStrings(folder) : undefined]);
  target = folder;
  watch();
}

/** A pointer resting on a language in the menu: its page words are read ahead, so choosing it has less to wait for. */
export function prepareSiteLanguage(code: LanguageCode): void {
  const folder = languageFolder(code);
  if (folder) void loadStrings(folder, null);
}

/** The header's language menu: reads the new words for what is on screen, then changes them all at once. */
export async function chooseSiteLanguage(code: LanguageCode): Promise<void> {
  // Restyling a long page holds the browser for a moment, so the menu shows the choice first.
  await new Promise((painted) => requestAnimationFrame(() => setTimeout(painted)));
  const previous = languageFolder();
  const folder = languageFolder(code);
  const folders = [previous, folder].filter((name): name is string => name !== null);
  const root = document.documentElement;
  const fades = typeof root.animate === "function" && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const fadedOut = fades ? fadeWordsOut(languageDirection(code) !== root.dir) : null;
  if (fades) root.dataset.languageFade = "true"; // a language change is not a move to another page: no page slide (PageTransitions)
  await Promise.all([
    fadedOut,
    ...folders.flatMap((name) => [loadStrings(name, null), onStudyPage() ? loadStudyStrings(name) : undefined, ...[...loadedData].map((path) => loadStrings(name, path))]),
  ]);
  setSiteLanguage(code);
  markDocument(code, folder);
  target = folder;
  watch();
  translateTree(document.body);
  if (!fades) return;
  await new Promise((painted) => requestAnimationFrame(() => setTimeout(painted)));
  await bibleInLanguage(code);
  void fadeWordsIn().finally(() => delete root.dataset.languageFade);
}
