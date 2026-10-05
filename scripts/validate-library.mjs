// Read-only by default. This collection desk is independent of the app content build.
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.join(site, "content/library");
const read = (file) => JSON.parse(readFileSync(file, "utf8"));
const issues = [];
const fail = (file, message) => issues.push(`${path.relative(site, file)}: ${message}`);
const realDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const ajv = new Ajv({ allErrors: true, strict: true, allowUnionTypes: true });
ajv.addFormat("date", realDate);
ajv.addFormat("date-time", (value) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) && Number.isFinite(Date.parse(value)));
ajv.addFormat("https-url", (value) => { try { const u = new URL(value); return u.protocol === "https:" && !u.username && !u.password; } catch { return false; } });
const schema = read(path.join(root, "schema.json"));
const validate = ajv.compile(schema);
function jsonFiles(folder) {
  if (!existsSync(folder)) return [];
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(folder, entry.name);
    return entry.isDirectory() ? jsonFiles(file) : entry.name.endsWith(".json") ? [file] : [];
  }).sort();
}
const files = ["authors.json", "sources.json", "vocabulary.json"].map((f) => path.join(root, f)).concat(jsonFiles(path.join(root, "catalog")));
const documents = [];
for (const file of files) {
  try {
    const doc = read(file);
    if (!validate(doc)) fail(file, ajv.errorsText(validate.errors, { separator: "; " }));
    else documents.push({ file, doc });
  } catch (error) { fail(file, error.message); }
}
if (issues.length) { console.error(issues.join("\n")); process.exit(1); }
const authors = documents.find(({ doc }) => doc.kind === "author-registry").doc.authors;
const sources = documents.find(({ doc }) => doc.kind === "source-registry").doc.sources;
const vocabulary = documents.find(({ doc }) => doc.kind === "vocabulary").doc;
const records = documents.filter(({ doc }) => doc.id);
const byId = new Map();
for (const { file, doc } of records) {
  if (byId.has(doc.id)) fail(file, `Duplicate catalog ID ${doc.id}`);
  byId.set(doc.id, doc);
  if (path.basename(file) !== `${doc.id}.json` || path.basename(path.dirname(file)) !== `${doc.kind === "series" ? "series" : doc.kind + "s"}`) fail(file, "Record ID, filename and kind folder must agree.");
  if (!doc.id.startsWith(doc.kind + "-")) fail(file, "Record ID needs its kind prefix.");
}
function unique(items, label, file) {
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.id)) fail(file, `Duplicate ${label} ID ${item.id}`);
    seen.add(item.id);
  }
  return seen;
}
const authorFile = path.join(root, "authors.json"), sourceFile = path.join(root, "sources.json"), vocabFile = path.join(root, "vocabulary.json");
const authorIds = unique(authors, "author", authorFile), sourceIds = unique(sources, "source", sourceFile);
const subjectIds = unique(vocabulary.subjects, "subject", vocabFile), collectionIds = unique(vocabulary.collections, "collection", vocabFile);
const subjectMap = new Map(vocabulary.subjects.map((s) => [s.id, s]));
const authorMap = new Map(authors.map((a) => [a.id, a]));
const sourceMap = new Map(sources.map((s) => [s.id, s]));
const checkTerms = (file, values, allowed, label) => { for (const value of values) if (!allowed.has(value)) fail(file, `Unknown ${label}: ${value}`); };
const facet = (file, values, key) => checkTerms(file, values, new Set(vocabulary[key]), key);
for (const author of authors) {
  if (!author.id.startsWith("author-")) fail(authorFile, `Invalid author prefix: ${author.id}`);
  facet(authorFile, author.traditions, "traditions");
  checkTerms(authorFile, author.distinctives.map((d) => d.topicId), subjectIds, "distinctive subject");
  if (author.eligibility === "provisional" && !author.unresolved.length) fail(authorFile, `${author.id}: provisional records need a concrete unresolved question.`);
}
for (const source of sources) if (!source.id.startsWith("source-")) fail(sourceFile, `Invalid source prefix: ${source.id}`);
for (const subject of vocabulary.subjects) {
  const seen = new Set([subject.id]); let parent = subject.parent;
  while (parent !== null) {
    if (!subjectIds.has(parent)) { fail(vocabFile, `${subject.id}: missing parent ${parent}`); break; }
    if (seen.has(parent)) { fail(vocabFile, `${subject.id}: cyclic subject hierarchy`); break; }
    seen.add(parent); parent = subjectMap.get(parent).parent;
  }
}
const ref = (file, id, kind) => {
  const target = byId.get(id);
  if (!target || target.kind !== kind) fail(file, `Missing ${kind} reference: ${id}`);
  return target;
};
const can = (rights, action) => rights.actions[action] === "allowed" || (rights.actions[action] === "conditional" && rights.conditionsMet);
const scriptureFile = path.join(site, "content/apologetics/scripture-index.json");
const scripture = existsSync(scriptureFile) ? read(scriptureFile).books : [];
function validVerse(id) {
  const book = scripture.find((b) => b.num === Math.floor(id / 1000000));
  const chapter = Math.floor(id / 1000) % 1000, verse = id % 1000;
  return book && chapter > 0 && chapter <= book.chapters.length && verse > 0 && verse <= book.chapters[chapter - 1];
}
for (const { file, doc } of records) {
  if (doc.editorialState && ["reviewed", "published"].includes(doc.editorialState) && !doc.reviews.length) fail(file, "Reviewed/published records need a review attribution.");
  if (doc.creators || doc.contributors || doc.authorIds) checkTerms(file, (doc.creators ?? doc.contributors ?? doc.authorIds.map((authorId) => ({ authorId }))).map((c) => c.authorId), authorIds, "author");
  if (doc.kind === "work") {
    checkTerms(file, doc.subjects, subjectIds, "subject"); checkTerms(file, doc.collections, collectionIds, "collection");
    for (const [key, values] of Object.entries({ genres: [doc.genre], roles: [doc.role], occasions: doc.occasions, audiences: doc.audiences, depths: [doc.depth], eras: [doc.era] })) facet(file, values, key);
    if (doc.role === "core-teaching" && doc.editorialState !== "draft") {
      const teachers = doc.creators.filter((c) => ["author", "preacher", "institution"].includes(c.role));
      if (!teachers.length || teachers.some((c) => authorMap.get(c.authorId)?.eligibility !== "eligible")) fail(file, "Core teaching requires eligible creators; retain unresolved candidates as drafts.");
    }
    for (const passage of doc.passages) {
      if ((passage.start === null) !== (passage.end === null)) fail(file, "Passage endpoints must both exist or both be null.");
      if (passage.start !== null && passage.end < passage.start) fail(file, "Passage range is reversed.");
      if (passage.verification === "verified" && passage.start === null) fail(file, "Verified passages require endpoints.");
      if (passage.verification === "verified" && ["english", "kjv"].includes(passage.numberingSystem) && (!scripture.length || !validVerse(passage.start) || !validVerse(passage.end))) fail(file, "Verified English-numbered passage does not resolve against the existing Scripture index.");
    }
    for (const relation of doc.related) ref(file, relation.targetId, "work");
  }
  if (doc.kind === "edition") ref(file, doc.workId, "work");
  if (doc.kind === "asset") {
    ref(file, doc.editionId, "edition"); checkTerms(file, [doc.sourceId], sourceIds, "source"); facet(file, [doc.format], "formats");
    const r = doc.rights, acquired = ["downloaded", "derived"].includes(doc.acquisitionStatus);
    if (acquired && (!doc.relativePath || !doc.sha256 || doc.byteCount === null || doc.storage === "none")) fail(file, "Acquired assets require storage, relative path, full checksum and byte count.");
    if (!acquired && (doc.relativePath !== null || doc.sha256 !== null || doc.byteCount !== null || doc.storage !== "none")) fail(file, "Unacquired/link-only assets cannot claim local bytes.");
    if (doc.relativePath && (path.isAbsolute(doc.relativePath) || doc.relativePath.includes("\\") || doc.relativePath.split("/").includes("..") || doc.relativePath.includes(":"))) fail(file, "Asset paths must be portable forward-slash relative paths without traversal.");
    if (doc.storage === "raw" && !doc.relativePath?.startsWith(`library/${doc.sourceId}/${doc.id}/`)) fail(file, "Raw asset path must be library/<source-id>/<asset-id>/<filename> below the resolved source root.");
    if (doc.storage === "derived" && !doc.relativePath?.startsWith(".local/library/")) fail(file, "Derived asset path must be below Website/.local/library/.");
    if (acquired && r.category === "unknown") fail(file, "Unknown rights cannot authorize acquired content.");
    if (doc.fullTextIndexed && ["unknown", "link-only", "restricted"].includes(r.category)) fail(file, "This rights category cannot support a full-text index.");
    if (doc.editorialState === "published" && acquired && ["unknown", "link-only", "restricted"].includes(r.category)) fail(file, "This rights category cannot support hosted content.");
    if (Object.values(r.actions).includes("conditional") && !r.conditions.length) fail(file, "Conditional actions need stated conditions.");
    if (doc.acquisitionStatus === "downloaded" && (!can(r, "download") || !doc.retrievedAt || doc.storage !== "raw")) fail(file, "Downloads require supported download rights, retrieval time and raw storage.");
    if (doc.processing.parentAssetId) ref(file, doc.processing.parentAssetId, "asset");
    if (doc.acquisitionStatus === "derived" && (!doc.processing.parentAssetId || doc.processing.method === "none" || doc.storage !== "derived" || !doc.processing.date)) fail(file, "Derived content needs its parent, method, processing date and derived storage.");
    if (doc.acquisitionStatus === "derived") {
      const action = ["human-transcription", "asr"].includes(doc.processing.method) ? "transcribe" : "adapt";
      if (!can(r, action)) fail(file, `Derivative lacks supported ${action} rights.`);
      const parent = byId.get(doc.processing.parentAssetId);
      if (parent?.kind === "asset" && !can(parent.rights, action)) fail(file, `Parent asset lacks supported ${action} rights.`);
    }
    if (doc.fullTextIndexed && !can(r, "indexFullText")) fail(file, "Full-text indexing lacks a supported permission.");
    if (doc.editorialState === "published" && acquired && !can(r, "host")) fail(file, "Publicly hosted content lacks a supported hosting permission.");
    if (doc.editorialState === "published" && !acquired && !can(r, "indexMetadata")) fail(file, "Public metadata record lacks a supported metadata permission.");
    if ((acquired || doc.fullTextIndexed || doc.editorialState === "published") && !r.evidence.length) fail(file, "Rights actions require supporting evidence.");
    if (r.category === "public-domain" && !r.jurisdiction) fail(file, "Public-domain basis requires a jurisdiction.");
    if (["open-license", "restricted-license"].includes(r.category) && (!r.licenseId || !r.licenseUrl)) fail(file, "Licensed assets require license identity and URL.");
    if (sourceMap.get(doc.sourceId)?.automation === "prohibited" && acquired && !doc.notes.some((n) => n.startsWith("Access exception:"))) fail(file, "Source prohibits automated collection; document a verified permission-compatible Access exception before acquisition.");
  }
  if (doc.kind === "series") {
    const positions = new Set(), members = new Set();
    for (const member of doc.members) {
      ref(file, member.workId, "work");
      if (positions.has(member.position) || members.has(member.workId)) fail(file, "Duplicate series position or work member.");
      positions.add(member.position); members.add(member.workId);
    }
    if (doc.completeness === "complete" && (doc.expectedCount === null || doc.expectedCount !== doc.members.length || !doc.inventoryEvidence.length || doc.missing.length)) fail(file, "Complete series must reconcile with a cited inventory and no known missing members.");
  }
  if (doc.kind === "run") {
    checkTerms(file, doc.sourceIds, sourceIds, "source");
    if (doc.status === "complete" && !doc.completedOn) fail(file, "Completed runs require a completion date.");
    if (doc.completedOn && doc.completedOn < doc.startedOn) fail(file, "Run dates are reversed.");
    if (!/^content\/library\//.test(doc.reportPath) || doc.reportPath.includes("..") || !existsSync(path.join(site, doc.reportPath))) fail(file, "Run report must resolve inside content/library.");
    if (doc.counts.publishedWorks > doc.counts.reviewedWorks || doc.counts.reviewedWorks > doc.counts.works) fail(file, "Run counts must keep published <= reviewed <= works.");
  }
}
if (issues.length) { console.error(issues.join("\n")); process.exit(1); }
if (process.argv.includes("--write-author-view")) {
  const cell = (s) => s.replaceAll("|", "\\|").replaceAll("\n", " ");
  const lines = ["# Initial author registry", "", "Generated from [authors.json](authors.json). Edit the JSON, then run `node scripts/validate-library.mjs --write-author-view` from Website/.", "", "Established 2026-10-05. All decisions are AI-assisted initial screening, not independent human theological approval. Eligible authors still require work-level and edition/rights checks. Provisional status identifies incomplete evidence, not a finding against an author.", "", `**${authors.length} people: ${authors.filter((a) => a.eligibility === "eligible").length} initially eligible; ${authors.filter((a) => a.eligibility === "provisional").length} provisional.**`, "", "| Author | Placement | Decision | Evidence | Next check |", "|---|---|---|---|---|"];
  for (const a of authors) lines.push(`| ${cell(a.name)} | ${cell(a.traditions.join(", "))} | ${a.eligibility} | [Basis](${a.evidence[0].url}) | ${cell(a.unresolved.join(" "))} |`);
  lines.push("", "The registry records fuller rationales and source locators. Tradition tags are broad placement labels. The initial `distinctives` arrays are empty because specific positions must be supported individually; membership does not imply uniform baptism, covenant, gifts or eschatological views.", "");
  writeFileSync(path.join(root, "AUTHORS.md"), lines.join("\n"));
}
console.log(`Library valid: ${authors.length} authors, ${sources.length} sources, ${vocabulary.collections.length} collections, ${vocabulary.subjects.length} subjects, ${records.length} catalog record(s).`);
console.log("Structural validation only; no content acquisition, publication or external theological approval.");
