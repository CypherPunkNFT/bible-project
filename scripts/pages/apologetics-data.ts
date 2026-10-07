// Shared loading and formatting for the Apologetics CONTENT.md files (see apologetics.ts).
// Reads the same authoring documents the site compiles: content/apologetics/** through the content
// pipeline's own loader, and the historic reading library through its own publication selector.
import { readFileSync } from "node:fs";
import path from "node:path";
import { loadRepository, reviewState } from "../content/repository.ts";
import { prepareReadingLibrary } from "../content/reading-library.ts";
import type { Block, Citation, ContentDocument, DocumentKind } from "../content/model.ts";
import type { ReadingLibrary } from "../../src/data/reading-library-types.ts";

export const SITE = "https://bibleproject.io";
export const BASE = SITE + "/apologetics";

export type Doc<K extends DocumentKind> = ContentDocument<K>;

export interface ApologeticsData {
  documents: ContentDocument[];
  studies: Doc<"study">[];
  sources: Doc<"source">[];
  topics: Doc<"topic">[];
  paths: Doc<"path">[];
  worldviews: Doc<"worldview">[];
  debates: Doc<"debate">[];
  practice: Doc<"practice">[];
  editorial: Doc<"editorial">;
  library: ReadingLibrary;
  /** Publication state of the reading library: whether its last recorded review matches its current fingerprint. */
  libraryReview: string;
}

// Same narrowing as scripts/content/compile.ts: the kind field decides the content shape.
const ofKind = <K extends DocumentKind>(documents: ContentDocument[], kind: K) =>
  documents.filter((doc) => doc.kind === kind) as Doc<K>[];

/** Loads every apologetics document (drafts included, so their state can be reported) and the reading library. */
export function loadApologetics(): ApologeticsData {
  const root = path.resolve(import.meta.dirname, "../..");
  const repository = loadRepository(root);
  const errors = repository.issues.filter((issue) => issue.severity === "error");
  if (errors.length) {
    throw new Error(`content/apologetics has ${errors.length} invalid document(s); first: ${errors[0].file} ${errors[0].pointer}: ${errors[0].message}`);
  }
  const documents = repository.entries.map((entry) => entry.document);
  const editorial = ofKind(documents, "editorial").find((doc) => doc.id === "library");
  if (!editorial) throw new Error("content/apologetics/editorial/library.json is missing; expected the editorial document with ID library.");
  // allowStaleReview = true: describe the library as it stands even if its publication review is out of date.
  const { library } = prepareReadingLibrary(root, documents, true);
  return {
    documents, editorial, library,
    studies: ofKind(documents, "study"), sources: ofKind(documents, "source"), topics: ofKind(documents, "topic"),
    paths: ofKind(documents, "path"), worldviews: ofKind(documents, "worldview"), debates: ofKind(documents, "debate"),
    practice: ofKind(documents, "practice"),
    libraryReview: readingReview(root, library.hash),
  };
}

interface ReadingReview { date: string; kind: string; contentHash?: string }

function readingReview(root: string, hash: string): string {
  const file = path.join(root, "content/library/publication.json");
  const manifest = JSON.parse(readFileSync(file, "utf8")) as { reviews?: ReadingReview[] };
  const last = manifest.reviews?.at(-1);
  if (!last) return "no publication review recorded";
  return `publication review ${last.contentHash === hash ? "current" : "stale"} (last: ${last.kind}, ${last.date})`;
}

/** Finds one document or fails with the missing key, so a broken link is never silently dropped. */
export function find<K extends DocumentKind>(list: Doc<K>[], id: string, kind: K): Doc<K> {
  const doc = list.find((entry) => entry.id === id);
  if (!doc) throw new Error(`Missing ${kind}/${id}: referenced by another apologetics document but not found.`);
  return doc;
}

/** "Published · review current (ai-assisted, 2026-10-05)" */
export function stateLine(doc: ContentDocument, data: ApologeticsData): string {
  const last = doc.reviews.at(-1), state = reviewState(doc, data.documents);
  const review = last ? `review ${state} (last: ${last.kind}, ${last.date})` : "no review recorded";
  return `${doc.publication === "published" ? "Published" : "Draft (not on the site)"} · ${review}`;
}

export const studyLink = (study: Doc<"study">) => `[${study.content.title}](${BASE}/study/${study.id})`;

function citation(cite: Citation, data: ApologeticsData): string {
  if (cite.kind === "scripture") return cite.reference;
  const source = find(data.sources, cite.source, "source").content;
  // Qur'an citations repeat the verse in the title and the locator; show it once.
  const locator = source.title.includes(cite.locator) ? "" : `, ${cite.locator}`;
  return `${source.author.split(" · ")[0]}, *${source.title}*${locator}`;
}

export const citations = (list: Citation[], data: ApologeticsData, label = "Basis") =>
  list.length ? `  \n  *${label}:* ${list.map((cite) => citation(cite, data)).join("; ")}` : "";

/** A paragraph followed by its citation line. */
export const cited = (block: Block, data: ApologeticsData, label?: string) => block.text + citations(block.citations, data, label);

export const sourceLine = (source: Doc<"source">) =>
  `[${source.content.title}](${source.content.url}) · ${source.content.author} · ${source.content.kind} · role: ${source.content.role}`;

export const lines = (...parts: (string | false | undefined)[]) => parts.filter((part): part is string => typeof part === "string").join("\n");
