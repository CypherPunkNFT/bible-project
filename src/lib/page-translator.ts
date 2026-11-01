// Changes the words on screen to the chosen language in place, with no reload and no re-render.
// Two sources of words: the page code's own text (headings, buttons, labels) from data/i18n/<folder>/ui.json,
// {English: translation}, written by content/translation/apply.py from the "page" chunks; and, when the language
// changes, each content file already read, fetched in English and in the old and new languages and paired string by
// string. Every text is traced back to its English and then out to the chosen language, so it works in any direction.
// A text matches when it is one of the known strings, or one with other numbers, or known pieces joined by " · ". React keeps whatever it rendered; when it writes a
// text or label again, the observer swaps it again. Files read after the change come in the new language (data.ts).
// Anything inside translate="no" is left alone.
import { languageFolder, loadedData, setSiteLanguage, siteLanguage, type LanguageCode } from "./language";

const ATTRIBUTES = ["aria-label", "title", "placeholder", "alt"];
const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE", "PRE"]);

const toEnglish = new Map<string, string>();
const fromEnglish = new Map<string, Map<string, string>>(); // folder -> English -> translation
const loaded = new Set<string>(); // "folder ui" and "folder path" already read
let target: string | null = null;
let observer: MutationObserver | null = null;

const normal = (text: string) => text.replace(/\s+/g, " ").trim();

function learn(folder: string, english: string, translated: string): void {
  const [en, tr] = [normal(english), normal(translated)];
  if (!en || en === tr) return;
  toEnglish.set(tr, en);
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
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function loadStrings(folder: string, path: string | null): Promise<void> {
  const key = `${folder} ${path ?? "ui"}`;
  if (loaded.has(key)) return;
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
    loaded.add(key);
  } catch (error) {
    console.warn(`page translation: could not read the ${folder} strings for ${path ?? "the page text"} (${String(error)}); that text keeps its current language`);
  }
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
  const template = numbers && lookup(key.replace(NUMBER, "{n}"));
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

const leftAlone = (element: Element | null) =>
  !element || SKIP.has(element.tagName) || element.closest("[translate='no']:not(html)") !== null;

// A Bible's own words are never page text: the reader sets some of them a word to a node, so "of" would become "de".
// Anything marked with its own language is such a text already in the language it means to be.
const isScripture = (element: Element | null) => element?.closest(".scripture, [lang]:not(html)") != null;

function translateText(node: Text): void {
  const raw = node.nodeValue ?? "";
  const value = translated(raw);
  if (value && !leftAlone(node.parentElement) && !isScripture(node.parentElement)) node.nodeValue = raw.match(/^\s*/)![0] + value + raw.match(/\s*$/)![0];
}

function translateAttribute(element: Element, name: string): void {
  const value = translated(element.getAttribute(name) ?? "");
  if (value && !leftAlone(element)) element.setAttribute(name, value);
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
    for (const record of records) {
      if (record.type === "characterData") translateText(record.target as Text);
      else if (record.type === "attributes") translateAttribute(record.target as Element, record.attributeName!);
      else record.addedNodes.forEach(translateTree);
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRIBUTES });
}

function markDocument(code: LanguageCode, folder: string | null): void {
  const root = document.documentElement;
  root.lang = code;
  // The reader chose this language here, so the browser's own "translate this page?" bar would only undo it.
  if (folder) root.setAttribute("translate", "no");
  else root.removeAttribute("translate");
  document.querySelector("meta[name='google'][content='notranslate']")?.remove();
  if (folder) document.head.append(Object.assign(document.createElement("meta"), { name: "google", content: "notranslate" }));
}

/** At startup: resolves once the page strings are read, so the first paint is already in the chosen language. */
export async function startPageTranslator(): Promise<void> {
  const folder = languageFolder();
  markDocument(siteLanguage(), folder);
  if (!folder) return;
  await loadStrings(folder, null);
  target = folder;
  watch();
}

/** The header's language menu: reads the new words for what is on screen, then changes them all at once. */
export async function chooseSiteLanguage(code: LanguageCode): Promise<void> {
  const previous = languageFolder();
  const folder = languageFolder(code);
  const folders = [previous, folder].filter((name): name is string => name !== null);
  await Promise.all(folders.flatMap((name) => [loadStrings(name, null), ...[...loadedData].map((path) => loadStrings(name, path))]));
  setSiteLanguage(code);
  markDocument(code, folder);
  target = folder;
  watch();
  translateTree(document.body);
}
