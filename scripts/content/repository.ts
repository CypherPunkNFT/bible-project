import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Ajv } from "ajv";
import { citationsIn, documentKey, FOLDERS, walk, type ContentDocument, type DocumentKind, type Issue, type LoadedDocument, type Review, type ScriptureIndex } from "./model.ts";
import { parseReference } from "./scripture.ts";

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b, "en")).map(([key, item]) => [key, stable(item)]));
  return value;
}
export const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
export const contentHash = (doc: ContentDocument) => hash({ kind: doc.kind, id: doc.id, content: doc.content });
export function sourceIds(doc: ContentDocument): string[] {
  const ids = citationsIn(doc.content).flatMap((c) => c.kind === "source" ? [c.source] : []);
  if (doc.kind === "worldview") ids.push(...doc.content.sources);
  if (doc.kind === "debate") ids.push(doc.content.source);
  return [...new Set(ids)].sort();
}
export function basisHash(doc: ContentDocument, documents: ContentDocument[]): string {
  const policy = documents.find((d): d is ContentDocument<"editorial"> => d.kind === "editorial" && d.id === "library");
  return hash({ policy: doc.kind === "editorial" ? null : policy?.content.policy,
    sources: sourceIds(doc).map((id) => { const source = documents.find((d) => d.kind === "source" && d.id === id); return [id, source ? contentHash(source) : "missing"]; }),
  });
}
export function reviewState(doc: ContentDocument, documents: ContentDocument[]): "current" | "stale" | "unreviewed" {
  const last = doc.reviews.at(-1);
  return !last ? "unreviewed" : last.contentHash === contentHash(doc) && last.basisHash === basisHash(doc, documents) ? "current" : "stale";
}

export function dependencies(doc: ContentDocument): string[] {
  const result = sourceIds(doc).map((id) => "source/" + id);
  const c = doc.content;
  if (doc.kind === "study") { result.push("topic/" + doc.content.topic, ...doc.content.related.map((id) => "study/" + id)); }
  if ("studies" in c) result.push(...c.studies.map((id) => "study/" + id));
  if (doc.kind === "worldview") result.push(...doc.content.rows.map((row) => "study/" + row.study));
  if (doc.kind === "practice") result.push("study/" + doc.content.study);
  if (doc.kind === "editorial") result.push(...doc.content.foundations.map((id) => "study/" + id));
  else result.push("editorial/library");
  return [...new Set(result)].sort();
}

export function loadRepository(root: string): { entries: LoadedDocument[]; index: ScriptureIndex; issues: Issue[] } {
  const directory = path.join(root, "content/apologetics"), entries: LoadedDocument[] = [], issues: Issue[] = [];
  const schema = JSON.parse(readFileSync(path.join(directory, "schema.json"), "utf8"));
  const ajv = new Ajv({ allErrors: true, strict: true });
  const index = JSON.parse(readFileSync(path.join(directory, "scripture-index.json"), "utf8")) as ScriptureIndex;
  if (index.schemaVersion !== 1 || index.translation !== "kjv" || !Array.isArray(index.books) || index.books.length !== 66 ||
      new Set(index.books.map((b) => b.name)).size !== 66 || new Set(index.books.map((b) => b.code)).size !== 66 ||
      index.books.some((b, i) => b.num !== i + 1 || typeof b.name !== "string" || !b.name.trim() || !/^[A-Z0-9]{3}$/.test(b.code) || !Array.isArray(b.chapters) || !b.chapters.length || b.chapters.some((n) => !Number.isSafeInteger(n) || n < 1 || n > 999))) throw new Error("Invalid Scripture index: expected the 66 ordered KJV books and positive chapter verse counts.");
  for (const [kind, folder] of Object.entries(FOLDERS)) {
    const branch = schema.oneOf.find((entry: { properties: { kind: { const: string } } }) => entry.properties.kind.const === kind);
    if (!branch) throw new Error(`Missing schema for ${kind}`);
    const validate = ajv.compile({ ...branch, $defs: schema.$defs });
    const dir = path.join(directory, folder);
    if (!existsSync(dir)) continue;
    if (lstatSync(dir).isSymbolicLink()) throw new Error(`Document directories cannot be symlinks: ${dir}`);
    for (const name of readdirSync(dir).sort()) {
      const file = path.join(dir, name), relative = path.relative(root, file).split(path.sep).join("/");
      if (lstatSync(file).isSymbolicLink() || !lstatSync(file).isFile() || !name.endsWith(".json")) {
        issues.push({ severity: "error", file: relative, pointer: "", message: "Document folders contain only ordinary .json files." }); continue;
      }
      let value: unknown;
      try { value = JSON.parse(readFileSync(file, "utf8")); }
      catch (error) { issues.push({ severity: "error", file: relative, pointer: "", message: `Invalid JSON: ${String(error)}` }); continue; }
      if (!validate(value)) {
        for (const error of validate.errors ?? []) issues.push({ severity: "error", file: relative, pointer: error.instancePath, message: `${error.message}${error.keyword === "additionalProperties" ? `: ${error.params.additionalProperty}` : ""}` });
        continue;
      }
      const document = value as ContentDocument;
      if (document.kind !== kind || name !== document.id + ".json") issues.push({ severity: "error", file: relative, pointer: "/id", message: "File name, folder, kind and document ID must agree." });
      entries.push({ file: relative, document });
    }
  }
  entries.sort((a, b) => a.document.order - b.document.order || documentKey(a.document).localeCompare(documentKey(b.document), "en"));
  return { entries, index, issues };
}

export function validateDocuments(entries: LoadedDocument[], index: ScriptureIndex, options: { allowStaleReviews?: boolean } = {}): Issue[] {
  const issues: Issue[] = [], documents = entries.map((entry) => entry.document), keys = new Set<string>();
  const byKey = new Map(documents.map((doc) => [documentKey(doc), doc]));
  for (const { file, document: doc } of entries) {
    const published = doc.publication === "published";
    const add = (pointer: string, message: string, severity: "error" | "warning" = "error") => issues.push({ file, pointer, message, severity });
    const key = documentKey(doc);
    if (keys.has(key)) add("/id", `Duplicate document key ${key}`);
    keys.add(key);
    const blockIds = new Set<string>();
    walk(doc.content, (entry, pointer) => {
      if (typeof entry.id === "string") {
        if (blockIds.has(entry.id)) add("/content" + pointer + "/id", `Duplicate block ID ${entry.id}`);
        blockIds.add(entry.id);
      }
      for (const [field, value] of Object.entries(entry)) if (typeof value === "string" && !value.trim()) add(`/content${pointer}/${field}`, "Text cannot be blank in published content.", published ? "error" : "warning");
      for (const [field, value] of Object.entries(entry)) if (Array.isArray(value)) value.forEach((item, i) => {
        if (typeof item === "string" && !item.trim()) add(`/content${pointer}/${field}/${i}`, "List text cannot be blank.", published ? "error" : "warning");
      });
      if (Array.isArray(entry.citations) && !entry.citations.length) add("/content" + pointer + "/citations", "A substantive block needs at least one citation.", published ? "error" : "warning");
      if (entry.kind === "scripture" || (typeof entry.reference === "string" && entry.kind !== "source")) {
        try { parseReference(String(entry.reference), index); } catch (error) { add("/content" + pointer + "/reference", (error as Error).message); }
      }
      if (entry.kind === "source" && typeof entry.locator === "string" && !entry.locator.trim()) add("/content" + pointer + "/locator", "Specify the section or passage supporting this claim.");
    });
    for (const dependency of dependencies(doc)) {
      const target = byKey.get(dependency);
      if (!target) add("/content", `Missing referenced document: ${dependency}`);
      else if (published && target.publication !== "published") add("/content", `Published content cannot link to draft ${dependency}`);
    }
    if (doc.kind === "study") {
      if (!doc.content.passages.length) add("/content/passages", "A study needs a Scripture passage.", published ? "error" : "warning");
      if (doc.content.related.includes(doc.id)) add("/content/related", "A study cannot recommend itself.");
      if (!sourceIds(doc).some((id) => { const s = byKey.get("source/" + id); return s?.kind === "source" && s.content.role.startsWith("Reformed"); })) add("/content", "A published study needs a Reformed teaching source as well as Scripture.", published ? "error" : "warning");
      if (!citationsIn(doc.content).some((c) => c.kind === "scripture")) add("/content", "A study needs Scripture in its claim-level support.", published ? "error" : "warning");
    }
    if (doc.kind === "practice" && doc.content.best >= doc.content.options.length) add("/content/best", "The preferred response must exist in options.");
    if (doc.kind === "source") {
      try { const url = new URL(doc.content.url); if (url.protocol !== "https:" || url.username || url.password) throw new Error();
        if (published && ["example.org", "example.com", "localhost"].includes(url.hostname)) add("/content/url", "Replace the placeholder URL before publication.");
      }
      catch { add("/content/url", "Source links must use HTTPS without embedded credentials."); }
    }
    if (doc.kind === "editorial") {
      if (doc.id !== "library") add("/id", "The editorial document has the stable ID library.");
      try { parseReference(doc.content.anchor, index); } catch (error) { add("/content/anchor", (error as Error).message); }
    }
    for (const [i, review] of doc.reviews.entries()) {
      const date = new Date(review.date + "T00:00:00Z");
      if (!Number.isFinite(date.valueOf()) || date.toISOString().slice(0, 10) !== review.date || review.date > new Date().toISOString().slice(0, 10)) add(`/reviews/${i}/date`, "Review dates must be real dates, not future dates.");
      if (i && review.date < doc.reviews[i - 1].date) add(`/reviews/${i}/date`, "Review history must be chronological.");
    }
    const state = reviewState(doc, documents);
    if (state !== "current") add("/reviews", `${state === "stale" ? "Content or its cited source/policy basis changed after review" : "No review recorded"}. Review the document and explicitly record a new review.`, published && !options.allowStaleReviews ? "error" : "warning");
  }
  if (!documents.some((doc) => doc.kind === "editorial" && doc.id === "library" && doc.publication === "published")) issues.push({ severity: "error", file: "content/apologetics/editorial/library.json", pointer: "", message: "A published editorial/library document is required." });
  return issues;
}

export function inspectRepository(root: string, options: { allowStaleReviews?: boolean } = {}) {
  const repository = loadRepository(root);
  repository.issues.push(...validateDocuments(repository.entries, repository.index, options));
  return repository;
}
export function assertValid(issues: Issue[]) {
  const errors = issues.filter((issue) => issue.severity === "error");
  if (errors.length) throw new Error(errors.map((issue) => `${issue.file}${issue.pointer}: ${issue.message}`).join("\n"));
}

/** An explicit attribution record, not an automated claim that the theology has been verified. */
export function recordReview(root: string, key: string, details: Pick<Review, "reviewer" | "kind" | "scope" | "note">): Review {
  const repository = inspectRepository(root, { allowStaleReviews: true });
  assertValid(repository.issues);
  const entry = repository.entries.find((item) => documentKey(item.document) === key);
  if (!entry) throw new Error(`Unknown document: ${key}`);
  for (const value of Object.values(details)) if (!value.trim()) throw new Error("Reviewer, kind, scope and note must be supplied.");
  if (!["ai-assisted", "human"].includes(details.kind)) throw new Error("Review kind must be ai-assisted or human.");
  const review = { ...details, date: new Date().toISOString().slice(0, 10), contentHash: contentHash(entry.document), basisHash: basisHash(entry.document, repository.entries.map((e) => e.document)) };
  entry.document.reviews.push(review);
  writeFileSync(path.join(root, entry.file), JSON.stringify(entry.document, null, 2) + "\n");
  return review;
}

export function impact(documents: ContentDocument[], key: string): { direct: string[]; transitive: string[] } {
  if (!documents.some((doc) => documentKey(doc) === key)) throw new Error(`Unknown document: ${key}`);
  const direct = documents.filter((doc) => dependencies(doc).includes(key)).map(documentKey).sort();
  const seen = new Set([key, ...direct]), queue = [...direct];
  for (let i = 0; i < queue.length; i++) for (const doc of documents) {
    const candidate = documentKey(doc);
    if (!seen.has(candidate) && dependencies(doc).includes(queue[i])) { seen.add(candidate); queue.push(candidate); }
  }
  return { direct, transitive: queue.filter((item) => !direct.includes(item)).sort() };
}

export function selectDocuments(documents: ContentDocument[], selection: { document?: string; topic?: string; source?: string; kind?: DocumentKind; published?: boolean }): ContentDocument[] {
  if (selection.document && !documents.some((doc) => documentKey(doc) === selection.document)) throw new Error(`Unknown document: ${selection.document}`);
  if (selection.topic && !documents.some((doc) => doc.kind === "topic" && doc.id === selection.topic)) throw new Error(`Unknown topic: ${selection.topic}`);
  if (selection.source && !documents.some((doc) => doc.kind === "source" && doc.id === selection.source)) throw new Error(`Unknown source: ${selection.source}`);
  return documents.filter((doc) => (!selection.document || documentKey(doc) === selection.document) && (!selection.topic || (doc.kind === "study" && doc.content.topic === selection.topic)) && (!selection.source || sourceIds(doc).includes(selection.source)) && (!selection.kind || doc.kind === selection.kind) && (!selection.published || doc.publication === "published"));
}
