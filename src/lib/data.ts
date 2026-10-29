import type { ArcData, BookPlace, Catalog, Chapter, CrossRefBook, DataLayout, PlainBook, Place, Run, Stats } from "./types";
import type { CreedBundle, CreedDocument, CreedsIndex } from "./creeds";
import { HYMN_GROUPS, isHymnId, type HymnCollection, type HymnGroupId, type HymnSong, type HymnText } from "./hymns";
import { isMuseumSlug, type Museum, type MuseumIndex } from "./museums";
import type { ManuscriptCollection } from "./manuscripts";
import type { HymnPageData, HymnPagesIndex, HymnsByChapter } from "./hymn-pages";
import type { ChapterTopics, LibraryBook, Topic, TopicIndex } from "./topics";

/** A data file that is missing or malformed. The reader turns this into "not in this version". */
export class DataUnavailable extends Error {
  constructor(
    public readonly path: string,
    reason: string,
  ) {
    super(`data ${path}: ${reason}`);
    this.name = "DataUnavailable";
  }
}

const cache = new Map<string, Promise<unknown>>();
let stamp = "";
let layout: DataLayout | undefined;

/** Every later request carries the catalogue's build stamp, so a data rebuild is never served stale. */
export function setStamp(value: string): void {
  stamp = value;
}

/** The release groups chapters into fewer files (Cloudflare's 20,000-file limit); the catalogue says how. */
export function setLayout(value: DataLayout | undefined): void {
  if (value && !(Number.isInteger(value.textChunk) && value.textChunk > 0 && Number.isInteger(value.xrefChunk) && value.xrefChunk > 0)) {
    throw new Error(`catalog layout must give positive whole chapter counts, got ${JSON.stringify(value)}`);
  }
  layout = value;
}

const SAFE_PATH = /^[A-Za-z0-9_\-/.]+$/;

/** `revalidate`: ask the server every time (a cheap 304 when unchanged), for files rebuilt apart from the catalogue,
 * whose stamp would otherwise let a browser keep an old copy for an hour. */
async function fetchJson(path: string, check: (value: unknown) => boolean, revalidate = false): Promise<unknown> {
  if (!SAFE_PATH.test(path) || path.includes("..")) throw new DataUnavailable(path, "unsafe path");
  const url = `/data/${path}${stamp ? `?v=${stamp}` : ""}`;
  const response = await fetch(url, { cache: stamp && !revalidate ? "default" : "no-cache" });
  if (!response.ok) throw new DataUnavailable(path, `HTTP ${response.status}`);
  if (!(response.headers.get("content-type") ?? "").includes("json")) {
    throw new DataUnavailable(path, `expected JSON, got ${response.headers.get("content-type")}`);
  }
  const value: unknown = await response.json();
  if (!check(value)) throw new DataUnavailable(path, "unexpected shape");
  return value;
}

/** One request per file for the whole session; concurrent callers share the in-flight request. */
function load<T>(path: string, check: (value: unknown) => boolean, revalidate = false): Promise<T> {
  let pending = cache.get(path);
  if (!pending) {
    pending = fetchJson(path, check, revalidate);
    pending.catch(() => cache.delete(path));
    cache.set(path, pending);
  }
  return pending as Promise<T>;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const loadCatalog = () =>
  load<Catalog>("catalog.json", (v) => isObject(v) && Array.isArray(v.translations) && Array.isArray(v.books));

// The reader's pieces are one small file per chapter (data layout 2, scripts/build-data.py), so a page downloads only
// the chapter it shows.

/** Chapters are stored five to a file locally, more in the release (`layout`); `labels` is the version's chapter list for the book (from the catalogue). */
export const CHUNK = 5;

/** The file holding the chapter at `index` in its book's chapter list. */
export function textChunkPath(slug: string, code: string, index: number): string {
  return layout ? `text/${slug}/${code}/c${layout.textChunk}-${Math.floor(index / layout.textChunk)}.json` : `text/${slug}/${code}/${Math.floor(index / CHUNK)}.json`;
}

/** The file holding a chapter's cross-references. */
export function crossRefPath(code: string, chapter: string): string {
  if (!layout) return `xref/${code}/${chapter}.json`;
  const number = Number(chapter);
  if (!Number.isInteger(number) || number < 1) throw new DataUnavailable(`xref/${code}`, `chapter ${chapter} is not a chapter number`);
  return `xref/${code}/g${Math.floor((number - 1) / layout.xrefChunk)}.json`;
}

async function loadChunk(slug: string, code: string, labels: string[], chapter: string): Promise<Chapter> {
  const index = labels.indexOf(chapter);
  if (index < 0) throw new DataUnavailable(`text/${slug}/${code}`, `no chapter ${chapter}`);
  const chunk = await load<Record<string, Chapter>>(textChunkPath(slug, code, index), isObject);
  const found = chunk[chapter];
  if (!found) throw new DataUnavailable(`text/${slug}/${code}`, `chapter ${chapter} missing from its file`);
  return found;
}

export const loadChapter = loadChunk;

/** One chapter's verses as plain words ("chapter:verse" -> text), made from the chapter text: for previews. */
export async function loadChapterPlain(slug: string, code: string, labels: string[], chapter: string): Promise<PlainBook> {
  const found = await loadChunk(slug, code, labels, chapter);
  return Object.fromEntries(found.v.map((verse) => [`${found.c}:${verse.n}`, plainWords(verse.r)]));
}

/** The words of a verse's runs: text only, no notes or breaks, whitespace collapsed (same rule as scripts/bible/usfm.py). */
export function plainWords(runs: Run[]): string {
  const parts = runs.map((run) => (typeof run === "string" ? run : Array.isArray(run) ? run[0] : ""));
  return parts.join("").replace(/\s+/g, " ").trim();
}

/** A whole book's plain words: only for search, which has to read a whole version. */
export const loadPlain = (slug: string, code: string) => load<PlainBook>(`plain/${slug}/${code}.json`, isObject);

export async function loadCrossRefs(code: string, chapter: string): Promise<CrossRefBook> {
  const path = crossRefPath(code, chapter);
  if (!layout) return load<CrossRefBook>(path, isObject);
  const group = await load<Record<string, CrossRefBook>>(path, isObject);
  const found = group[chapter];
  if (!found) throw new DataUnavailable(path, `chapter ${chapter} missing from its file`);
  return found;
}

/** The places named in one book, with that book's verse ids only (the reader's "places in this chapter"). */
export const loadBookPlaces = (code: string) => load<BookPlace[]>(`places-by-book/${code}.json`, Array.isArray);

export const loadStats = () => load<Stats>("stats.json", (v) => isObject(v) && Array.isArray(v.books));

/** One chapter's AI-written summary (scripts/build-chapter-summaries.py); outline parts are [from verse, to verse, heading, text]. */
export interface ChapterSummary {
  title: string;
  summary: string;
  invitation?: string;
  outline: [number, number, string, string][];
}

/** A book's chapter summaries, keyed by chapter number, with the notice that they are AI-written and still being checked. */
export const loadChapterSummaries = (code: string) => {
  if (!/^[A-Z0-9]{3}$/.test(code)) throw new DataUnavailable(`summaries/${code}.json`, "not a book code");
  return load<{ notice: string; chapters: Record<string, ChapterSummary> }>(`summaries/${code}.json`, (v) => isObject(v) && isObject(v.chapters));
};

// Catechisms & Creeds (scripts/build-creeds.py): the landing index, one file per document, and the
// document's sections in bundles of whole parts, so opening a part never downloads a whole book.
export const loadCreedsIndex = () => load<CreedsIndex>("creeds/index.json", (v) => isObject(v) && Array.isArray(v.families));

export const loadCreedDocument = (id: string) =>
  load<CreedDocument>(`creeds/doc/${id}.json`, (v) => isObject(v) && Array.isArray(v.parts) && Array.isArray(v.bundles));

export const loadCreedBundle = (id: string, bundle: string) =>
  load<CreedBundle>(`creeds/doc/${id}.${bundle}.json`, (v) => isObject(v) && Array.isArray(v.sections));

// The Question Bank (scripts/build-question-bank.py): every production-ready question with its answer, and the
// collections they come from with the credit each one asks for.
export interface BankQuestion {
  question: string;
  answer: string;
  options: string[] | null;
  reference: string | null;
  kind: string;
  tradition: string | null;
  collection: string;
  lesson: string | null;
  /** Book codes from the reference, then any book named outright; set by fixed rules (scripts/question_tags.py). */
  books: string[];
  testament: "OT" | "NT" | null;
  topic: string | null;
  /** The first reference, as the reader opens it. */
  link: { book: string; chapter: number; verse: number | null } | null;
  standalone: boolean;
  /** People and places the question names (scripts/question_tags.py); not in every copy of the bank. */
  people?: string[];
  places?: string[];
  /** The option that is right: the printed answer, or a short version of a long one (scripts/question_choices.py). */
  answer_choice?: string | null;
  /** Where the options come from: "source", "claude-haiku" or "true/false". */
  options_by?: string | null;
  /** A two-part question's first part: the question just before it in its book, with its printed answer. */
  lead_in?: { question: string; answer: string } | null;
  /** How hard for teens and adults, and whether it suits children of about 6 to 11 (scripts/question_difficulty.py). */
  level?: "easy" | "medium" | "hard" | null;
  children?: boolean | null;
  /** The children's page's wording, for a child of about 6 to 11 (scripts/question_children_wording.py). */
  child?: { question: string; answer: string; options: string[] } | null;
}
/** The option to mark right; falls back to the printed answer for a copy of the bank built before answer_choice. */
export const rightChoice = (q: BankQuestion) => q.answer_choice ?? q.answer;
export interface BankCollection { title: string; kind: string; tradition: string | null; credit: string | null; source_url: string | null; count: number }
export interface BankTopic { id: string; title: string; group: "story" | "teaching" }
export interface BankBook { code: string; name: string; short: string; section: string; testament: "OT" | "NT" }
export interface QuestionBank { kinds: Record<string, string>; topics: BankTopic[]; books: BankBook[]; collections: BankCollection[]; questions: BankQuestion[] }
export const loadQuestionBank = () =>
  load<QuestionBank>("questions/bank.json", (v) => isObject(v) && Array.isArray(v.questions) && Array.isArray(v.collections) && Array.isArray(v.topics) && Array.isArray(v.books), true);

// Hymns (scripts/build-hymn-collection.py): the collection, the full study of a hymn that has one, and the words of every hymn
// filed by hymn book.
export const loadHymnCollection = () =>
  load<HymnCollection>("hymns/collection.json", (v) => isObject(v) && Array.isArray(v.hymns) && Array.isArray(v.books));
export const loadHymnSong = (id: string) => {
  if (!isHymnId(id)) throw new DataUnavailable(`hymns/songs/${id}.json`, "not a hymn address");
  return load<HymnSong>(`hymns/songs/${id}.json`, (v) => isObject(v) && Array.isArray(v.stanzas) && Array.isArray(v.echoes));
};
export const loadHymnTexts = (group: HymnGroupId) => {
  if (!HYMN_GROUPS.includes(group)) throw new DataUnavailable(`hymns/texts/${group}.json`, "not a hymn book");
  return load<Record<string, HymnText>>(`hymns/texts/${group}.json`, isObject);
};

// Hymn pages (scripts/build-hymn-pages.py): which bundle holds a hymn, the bundle itself, and one book's hymns by chapter.
export const loadHymnPagesIndex = () =>
  load<HymnPagesIndex>("hymns/pages/index.json", (v) => isObject(v) && isObject(v.bundles));
export const loadHymnPageBundle = (n: number) => {
  if (!Number.isInteger(n) || n < 0) throw new DataUnavailable(`hymns/pages/${n}.json`, "not a bundle number");
  return load<Record<string, HymnPageData>>(`hymns/pages/${n}.json`, isObject);
};
export const loadHymnsByChapter = (code: string) => {
  if (!/^[A-Z0-9]{3}$/.test(code)) throw new DataUnavailable(`hymns/by-book/${code}.json`, "not a book code");
  return load<HymnsByChapter>(`hymns/by-book/${code}.json`, isObject);
};

// Manuscripts (scripts/build-manuscripts.py): every record, holder and picture credit the page shows, in one file.
export const loadManuscripts = () =>
  load<ManuscriptCollection>("manuscripts/collection.json", (v) => isObject(v) && Array.isArray(v.records) && Array.isArray(v.books) && isObject(v.map));

// Museum-Grade Archaeology (scripts/build-museums.py): the museum cards, and one file per museum.
export const loadMuseumIndex = () =>
  load<MuseumIndex>("museums/index.json", (v) => isObject(v) && Array.isArray(v.cards));

/** One museum. `slug` must be checked against the index first; this only guards the path itself. */
export const loadMuseum = (slug: string) => {
  if (!isMuseumSlug(slug)) throw new DataUnavailable(`museums/${slug}.json`, "not a museum address");
  return load<Museum>(`museums/${slug}.json`, (v) => isObject(v) && Array.isArray(v.objects));
};

export const loadArcs = () => load<ArcData>("xref-arcs.json", (v) => isObject(v) && Array.isArray(v.arcs));

export const loadBookPairs = () => load<[string, string, number][]>("xref-books.json", Array.isArray);

/** One book's cross-references by the book they land in, most-voted first: [from chapter*1000+verse, to chapter*1000+verse,
 *  to-end verse id or 0, votes] (scripts/build-data.py write_book_links). Connections in Scripture opens a pair with it. */
export const loadBookLinks = (code: string) => load<Record<string, [number, number, number, number][]>>(`xref-links/${code}.json`, isObject);

export const loadPlaces = () => load<Place[]>("places.json", Array.isArray);

/** Topics: Torrey's New Topical Textbook in a two-level taxonomy (scripts/build-topics.py). */
export const loadTopicIndex = () => load<TopicIndex>("topics/index.json", (v) => isObject(v) && Array.isArray(v.categories) && isObject(v.topics));
/** A topic from its bundle file (the index gives the bundle number). */
export async function loadTopic(id: string, bundle: number): Promise<Topic> {
  const topics = await load<Record<string, Topic>>(`topics/t/${bundle}.json`, isObject);
  const topic = topics[id];
  if (!topic || !Array.isArray(topic.points)) throw new Error(`Topic "${id}" is not in bundle ${bundle}.`);
  return topic;
}
/** Library books matched to each topic of a bundle; absent until the linker has run. */
export const loadTopicLibrary = (bundle: number) => load<Record<string, LibraryBook[]>>(`topics/library/${bundle}.json`, isObject);
/** One book's topics by chapter, with the titles a chapter shows (scripts/build-chapter-topics.py). */
export const loadChapterTopics = (code: string) =>
  load<ChapterTopics>(`topics/chapters/${code}.json`, (v) => isObject(v) && isObject(v.chapters) && isObject(v.names));
