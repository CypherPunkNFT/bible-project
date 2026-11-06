// Reading a language's phrase list fast enough for the first paint (translation system, stage 5 job 17;
// SiteTranslation/system/HANDOFF.md). The build splits each list by the code that shows it (scripts/phrase-lists.mjs):
// a core list every page needs, and parts named for the code files that show the rest. index.html's language script
// starts fetching the core list (and a study or people page's own list) before the site's code has even arrived; this
// file takes those fetches over. Each part loads as its code file runs, and a page's lazy file waits for its words
// (lazy-page.ts). When the browser is idle the whole list (ui.json) is read as well, so a phrase the split put in the
// wrong place is late, never lost. With no lists made for the code that is running (development, tests, a build whose
// lists were not remade), the whole list is read before the first paint, as it always was.
import { languageFolder } from "./language";
import { learnPhraseList } from "./phrase-memory";

declare global {
  interface Window {
    /** Fetches index.html's language script started: address -> its JSON, an HTTP status number, or null (no answer). */
    __bgEarly?: Record<string, Promise<unknown>>;
    /** The release's stamp of the phrase lists (12 hex letters), "" on the preview. */
    __bgStamp?: string;
    /** Every built code file pushes its own address here as it runs (scripts/phrase-lists-vite.ts). */
    __bgChunks?: string[];
  }
}

const STAMP = /^[0-9a-f]{12}$/;
const CORE_WAIT_MS = 2500; // then the whole list instead: a page is never held for a missing part
const PART_WAIT_MS = 1500; // a lazy page waits this long at most for its words; they are swapped in when they come
const IDLE_WAIT_MS = 3000;
// The whole list waits this long after the page has loaded: the browser counts as idle while it waits for a page's code,
// and the whole list fetched then would compete with that page's own small part (measured on the preview, job 17).
const WHOLE_AFTER_LOAD_MS = 1000;
const wait = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));

interface PhraseList { build: string; phrases: Record<string, unknown> }
interface CoreList extends PhraseList { groups: Record<string, string> }
const isList = (value: unknown): value is PhraseList => {
  const list = value as PhraseList | null;
  return typeof list?.build === "string" && typeof list.phrases === "object" && list.phrases !== null && !Array.isArray(list.phrases);
};
const isCore = (value: unknown): value is CoreList =>
  isList(value) && typeof (value as CoreList).groups === "object" && (value as CoreList).groups !== null && Object.values((value as CoreList).groups).every((group) => /^g\d{2,3}$/.test(group));

const stamp = (): string => (typeof window !== "undefined" && STAMP.test(window.__bgStamp ?? "") ? window.__bgStamp! : "");
const partAddress = (folder: string, name: string) => `/data/i18n/${folder}/phrases/${name}.json${stamp() ? `?v=${stamp()}` : ""}`;

/** A translation file as JSON: the fetch index.html already started for this address, or a new one. Throws on failure. */
export async function readTranslationJson(url: string, { cache = "no-cache" as RequestCache, waitMs = 0 } = {}): Promise<unknown> {
  const early = typeof window === "undefined" ? undefined : window.__bgEarly?.[url];
  if (early) {
    delete window.__bgEarly![url];
    const value = await (waitMs ? Promise.race([early, wait(waitMs).then(() => null)]) : early);
    if (typeof value === "number") throw new Error(`HTTP ${value}`);
    if (value !== null && value !== undefined) return value;
  }
  const controller = new AbortController();
  const timer = waitMs ? setTimeout(() => controller.abort(), waitMs) : undefined;
  try {
    // A release replaces ui.json under the same address, and /data/ is stored for a long time: "no-cache" asks each time
    // whether it changed. The parts carry the release's stamp in their address instead, so they may be kept.
    const response = await fetch(url, { cache, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

/** The entry code file running this page (index-<hash>.js): the lists name the build they were made for. Null in
 * development and in tests, where no lists are made. */
export function runningBuild(): string | null {
  const source = document.querySelector('script[type="module"][src*="/assets/"]')?.getAttribute("src");
  return source?.match(/\/assets\/([\w.-]+\.js)$/)?.[1] ?? null;
}

/** On this computer's preview only: never read the whole list, so a reading of the pages shows what the parts miss. */
function partsOnly(): boolean {
  try {
    return ["127.0.0.1", "localhost"].includes(location.hostname) && localStorage.getItem("bp-phrase-lists") === "parts-only";
  } catch {
    return false; // storage blocked: the normal way
  }
}

const parts = new Map<string, Record<string, string>>(); // folder -> code file -> part, once its core is learned
const whole = new Map<string, Promise<number>>(); // folder -> its whole list, read or being read
const wholeLearned = new Set<string>(); // folders whose whole list is learned: no part is needed any more
const partsRead = new Map<string, Promise<void>>(); // "folder part"
const pending = new Set<Promise<unknown>>();
let arrived: (folder: string) => void = () => {};

/** The page translator: called when more of a language's words have been learned after the first paint. */
export function onWordsArrived(handler: (folder: string) => void): void {
  arrived = handler;
}

/** The whole phrase list (ui.json), read once per language; resolves to how many of its texts were new. */
export function loadWholeList(folder: string): Promise<number> {
  const started = whole.get(folder);
  if (started) return started;
  const reading = readTranslationJson(`/data/i18n/${folder}/ui.json`)
    .then((strings) => {
      const added = learnPhraseList(folder, strings as Record<string, unknown>);
      wholeLearned.add(folder);
      return added;
    })
    .catch((error: unknown) => {
      whole.delete(folder);
      console.warn(`page translation: could not read the ${folder} strings for the page text (${String(error)}); that text keeps its current language`);
      return 0;
    });
  whole.set(folder, reading);
  return reading;
}

async function learnCore(folder: string, build: string): Promise<boolean> {
  try {
    const core = await readTranslationJson(partAddress(folder, "core"), { cache: stamp() ? "default" : "no-cache", waitMs: CORE_WAIT_MS });
    if (!isCore(core) || core.build !== build) {
      console.info(`page translation: the ${folder} core phrase list was made for other code (${isList(core) ? core.build : "not a list"}, running ${build}); reading the whole list`);
      return false;
    }
    learnPhraseList(folder, core.phrases);
    parts.set(folder, core.groups);
    return true;
  } catch (error) {
    console.warn(`page translation: could not read the ${folder} core phrase list (${String(error)}); reading the whole list`);
    return false;
  }
}

/** Before the first paint: the core list made for this code, or else the whole list. */
export async function loadFirstWords(folder: string): Promise<void> {
  const build = runningBuild();
  if (!build || !(await learnCore(folder, build))) {
    await loadWholeList(folder);
    return;
  }
  watchCode();
  if (!partsOnly()) whenSettled(() => void Promise.allSettled([...pending]).then(() => loadWholeList(folder)).then((added) => added > 0 && arrived(folder)));
}

/** Once the page has loaded, a moment has passed, and the browser is idle. */
function whenSettled(task: () => void): void {
  const idle = () => (typeof requestIdleCallback === "function" ? requestIdleCallback(task, { timeout: IDLE_WAIT_MS }) : setTimeout(task, IDLE_WAIT_MS / 2));
  const later = () => setTimeout(idle, WHOLE_AFTER_LOAD_MS);
  if (document.readyState === "complete") later();
  else window.addEventListener("load", later, { once: true });
}

function track(promise: Promise<unknown>): void {
  pending.add(promise);
  void promise.finally(() => pending.delete(promise));
}

async function readPart(folder: string, part: string): Promise<void> {
  try {
    const list = await readTranslationJson(partAddress(folder, part), { cache: stamp() ? "default" : "no-cache", waitMs: PART_WAIT_MS * 4 });
    if (!isList(list) || list.build !== runningBuild()) throw new Error(`made for other code (${isList(list) ? list.build : "not a list"})`);
    if (learnPhraseList(folder, list.phrases) > 0) arrived(folder);
  } catch (error) {
    console.warn(`page translation: the ${folder} phrase list part ${part} could not be used (${String(error)}); reading the whole list`);
    if ((await loadWholeList(folder)) > 0) arrived(folder);
  }
}

/** A built code file has run: its part of the list is read, unless the whole list is learned already. Read even while
 * the whole list is on its way: the part is small, and so arrives first. */
function codeRan(address: unknown): void {
  const folder = languageFolder();
  const file = typeof address === "string" ? /\/assets\/([\w.-]+\.js)(?:[?#].*)?$/.exec(address)?.[1] : undefined;
  const part = folder && file ? parts.get(folder)?.[file] : undefined;
  if (!folder || !part || wholeLearned.has(folder)) return;
  const key = `${folder} ${part}`;
  if (!partsRead.has(key)) partsRead.set(key, readPart(folder, part));
  track(partsRead.get(key)!);
}

let watching = false;
function watchCode(): void {
  if (watching) return;
  watching = true;
  const queue = (window.__bgChunks ??= []);
  queue.forEach(codeRan);
  queue.push = (...addresses: string[]) => {
    addresses.forEach(codeRan);
    return Array.prototype.push.apply(queue, addresses);
  };
}

/** Resolves once the words of the code that has just run are learned, or after PART_WAIT_MS: a page's lazy file waits
 * for this before drawing, so it is drawn in the language. Never rejects. */
export function wordsForLoadedCode(): Promise<void> {
  if (!pending.size) return Promise.resolve();
  return Promise.race([Promise.allSettled([...pending]).then(() => undefined), wait(PART_WAIT_MS)]);
}
