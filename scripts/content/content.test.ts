import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { buildContent, compileDocuments, GENERATED_FILE, PROJECT_ROOT, verifyBuiltContent } from "./compile.ts";
import { assertValid, basisHash, citedSourceHash, contentHash, impact, inspectRepository, loadRepository, recordReview, reviewState, selectDocuments, sourceIds, validateDocuments } from "./repository.ts";
import { exportRecord, renderDocument } from "./export.ts";
import { parseReference, formatReference, scriptureText } from "./scripture.ts";
import { citationsIn, STUDY_FORMATS, type ContentDocument, type StudyFormat } from "./model.ts";
import { formatFixture, marker, PUBLIC_DOMAIN } from "./format-fixtures.ts";
import { depthReport, depthTable, loadTargets } from "./depth.ts";
import { PAGE_READY } from "./formats.ts";
import { assertOrdinaryPath } from "./files.ts";
import { prepareReadingLibrary, recordReadingReview } from "./reading-library.ts";

const baseline = loadRepository(PROJECT_ROOT);
const documents = baseline.entries.map((e) => e.document);
function fresh() { return structuredClone(baseline.entries); }
function study(entries = baseline.entries) { return entries.find((e) => e.document.kind === "study" && e.document.id === "morality")!.document as ContentDocument<"study">; }
function issues(entries: typeof baseline.entries) { return validateDocuments(entries, baseline.index); }
function fixture(t: TestContext, withScripts = false) {
  const parent = path.join(PROJECT_ROOT, ".local"); mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(path.join(parent, "content-test-"));
  cpSync(path.join(PROJECT_ROOT, "content/apologetics"), path.join(root, "content/apologetics"), { recursive: true });
  const catalogRoot = "content/library";
  for (const file of ["schema.json", "authors.json", "sources.json", "vocabulary.json", "publication.json"]) cpSync(path.join(PROJECT_ROOT, catalogRoot, file), path.join(root, catalogRoot, file));
  const manifest = JSON.parse(readFileSync(path.join(root, catalogRoot, "publication.json"), "utf8"));
  for (const kind of ["work", "edition", "asset"]) for (const id of manifest[kind + "Ids"]) cpSync(path.join(PROJECT_ROOT, catalogRoot, "catalog", kind + "s", id + ".json"), path.join(root, catalogRoot, "catalog", kind + "s", id + ".json"));
  if (withScripts) {
    cpSync(path.join(PROJECT_ROOT, "scripts/content"), path.join(root, "scripts/content"), { recursive: true });
    cpSync(path.join(PROJECT_ROOT, "scripts/content.ts"), path.join(root, "scripts/content.ts"));
    cpSync(path.join(PROJECT_ROOT, "src/data/apologetics-types.ts"), path.join(root, "src/data/apologetics-types.ts"));
    cpSync(path.join(PROJECT_ROOT, "scripts/validate-library.mjs"), path.join(root, "scripts/validate-library.mjs"));
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
    [(d) => { d.content.reasoning![0].id = "answer"; }, /Duplicate block ID/],
    [(d) => { d.content.answer.text = " "; }, /Text cannot be blank/],
  ];
  for (const [mutate, message] of mutations) { const entries = fresh(); mutate(study(entries)); assert.ok(issues(entries).some((i) => message.test(i.message)), String(message)); }
});

/** The live collection plus one fixture of a format, its 1689 confession given the public-domain record the reading
 * fixture quotes. Published fixtures are judged apart from their missing review and the page-ready guard. */
const PAGE_GUARD = /No page shows the .* format yet/;
function withFixture(format: StudyFormat, publication: "draft" | "published" = "published") {
  const entries = fresh(), doc = formatFixture(format); doc.publication = publication;
  (entries.find((e) => e.document.kind === "source" && e.document.id === "lbcf")!.document as ContentDocument<"source">).content.publicDomain = { ...PUBLIC_DOMAIN };
  entries.push({ file: `content/apologetics/studies/${doc.id}.json`, document: doc });
  return { entries, doc, own: () => issues(entries).filter((i) => i.file.endsWith(`/${doc.id}.json`) && i.pointer !== "/reviews" && !PAGE_GUARD.test(i.message)) };
}

test("a study of each of the ten formats validates, as a draft and when published", () => {
  for (const format of STUDY_FORMATS) {
    assert.deepEqual(withFixture(format, "draft").own().filter((i) => i.severity === "error"), [], format);
    assert.deepEqual(withFixture(format).own(), [], format);
  }
});

test("each format's rules fail with what failed, what was expected and what was found", () => {
  type Fixture = ReturnType<typeof withFixture>;
  const cases: [StudyFormat, (f: Fixture) => void, RegExp][] = [
    ["short-answer", ({ doc }) => { doc.content.objections = []; }, /short answer needs 2 to 5 objection pairs, counting objection\/reply; found 1/],
    ["essay", ({ doc }) => { doc.content.parts = doc.content.parts!.slice(0, 2); }, /essay needs 3 to 8 parts; found 2/],
    ["objections", ({ doc }) => { doc.content.objections![0].heldBy = [" "]; }, /names who holds it; heldBy is empty/],
    ["figure", ({ doc }) => { doc.content.figure!.citations = [{ kind: "scripture", reference: "Romans 3:23" }]; }, /figure cites no source/],
    ["reading", ({ entries }) => { const source = entries.find((e) => e.document.kind === "source" && e.document.id === "lbcf")!.document as ContentDocument<"source">; source.content.checked = "none"; }, /quote only a source checked .* source lbcf is marked checked: none/],
    ["timeline", ({ doc }) => { delete doc.content.events![0].dateNote; }, /debated date says so: event event-1 needs a dateNote/],
    ["debate-guide", ({ doc }) => { doc.content.views = doc.content.views!.slice(0, 1); }, /views compared article needs 2 to 5 views; found 1/],
    ["glossary", ({ doc }) => { doc.content.terms![0].seeAlso = ["no-such-term"]; }, /name a term in this glossary; no-such-term is not one/],
    ["faq", ({ doc }) => { doc.content.questions = doc.content.questions!.slice(0, 7); }, /needs 8 to 15 questions; found 7/],
    ["case-study", ({ doc }) => { doc.content.spine = "scripture-theology"; }, /case study takes the academic spine .*; found scripture-theology/],
  ];
  for (const [format, mutate, message] of cases) {
    const fixture = withFixture(format); mutate(fixture);
    assert.ok(fixture.own().some((i) => i.severity === "error" && message.test(i.message)), `${format}: ${fixture.own().map((i) => i.message).join(" | ")}`);
  }
  assert.equal(cases.length, STUDY_FORMATS.length);
});

test("format structure, rights and links are checked whatever the publication state", () => {
  const draft = (format: StudyFormat, mutate: (doc: ContentDocument<"study">) => void) => { const fixture = withFixture(format, "draft"); mutate(fixture.doc); return fixture.own().filter((i) => i.severity === "error").map((i) => i.message).join(" | "); };
  assert.match(draft("essay", (d) => { delete d.content.parts; }), /essay needs parts; it is missing/);
  assert.match(draft("essay", (d) => { delete d.content.limit; }), /academic spine closes with limit/);
  assert.match(draft("glossary", (d) => { d.content.views = []; }), /cannot carry views, which belongs to debate-guide; found it on format glossary/);
  assert.match(draft("objections", (d) => { d.content.reasoning = []; }), /cannot carry reasoning, which belongs to short-answer/);
  assert.match(draft("short-answer", (d) => { d.content.alsoIn = ["jesus"]; }), /jesus is already its own topic/);
  assert.match(draft("short-answer", (d) => { d.content.alsoIn = ["nowhere"]; }), /Missing referenced document: topic\/nowhere/);
  assert.match(draft("faq", (d) => { d.content.questions![0].study = "missing"; }), /Missing referenced document: study\/missing/);
  assert.match(draft("reading", (d) => { d.content.extracts![0].source = "missing"; }), /Missing referenced document: source\/missing/);
  // A role that says "described, not quoted" forbids an extract even from a source we hold.
  const fixture = withFixture("reading", "draft"), source = fixture.entries.find((e) => e.document.kind === "source" && e.document.id === "lbcf")!.document as ContentDocument<"source">;
  source.content.role = "Scholarship · described, not quoted";
  assert.ok(fixture.own().some((i) => i.severity === "error" && /cannot quote source lbcf/.test(i.message)));
  // A study without a format is today's article: the rules a declared short answer adds do not apply to it.
  assert.ok(!issues(fresh()).some((i) => /objection pairs/.test(i.message)));
  // It cannot carry further objection pairs either: those come with the declared format and its count rule.
  const legacy = fresh(), target = study(legacy); target.content.objections = [];
  assert.ok(issues(legacy).some((i) => i.file.endsWith("morality.json") && i.severity === "error" && /without a format cannot carry objections/.test(i.message)));
  assert.match(draft("figure", (d) => { d.content.works![0].url = "https://someone@archive.org/"; }), /no user name or password/);
  assert.match(draft("faq", (d) => { d.content.questions![0].study = d.id; }), /links to this study itself/);
  assert.match(draft("glossary", (d) => { d.content.terms![1].term = "TERM 1"; }), /TERM 1 repeats term term-1/);
});

test("an extract quotes only a source with a public-domain record, from that edition", () => {
  const errors = (mutate: (doc: ContentDocument<"study">, lbcf: ContentDocument<"source">) => void) => {
    const fixture = withFixture("reading", "draft"); mutate(fixture.doc, fixture.entries.find((e) => e.document.kind === "source" && e.document.id === "lbcf")!.document as ContentDocument<"source">);
    return fixture.own().filter((i) => i.severity === "error").map((i) => i.message).join(" | ");
  };
  assert.equal(errors(() => {}), "");
  // A source read in a named edition is not thereby public domain (a Ligonier article is checked: edition).
  assert.match(errors((_, lbcf) => { delete lbcf.content.publicDomain; lbcf.content.checked = "edition"; }), /names its public-domain edition \(publicDomain\); source lbcf has none/);
  assert.match(errors((doc) => { doc.content.extracts![0].edition = "A 1950s modernised text"; }), /expected "1677\/1689 text as this project holds it", found "A 1950s modernised text"/);
  // The record is the register's bookkeeping: adding it leaves every study citing the source current.
  const entries = fresh(), docs = entries.map((e) => e.document), lbcf = docs.find((d): d is ContentDocument<"source"> => d.kind === "source" && d.id === "lbcf")!;
  const citing = docs.filter((d) => d.kind === "study" && sourceIds(d).includes("lbcf") && reviewState(d, docs) === "current");
  lbcf.content.publicDomain = { ...PUBLIC_DOMAIN };
  assert.ok(citing.length > 0 && citing.every((d) => reviewState(d, docs) === "current"));
});

test("every format has a page, so a published study of any format passes the page guard", () => {
  // Plan step 6 built a renderer for each format (src/components/apologetics/StudyFormats.tsx); a format added later
  // must stay a draft until its page is built and it joins PAGE_READY.
  assert.deepEqual([...PAGE_READY].sort(), [...STUDY_FORMATS].sort());
  for (const format of STUDY_FORMATS) assert.ok(!issues(withFixture(format).entries).some((i) => PAGE_GUARD.test(i.message)), format);
});

test("a published study of each format reaches the generated data and the Markdown download", () => {
  // Search over these fields is tested beside the search code (src/lib/apologetics-search.test.ts), which node cannot load.
  // The fixtures are published in memory only: the live collection never holds them (its first test asserts no issues).
  const entries = fresh();
  (entries.find((e) => e.document.kind === "source" && e.document.id === "lbcf")!.document as ContentDocument<"source">).content.publicDomain = { ...PUBLIC_DOMAIN };
  for (const format of STUDY_FORMATS) { const doc = formatFixture(format); doc.publication = "published"; entries.push({ file: `content/apologetics/studies/${doc.id}.json`, document: doc }); }
  const docs = entries.map((e) => e.document), runtime = compileDocuments(docs, baseline.index);
  for (const format of STUDY_FORMATS) {
    const doc = docs.find((d) => d.id === `fixture-${format}`)!, compiled = runtime.STUDIES.find((s) => s.id === doc.id)!, mark = marker(format);
    assert.equal(compiled.format, format);
    assert.ok(JSON.stringify(compiled).includes(mark), `${format}: generated data`);
    assert.ok(compiled.sources.includes("lbcf") && compiled.words! > 0, `${format}: sources and words`);
    assert.ok(!JSON.stringify(compiled).includes('"reference"'), `${format}: every passage resolved to a span`);
    assert.ok(renderDocument(doc, docs, baseline.index, { publicExport: true }).includes(mark), `${format}: Markdown`);
  }
  // Today's articles (no declared format) compile exactly as before: no format field, no word count.
  const declared = new Set(docs.filter((d) => d.kind === "study" && d.content.format !== undefined).map((d) => d.id));
  assert.ok(runtime.STUDIES.filter((s) => !declared.has(s.id)).every((s) => !("format" in s) && !("words" in s)));
  const glossary = renderDocument(docs.find((d) => d.id === "fixture-glossary")!, docs, baseline.index);
  assert.match(glossary, /Basis: the site's own definition/); assert.doesNotMatch(glossary, /MISSING/);
});

test("the depth report counts each article against its target from part B of the plan", () => {
  const targets = loadTargets(PROJECT_ROOT), report = depthReport(documents, targets, "jesus");
  // Today's four short answers sit below their targets; the field's other sixteen are counted as written or listed as planned.
  const today = report.rows.filter((r) => targets[r.id]?.existing);
  assert.deepEqual(today.map((r) => r.id).sort(), ["cross", "jesus", "miracles", "resurrection"]);
  assert.ok(today.every((r) => r.status === "below" && r.format === "short-answer (today's)" && r.objections === 1), depthTable(report));
  assert.equal(report.rows.length - today.length + report.planned.length, 16);
  assert.ok([...report.rows, ...report.planned].some((p) => p.id === "resurrection-case" && p.format === "essay"));
  // 21 articles today and 95 planned, every one in a field with a format and a word range.
  assert.equal(Object.keys(targets).length, 116); assert.equal(Object.values(targets).filter((t) => t.existing).length, 21);
  assert.ok(Object.values(targets).every((t) => STUDY_FORMATS.includes(t.format) && t.words[0] > 0 && t.words[0] <= t.words[1]));
  // A hand count of the objections fixture: the lede (2 words) and five pairs of 7 + 3 words; its answer and five
  // replies cite Romans 3 and the 1689 confession (a Reformed role, so no Baptist source); Romans 3:10-12 is its one passage.
  const doc = formatFixture("objections"), row = depthReport([...documents, doc], targets, "doubt").rows.find((r) => r.id === doc.id)!;
  assert.deepEqual({ words: row.words, objections: row.objections, citations: row.citations, baptist: row.baptist, scripture: row.scripture, debates: row.debates, related: row.related, status: row.status },
    { words: 52, objections: 5, citations: 12, baptist: 0, scripture: 1, debates: 1, related: 1, status: "no target" });
});

test("format fixtures pass the schema, and the schema refuses unknown formats and fields", (t) => {
  const root = fixture(t);
  for (const format of STUDY_FORMATS) { const doc = formatFixture(format); writeFileSync(path.join(root, "content/apologetics/studies", doc.id + ".json"), JSON.stringify(doc, null, 2)); }
  assert.deepEqual(loadRepository(root).issues, []);
  changeFile(root, "studies/fixture-essay.json", (d) => { if (d.kind === "study") (d.content as unknown as Record<string, unknown>).format = "poem"; });
  changeFile(root, "studies/fixture-faq.json", (d) => { if (d.kind === "study") (d.content.questions![0] as unknown as Record<string, unknown>).answer = "misplaced"; });
  const found = loadRepository(root).issues;
  assert.ok(found.some((i) => i.file.endsWith("fixture-essay.json") && i.pointer === "/content/format"));
  assert.ok(found.some((i) => i.file.endsWith("fixture-faq.json") && /additional properties: answer/.test(i.message)));
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

test("a topic's Start here lists three published studies of its own field (plan job 5.2)", () => {
  const run = (start: string[], mutate: (entries: typeof baseline.entries) => void = () => {}) => {
    const entries = fresh(), topic = entries.find((e) => e.document.kind === "topic" && e.document.id === "god")!.document as ContentDocument<"topic">;
    topic.content.start = start; mutate(entries);
    return issues(entries).filter((i) => i.file.endsWith("topics/god.json") && i.severity === "error" && !/changed after review/.test(i.message)).map((i) => i.message).join(" | ");
  };
  const own = baseline.entries.map((e) => e.document).filter((d): d is ContentDocument<"study"> => d.kind === "study" && d.content.topic === "god").map((d) => d.id);
  const other = baseline.entries.map((e) => e.document).find((d): d is ContentDocument<"study"> => d.kind === "study" && d.content.topic === "jesus")!;
  assert.equal(run(own.slice(0, 3)), "");
  assert.match(run([...own.slice(0, 2), other.id]), new RegExp(`study ${other.id} belongs to jesus and does not name god in alsoIn`));
  assert.equal(run([...own.slice(0, 2), other.id], (entries) => { (entries.find((e) => e.document.kind === "study" && e.document.id === other.id)!.document as ContentDocument<"study">).content.alsoIn = ["god"]; }), "");
  assert.match(run([...own.slice(0, 2), "no-such-study"]), /Missing referenced document: study\/no-such-study/);
  assert.match(run([...own.slice(0, 2), other.id], (entries) => { const s = entries.find((e) => e.document.kind === "study" && e.document.id === other.id)!.document as ContentDocument<"study">; s.content.alsoIn = ["god"]; s.publication = "draft"; }), /cannot link to draft study/);
});

test("a published study needs a Baptist or Reformed teaching source, not any source", () => {
  const rule = /needs a Baptist or Reformed teaching source/;
  // Roles are changed on the sources morality cites, which other studies share, so only morality's own findings count.
  const issues = (entries: typeof baseline.entries) => validateDocuments(entries, baseline.index).filter((i) => i.file.endsWith("morality.json"));
  const withRoles = (role: string) => {
    const entries = fresh(), target = study(entries), cited = new Set(citationsIn(target.content).flatMap((c) => c.kind === "source" ? [c.source] : []));
    for (const { document: doc } of entries) if (doc.kind === "source" && cited.has(doc.id)) doc.content.role = role;
    return { entries, target };
  };
  for (const role of ["Historic Christian witness", "Scholarship · described, not quoted", "Primary record · not a teaching authority"]) {
    const { entries } = withRoles(role);
    assert.ok(issues(entries).some((i) => rule.test(i.message) && i.severity === "error"), role);
  }
  for (const role of ["Baptist confession", "Baptist exposition", "Reformed confession", "Reformed exposition"]) assert.ok(!issues(withRoles(role).entries).some((i) => rule.test(i.message)), role);
  const draft = withRoles("Historic Christian witness"); draft.target.publication = "draft";
  assert.ok(issues(draft.entries).some((i) => rule.test(i.message) && i.severity === "warning"));
  assert.ok(!issues(draft.entries).some((i) => rule.test(i.message) && i.severity === "error"));
  const entries = fresh(), target = study(entries);
  for (const citation of citationsIn(target.content)) if (citation.kind === "source") { citation.source = "lbcf"; citation.locator = "16.5"; }
  assert.ok(!issues(entries).some((i) => rule.test(i.message)), "a study citing only the 1689 Baptist confession and Scripture");
});

test("a source's read and checked record is reviewed on the source without staling the documents citing it", () => {
  const entries = fresh(), docs = entries.map((e) => e.document), target = study(entries);
  const source = docs.find((d): d is ContentDocument<"source"> => d.kind === "source" && d.id === "wcf")!, before = citedSourceHash(source);
  assert.equal(reviewState(source, docs), "current");
  source.content.read = source.content.read + " Revised record of what was read."; source.content.checked = source.content.checked === "none" ? "edition" : "none";
  assert.equal(reviewState(source, docs), "stale"); assert.equal(reviewState(target, docs), "current"); assert.equal(citedSourceHash(source), before);
  source.content.note += " Revised scope."; assert.equal(reviewState(target, docs), "stale");
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
  assert.equal(first.artifacts.size, documents.filter((d) => d.publication === "published").length + 7); buildContent(root); assert.equal(statSync(file).mtimeMs, before);
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
  const c = doc.content as Required<typeof doc.content>;
  for (const block of [c.answer, ...c.reasoning, c.conclusion, ...c.sections, c.reply, c.limit, c.prompt]) {
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
  result = cli(root, "new", "source/test-source", "--title", "A new source"); assert.equal(result.status, 0, result.stderr);
  for (const format of STUDY_FORMATS) { result = cli(root, "new", `study/test-${format}`, "--title", "A format draft?", "--topic", "jesus", "--format", format); assert.equal(result.status, 0, result.stderr); }
  assert.equal(JSON.parse(readFileSync(path.join(root, "content/apologetics/studies/test-essay.json"), "utf8")).content.format, "essay");
  result = cli(root, "new", "study/test-poem", "--title", "?", "--topic", "jesus", "--format", "poem"); assert.notEqual(result.status, 0); assert.match(result.stderr, /must be one of short-answer, essay/);
  result = cli(root, "new", "source/test-format", "--title", "?", "--format", "essay"); assert.notEqual(result.status, 0);
  assert.equal(JSON.parse(readFileSync(path.join(root, "content/apologetics/sources/test-source.json"), "utf8")).content.checked, "none");
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

test("reading publication requires current evidence review and preserves text/file rights separately", (t) => {
  const root = fixture(t), result = prepareReadingLibrary(root, documents);
  assert.equal(result.library.works.length, 46); assert.equal(result.library.authors.length, 30);
  const work = result.library.works.find((w) => w.id === "work-calvin-institutes")!;
  assert.equal(work.editions[0].textRights.status, "public-domain");
  assert.equal(work.editions[0].links[0].rights, "link-only");
  const file = path.join(root, "content/library/catalog/editions/edition-calvin-institutes.json");
  const edition = JSON.parse(readFileSync(file, "utf8")); edition.textRights.scope = "Changed edition scope";
  writeFileSync(file, JSON.stringify(edition));
  assert.throws(() => prepareReadingLibrary(root, documents), /changed since/);
  recordReadingReview(root, documents, { reviewer: "Test fixture", kind: "ai-assisted", scope: "Exercise explicit review persistence" });
  assert.equal(prepareReadingLibrary(root, documents).library.works[0].editions[0].textRights.scope, "Changed edition scope");
});

test("the explicit reading manifest excludes unrelated collection work", (t) => {
  const root = fixture(t), before = prepareReadingLibrary(root, documents);
  writeFileSync(path.join(root, "content/library/catalog/works/work-future-draft.json"), "incomplete acquisition file");
  assert.equal(prepareReadingLibrary(root, documents).contentHash, before.contentHash);
  assert.ok(!prepareReadingLibrary(root, documents).library.works.some((w) => w.id === "work-future-draft"));
  const selectedFile = path.join(root, "content/library/catalog/works/work-calvin-institutes.json");
  const selected = JSON.parse(readFileSync(selectedFile, "utf8")); selected.reading.studyIds = ["missing-study"];
  writeFileSync(selectedFile, JSON.stringify(selected));
  assert.throws(() => prepareReadingLibrary(root, documents, true), /resolve to published studies/);
  assert.throws(() => recordReadingReview(root, documents, { reviewer: "Test", kind: "human", scope: "Cannot approve an invalid relationship" }), /resolve to published studies/);
});

test("reading publication rejects missing records, missing metadata permission and unsafe IDs", (t) => {
  const root = fixture(t), file = path.join(root, "content/library/publication.json"), original = readFileSync(file, "utf8");
  const manifest = JSON.parse(original); manifest.assetIds.push("asset-missing"); writeFileSync(file, JSON.stringify(manifest));
  assert.throws(() => prepareReadingLibrary(root, documents), /asset-missing/);
  manifest.assetIds.pop(); manifest.workIds.push("../../outside"); writeFileSync(file, JSON.stringify(manifest));
  assert.throws(() => prepareReadingLibrary(root, documents), /Invalid publication record ID/);
  writeFileSync(file, original);
  const assetFile = path.join(root, "content/library/catalog/assets/asset-calvin-institutes.json");
  const asset = JSON.parse(readFileSync(assetFile, "utf8")); asset.rights.actions.indexMetadata = "denied"; writeFileSync(assetFile, JSON.stringify(asset));
  assert.throws(() => prepareReadingLibrary(root, documents), /metadata permission/);
});

test("release preparation verifies the reading catalogue as well as study documents", (t) => {
  const root = fixture(t); buildContent(root); cpSync(path.join(root, "public"), path.join(root, "dist"), { recursive: true });
  writeFileSync(path.join(root, "dist/content/apologetics/reformed-reading.json"), "old catalogue");
  assert.throws(() => verifyBuiltContent(root), /reformed-reading/);
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
