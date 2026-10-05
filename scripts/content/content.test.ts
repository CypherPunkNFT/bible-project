import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { buildContent, compileDocuments, GENERATED_FILE, PROJECT_ROOT, verifyBuiltContent } from "./compile.ts";
import { assertValid, basisHash, contentHash, impact, inspectRepository, loadRepository, recordReview, reviewState, selectDocuments, validateDocuments } from "./repository.ts";
import { exportRecord, renderDocument } from "./export.ts";
import { parseReference, formatReference, scriptureText } from "./scripture.ts";
import type { ContentDocument } from "./model.ts";
import { assertOrdinaryPath } from "./files.ts";

const baseline = loadRepository(PROJECT_ROOT);
const documents = baseline.entries.map((e) => e.document);
function fresh() { return structuredClone(baseline.entries); }
function study(entries = baseline.entries) { return entries.find((e) => e.document.kind === "study" && e.document.id === "morality")!.document as ContentDocument<"study">; }
function issues(entries: typeof baseline.entries) { return validateDocuments(entries, baseline.index); }
function fixture(t: TestContext, withScripts = false) {
  const parent = path.join(PROJECT_ROOT, ".local"); mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(path.join(parent, "content-test-"));
  cpSync(path.join(PROJECT_ROOT, "content/apologetics"), path.join(root, "content/apologetics"), { recursive: true });
  if (withScripts) {
    cpSync(path.join(PROJECT_ROOT, "scripts/content"), path.join(root, "scripts/content"), { recursive: true });
    cpSync(path.join(PROJECT_ROOT, "scripts/content.ts"), path.join(root, "scripts/content.ts"));
    writeFileSync(path.join(root, "package.json"), '{"type":"module"}\n');
  }
  t.after(() => { assert.ok(path.resolve(root).startsWith(path.resolve(parent) + path.sep + "content-test-")); rmSync(root, { recursive: true, force: true }); });
  return root;
}
function changeFile(root: string, relative: string, update: (value: ContentDocument) => void) {
  const file = path.join(root, "content/apologetics", relative), value = JSON.parse(readFileSync(file, "utf8"));
  update(value); writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}
function cli(root: string, ...args: string[]) {
  return spawnSync(process.execPath, ["--experimental-strip-types", path.join(root, "scripts/content.ts"), ...args], { cwd: root, encoding: "utf8", timeout: 30_000 });
}

test("the complete published collection validates and keeps its existing stable destinations", () => {
  assert.deepEqual(inspectRepository(PROJECT_ROOT).issues, []);
  assert.equal(new Set(documents.map((d) => d.kind)).size, 8);
  const runtime = compileDocuments(documents, baseline.index);
  assert.equal(runtime.STUDIES.length, documents.filter((d) => d.kind === "study" && d.publication === "published").length);
  assert.equal(runtime.SOURCES.length, documents.filter((d) => d.kind === "source" && d.publication === "published").length);
  assert.match(runtime.STUDIES.find((s) => s.id === "morality")!.answer, /do not earn salvation/);
  assert.deepEqual(runtime.APOLOGETICS_ANCHOR, parseReference("1 Peter 3:15-16", baseline.index));
  assert.ok(documents.every((d) => reviewState(d, documents) === "current"));
});

test("readable Scripture references validate both endpoints, cross chapters and numbering", () => {
  for (const ref of ["Romans 3:10-12", "Isaiah 52:13-53:12", "1 John 1:9", "Psalms 119:176"]) {
    assert.equal(formatReference(parseReference(ref, baseline.index), baseline.index), ref);
  }
  assert.deepEqual(parseReference("ROM 3:10–12", baseline.index), [45003010, 45003012]);
  assert.deepEqual(parseReference("Psalm 119:176", baseline.index), parseReference("Psalms 119:176", baseline.index));
  for (const ref of ["Romans 3:40", "Romans 17:1", "Romans 0:1", "Romans 3:0", "Romans 3:12-10", "Isaiah 53:12-52:13", "John 99:1", "Hezekiah 1:1", "Romans 3", "Romans 3:10-junk"]) assert.throws(() => parseReference(ref, baseline.index), { name: "Error" }, ref);
});

test("schema catches misspelled fields, unsupported versions, malformed JSON and wrong file IDs", (t) => {
  const root = fixture(t), relative = "studies/morality.json", file = path.join(root, "content/apologetics", relative), original = readFileSync(file, "utf8");
  for (const mutate of [(d: Record<string, unknown>) => { d.schemaVersion = 2; }, (d: Record<string, unknown>) => { d.conetnt = {}; }, (d: Record<string, unknown>) => { d.id = "different"; }]) {
    writeFileSync(file, original); const value = JSON.parse(original); mutate(value); writeFileSync(file, JSON.stringify(value));
    assert.ok(loadRepository(root).issues.some((i) => i.severity === "error"));
  }
  writeFileSync(file, "{broken"); assert.match(loadRepository(root).issues[0].message, /Invalid JSON/);
  writeFileSync(file, original);
  const indexFile = path.join(root, "content/apologetics/scripture-index.json"), index = structuredClone(baseline.index);
  index.books[0].chapters[0] = -1; writeFileSync(indexFile, JSON.stringify(index));
  assert.throws(() => loadRepository(root), /Invalid Scripture index/);
});

test("missing citations, sources, passages, duplicate blocks and dangling relationships fail publication", () => {
  const mutations: [(d: ContentDocument<"study">) => void, RegExp][] = [
    [(d) => { d.content.answer.citations = []; }, /needs at least one citation/],
    [(d) => { d.content.answer.citations = [{ kind: "source", source: "missing", locator: "1" }]; }, /Missing referenced document: source\/missing/],
    [(d) => { d.content.answer.citations = [{ kind: "scripture", reference: "Romans 3:99" }]; }, /Verse does not exist/],
    [(d) => { d.content.related = ["missing"]; }, /Missing referenced document: study\/missing/],
    [(d) => { d.content.passages = []; }, /needs a Scripture passage/],
    [(d) => { d.content.reasoning[0].id = "answer"; }, /Duplicate block ID/],
    [(d) => { d.content.answer.text = " "; }, /Text cannot be blank/],
  ];
  for (const [mutate, message] of mutations) { const entries = fresh(); mutate(study(entries)); assert.ok(issues(entries).some((i) => message.test(i.message)), String(message)); }
});

test("source scope, references to drafts and review dates are checked", () => {
  const entries = fresh(), source = entries.find((e) => e.document.kind === "source" && e.document.id === "wcf")!.document as ContentDocument<"source">;
  source.publication = "draft"; source.content.url = "http://example.org/";
  const target = study(entries); target.reviews[0].date = "2026-02-30";
  const result = issues(entries);
  assert.ok(result.some((i) => /cannot link to draft source\/wcf/.test(i.message)));
  assert.ok(result.some((i) => /must use HTTPS/.test(i.message)));
  assert.ok(result.some((i) => /real dates/.test(i.message)));
});

test("editing content or its source basis invalidates review without rewriting history", () => {
  const entries = fresh(), docs = entries.map((e) => e.document), target = study(entries), history = structuredClone(target.reviews);
  target.content.answer.text += " A revised sentence.";
  assert.equal(reviewState(target, docs), "stale"); assert.deepEqual(target.reviews, history);
  target.content = structuredClone(study().content);
  const source = docs.find((d) => d.kind === "source" && d.id === "wcf")!; source.content.title += " revised";
  assert.equal(reviewState(target, docs), "stale");
  source.content = structuredClone(documents.find((d) => d.kind === "source" && d.id === "wcf")!.content);
  const policy = docs.find((d): d is ContentDocument<"editorial"> => d.kind === "editorial")!;
  policy.content.policy.introduction.text += " Revised policy.";
  assert.equal(reviewState(target, docs), "stale");
  assert.ok(validateDocuments(entries, baseline.index, { allowStaleReviews: true }).some((i) => i.pointer === "/reviews" && i.severity === "warning"));
});

test("ordering does not change editorial fingerprints; source changes have useful impact lists", () => {
  const target = structuredClone(study()); target.order += 50;
  assert.equal(contentHash(target), contentHash(study()));
  assert.equal(basisHash(target, documents), basisHash(study(), documents));
  const affected = impact(documents, "source/wcf");
  assert.ok(affected.direct.includes("study/morality")); assert.ok(affected.transitive.some((id) => id.startsWith("path/")));
  assert.equal(new Set([...affected.direct, ...affected.transitive]).size, affected.direct.length + affected.transitive.length);
  assert.throws(() => impact(documents, "source/missing"), /Unknown document/);
  assert.throws(() => selectDocuments(documents, { topic: "missing" }), /Unknown topic/);
  assert.ok(selectDocuments(documents, { source: "wcf", kind: "study" }).some((d) => d.id === "morality"));
});

test("build works without Bible downloads, is deterministic and catches edited generated files", (t) => {
  const root = fixture(t); assert.equal(existsSync(path.join(root, "data")), false);
  const first = buildContent(root), file = path.join(root, GENERATED_FILE), before = statSync(file).mtimeMs;
  assert.equal(first.artifacts.size, documents.filter((d) => d.publication === "published").length + 4); buildContent(root); assert.equal(statSync(file).mtimeMs, before);
  buildContent(root, true);
  writeFileSync(file, "manually changed output"); assert.throws(() => buildContent(root, true), /missing or stale/);
  buildContent(root); assert.equal(readFileSync(file, "utf8"), first.artifacts.get(GENERATED_FILE));
});

test("failed validation cannot replace the last good output; obsolete public documents are removed", (t) => {
  const root = fixture(t); buildContent(root);
  const file = path.join(root, GENERATED_FILE), good = readFileSync(file, "utf8");
  changeFile(root, "studies/morality.json", (d) => { if (d.kind === "study") d.content.answer.text += " Change requiring review."; });
  assert.throws(() => buildContent(root), /changed after review/); assert.equal(readFileSync(file, "utf8"), good);
  recordReview(root, "study/morality", { reviewer: "Test reviewer", kind: "ai-assisted", scope: "Fixture change", note: "Test record only." });
  const obsolete = path.join(root, "public/content/apologetics/study-removed.md"); writeFileSync(obsolete, "old draft");
  assert.throws(() => buildContent(root, true), /study-removed/); buildContent(root); assert.equal(existsSync(obsolete), false);
  assert.ok(readFileSync(file, "utf8").includes("Change requiring review."));
});

test("review records require attribution and keep the actual reviewer kind", (t) => {
  const root = fixture(t);
  assert.throws(() => recordReview(root, "study/morality", { reviewer: "", kind: "human", scope: "Review", note: "Notes" }), /must be supplied/);
  const review = recordReview(root, "study/morality", { reviewer: "Test AI", kind: "ai-assisted", scope: "Structure only", note: "No theological approval claimed." });
  assert.equal(review.kind, "ai-assisted"); assert.equal(review.contentHash, contentHash(study()));
  assertValid(inspectRepository(root).issues);
});

test("reading exports carry every study paragraph, precise citations, source limits and editorial context", () => {
  const doc = study(), markdown = renderDocument(doc, documents, baseline.index), jsonl = exportRecord(doc, documents);
  for (const block of [doc.content.answer, ...doc.content.reasoning, doc.content.conclusion, ...doc.content.sections, doc.content.reply, doc.content.limit, doc.content.prompt]) {
    assert.ok(markdown.includes(block.text)); assert.ok(markdown.includes("<!-- block: " + block.id + " -->"));
  }
  assert.ok(markdown.includes("Romans 3:10-12")); assert.ok(markdown.includes("https://opc.org/wcf.html"));
  assert.ok(markdown.includes("16.7")); assert.match(markdown, /Editorial basis for this review/);
  assert.match(markdown, /External source texts have not been fetched/);
  assert.deepEqual(jsonl.document, doc); assert.ok(jsonl.editorialBasis); assert.ok(jsonl.sources.length > 0);
  const publicText = renderDocument(doc, documents, baseline.index, { publicExport: true });
  assert.equal(publicText.includes("## Review history"), false); assert.ok(publicText.includes("editorial-library.md"));
});

test("CLI creates a private draft, exports exact selections, records reviews and guards output paths", (t) => {
  const root = fixture(t, true);
  let result = cli(root, "new", "study/test-draft", "--title", "A draft question?", "--topic", "god"); assert.equal(result.status, 0, result.stderr);
  result = cli(root, "new", "study/test-draft", "--title", "Overwrite?", "--topic", "god"); assert.notEqual(result.status, 0);
  const repo = inspectRepository(root); assertValid(repo.issues); assert.ok(repo.issues.some((i) => i.severity === "warning"));
  buildContent(root); const corpus = JSON.parse(readFileSync(path.join(root, "public/content/apologetics/library.json"), "utf8"));
  assert.equal(corpus.documents.some((d: { id: string }) => d.id === "test-draft"), false);
  result = cli(root, "export", "--topic", "god", "--out", ".local/packet"); assert.equal(result.status, 0, result.stderr);
  result = cli(root, "export", "--document", "study/morality", "--out", ".local/packet"); assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(readdirSync(path.join(root, ".local/packet")).sort(), ["all.md", "index.json", "study-morality.md"]);
  result = cli(root, "export", "--document", "study/morality", "--format", "jsonl", "--out", ".local/packet"); assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(readdirSync(path.join(root, ".local/packet")).sort(), ["documents.jsonl", "index.json"]);
  const record = JSON.parse(readFileSync(path.join(root, ".local/packet/documents.jsonl"), "utf8")); assert.equal(record.key, "study/morality");
  result = cli(root, "export", "--out", "content/apologetics"); assert.notEqual(result.status, 0); assert.match(result.stderr, /inside .local/);
  result = cli(root, "review", "study/morality"); assert.notEqual(result.status, 0); assert.match(result.stderr, /--reviewer/);
  result = cli(root, "list", "--document", "study/typo"); assert.notEqual(result.status, 0);
});

test("output paths cannot escape the owning workspace", () => {
  assert.throws(() => assertOrdinaryPath(PROJECT_ROOT, path.resolve(PROJECT_ROOT, "../outside.md")), /inside/);
  assert.doesNotThrow(() => assertOrdinaryPath(PROJECT_ROOT, path.join(PROJECT_ROOT, ".local/review/study.md")));
});

test("release preparation rejects a stale or incomplete built collection", (t) => {
  const root = fixture(t); buildContent(root);
  assert.throws(() => verifyBuiltContent(root), /missing or stale/);
  cpSync(path.join(root, "public"), path.join(root, "dist"), { recursive: true });
  assert.match(verifyBuiltContent(root), /^[a-f0-9]{64}$/);
  writeFileSync(path.join(root, "dist/content/apologetics/study-morality.md"), "stale release copy");
  assert.throws(() => verifyBuiltContent(root), /study-morality/);
});

test("optional Scripture export uses actual local KJV text", { skip: !existsSync(path.join(PROJECT_ROOT, "data/text/kjv/ROM/0.json")) }, () => {
  const text = scriptureText("Romans 3:10-12", baseline.index, PROJECT_ROOT);
  assert.match(text, /3:10 As it is written/); assert.match(text, /There is none righteous/); assert.match(text, /3:12/);
  // Every committed endpoint and verse count must agree with the actual text when it is available.
  for (const book of baseline.index.books) for (let chapter = 1; chapter <= book.chapters.length; chapter++) {
    const chunk = JSON.parse(readFileSync(path.join(PROJECT_ROOT, "data/text/kjv", book.code, `${Math.floor((chapter - 1) / 5)}.json`), "utf8"));
    assert.equal(chunk[String(chapter)].v.length, book.chapters[chapter - 1], `${book.name} ${chapter}`);
  }
});
