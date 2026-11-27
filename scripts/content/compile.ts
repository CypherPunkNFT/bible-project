import { mkdirSync, readFileSync, existsSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Block, Citation, ContentDocument, DocumentKind, ScriptureIndex, SourceContent, StudyContent } from "./model.ts";
import { citationsIn, documentKey } from "./model.ts";
import { extractSources, studyWords } from "./formats.ts";
import { assertValid, hash, inspectRepository } from "./repository.ts";
import { parseReference } from "./scripture.ts";
import { renderDocument } from "./export.ts";
import { assertOrdinaryPath } from "./files.ts";
import { readingArtifacts } from "./reading-library.ts";

export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const GENERATED_FILE = "src/generated/apologetics.ts";
export function runtimeCitation(citation: Citation, index: ScriptureIndex) {
  return citation.kind === "scripture" ? { kind: "scripture" as const, span: parseReference(citation.reference, index) } : citation;
}
/** A source as pages and the public corpus show it: read, checked and publicDomain are the register's bookkeeping, kept in content/. */
function publicSource({ read: _read, checked: _checked, publicDomain: _publicDomain, ...shown }: SourceContent) { return shown; }

/** The fields only formats carry, as the site reads them: every citation and passage resolved to verse spans. */
const FORMAT_ONLY = ["objections", "parts", "figure", "works", "extracts", "events", "views", "common", "terms", "questions"] as const;
function runtimeValue(value: unknown, index: ScriptureIndex): unknown {
  if (Array.isArray(value)) return value.map((item) => runtimeValue(item, index));
  if (!value || typeof value !== "object") return value;
  const entry = value as Record<string, unknown>;
  if (entry.kind === "scripture" || entry.kind === "source") return runtimeCitation(entry as unknown as Citation, index);
  if (typeof entry.reference === "string" && typeof entry.note === "string") return { span: parseReference(entry.reference, index), note: entry.note };
  return Object.fromEntries(Object.entries(entry).map(([key, item]) => [key, runtimeValue(item, index)]));
}
function formatFields(c: StudyContent, index: ScriptureIndex) {
  const own = Object.fromEntries(FORMAT_ONLY.filter((key) => c[key] !== undefined).map((key) => [key, runtimeValue(c[key], index)]));
  return { format: c.format, ...(c.spine ? { spine: c.spine } : {}), ...(c.alsoIn ? { alsoIn: c.alsoIn } : {}), ...(c.debates ? { debates: c.debates } : {}), words: studyWords(c), ...own };
}

export function compileDocuments(documents: ContentDocument[], index: ScriptureIndex) {
  const published = documents.filter((d) => d.publication === "published");
  const ofKind = <K extends DocumentKind>(kind: K) => published.filter((d) => d.kind === kind) as ContentDocument<K>[];
  const cites = (citations: Citation[]) => citations.map((c) => runtimeCitation(c, index));
  const none: Block = { id: "", text: "", citations: [] };
  const STUDIES = ofKind("study").map(({ id, content: c }) => {
    // A study without a format compiles exactly as before; a declared format fills today's fields it lacks with empty
    // text, so every page reading them keeps working, and adds its own fields after them (formatFields).
    const reasoning = c.reasoning ?? [], conclusion = c.conclusion ?? none, sections = c.sections ?? [], reply = c.reply ?? none, limit = c.limit ?? none, prompt = c.prompt ?? none;
    const support = { answer: cites(c.answer.citations), reasoning: reasoning.map((b) => cites(b.citations)), conclusion: cites(conclusion.citations), sections: sections.map((b) => cites(b.citations)), reply: cites(reply.citations), limit: cites(limit.citations), prompt: cites(prompt.citations) };
    const extra = c.format === undefined ? undefined : formatFields(c, index);
    const all = [support.answer, ...support.reasoning, support.conclusion, ...support.sections, support.reply, support.limit, support.prompt].flat();
    const sources = [...all.flatMap((c) => c.kind === "source" ? [c.source] : []), ...(extra ? citationsIn(extra).flatMap((c) => c.kind === "source" ? [c.source] : []).concat(extractSources(c)) : [])];
    return { id, title: c.title, topic: c.topic, summary: c.summary, answer: c.answer.text, reasoning: reasoning.map((b) => b.text), conclusion: conclusion.text,
      sections: sections.map((b) => ({ title: b.title, body: b.text })), objection: c.objection ?? "", reply: reply.text, limit: limit.text, prompt: prompt.text,
      refs: c.passages.map((p) => ({ span: parseReference(p.reference, index), note: p.note })), sources: [...new Set(sources)], related: c.related, keywords: c.keywords, support, ...extra };
  });
  const SOURCES = ofKind("source").map(({ id, content }) => ({ id, ...publicSource(content) }));
  const TOPICS = ofKind("topic").map(({ id, content }) => ({ id, ...content }));
  const PATHS = ofKind("path").map(({ id, content }) => ({ id, ...content }));
  const WORLDVIEWS = ofKind("worldview").map(({ id, content: c }) => ({ id, ...c, readingPlan: c.readingPlan ? { ...c.readingPlan, stages: c.readingPlan.stages.map(stage => ({ ...stage, readings: stage.readings.map(reading => ({ ...reading, ...Object.fromEntries(["context", "purpose", "examine", "connection", "christian"].map(key => { const b = reading[key as "context"]; return [key, { ...b, citations: cites(b.citations) }]; })) })) })) } : undefined, rows: c.rows.map((r) => ({ id: r.id, question: r.question, christian: r.christian.text, other: r.other.text, study: r.study, christianBasis: cites(r.christian.citations), otherBasis: cites(r.other.citations) })) }));
  const DEBATES = ofKind("debate").map(({ id, content: c }) => ({ id, ...c, claim: c.claim.text, basis: cites(c.claim.citations) }));
  const PRACTICE = ofKind("practice").map(({ id, content: c }) => ({ id, ...c, explanation: c.explanation.text, basis: cites(c.explanation.citations) }));
  const editorial = ofKind("editorial").find((d) => d.id === "library")!.content;
  const CONVERSATION_STEPS = editorial.conversationSteps.map((step) => ({ title: step.title, line: step.line, detail: step.detail, prompt: step.prompt, span: parseReference(step.reference, index) }));
  const AP_EDITORIAL = { ...editorial.copy, foundations: editorial.foundations, policy: { ...editorial.policy,
    introduction: { ...editorial.policy.introduction, citations: cites(editorial.policy.introduction.citations) },
    sections: editorial.policy.sections.map((section) => ({ ...section, citations: cites(section.citations) })),
  } };
  return { STUDIES, SOURCES, TOPICS, PATHS, WORLDVIEWS, DEBATES, PRACTICE, CONVERSATION_STEPS, APOLOGETICS_ANCHOR: parseReference(editorial.anchor, index), ISLAM_STUDY_QUESTIONS: editorial.islamStudyQuestions, AP_EDITORIAL };
}

function generatedTypescript(runtime: ReturnType<typeof compileDocuments>): string {
  const types: Record<string, string> = { STUDIES: "ApStudy[]", SOURCES: "ApSource[]", TOPICS: "ApTopic[]", PATHS: "ApPath[]", WORLDVIEWS: "ApWorldview[]", DEBATES: "ApDebate[]", PRACTICE: "ApPractice[]", CONVERSATION_STEPS: "ApConversationStep[]", APOLOGETICS_ANCHOR: "Span", ISLAM_STUDY_QUESTIONS: "string[]", AP_EDITORIAL: "ApEditorial" };
  return `// Generated from content/apologetics. Edit the documents, then run npm run content:build.\n// Do not edit this file: a content build replaces it.\nimport type { ApStudy, ApSource, ApTopic, ApPath, ApWorldview, ApDebate, ApPractice, ApConversationStep, ApEditorial } from "../data/apologetics-types";\nimport type { Span } from "../lib/study";\n\n` + Object.entries(runtime).map(([key, value]) => `export const ${key}: ${types[key]} = ${JSON.stringify(value, null, 2)};\n`).join("\n");
}

function writeChanged(file: string, value: string) {
  if (existsSync(file) && readFileSync(file, "utf8") === value) return;
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, value);
}

export function prepareArtifacts(root: string) {
  const repository = inspectRepository(root); assertValid(repository.issues);
  const documents = repository.entries.map((e) => e.document), published = documents.filter((d) => d.publication === "published");
  const runtime = compileDocuments(documents, repository.index);
  const publicCorpus = { schemaVersion: 1, collection: "apologetics", documents: published.map((doc) => ({ kind: doc.kind, id: doc.id, content: doc.kind === "source" ? publicSource(doc.content) : doc.content })) };
  const publicRoot = "public/content/apologetics";
  const artifacts = new Map<string, string>([[GENERATED_FILE, generatedTypescript(runtime)], [`${publicRoot}/library.json`, JSON.stringify(publicCorpus, null, 2) + "\n"]]);
  const markdown = published.map((doc) => ({ doc, text: renderDocument(doc, documents, repository.index, { publicExport: true }) }));
  for (const { doc, text } of markdown) artifacts.set(`${publicRoot}/${doc.kind}-${doc.id}.md`, text);
  artifacts.set(`${publicRoot}/library.md`, "# Apologetics library\n\nPublished study documents and their sources. Scripture is the final authority; see the editorial document for the Reformed basis and limits on source use.\n\n" + markdown.map(({ text }) => text).join("\n---\n\n"));
  artifacts.set(`${publicRoot}/index.json`, JSON.stringify({ schemaVersion: 1, hash: hash(publicCorpus), documents: published.map((doc) => ({ key: documentKey(doc), title: doc.content.title, markdown: `${doc.kind}-${doc.id}.md` })) }, null, 2) + "\n");
  for (const [file, text] of readingArtifacts(root, documents)) artifacts.set(file, text);
  return { artifacts, repository, runtime };
}

/** All output is derived. A failed validation produces no replacement artifacts. */
export function buildContent(root = PROJECT_ROOT, checkOnly = false) {
  const result = prepareArtifacts(root);
  for (const relative of result.artifacts.keys()) assertOrdinaryPath(root, path.join(root, relative));
  const stale: string[] = [];
  for (const [relative, text] of result.artifacts) {
    const file = path.join(root, relative);
    if (checkOnly) { if (!existsSync(file) || readFileSync(file, "utf8") !== text) stale.push(relative); }
    else writeChanged(file, text);
  }
  // This exclusively generated directory contains no authoring material. Remove only recognised
  // obsolete document exports so an unpublished/deleted document cannot remain publicly downloadable.
  const exportRoot = path.resolve(root, "public/content/apologetics");
  if (existsSync(exportRoot)) for (const name of readdirSync(exportRoot)) {
    if (!/^(study|source|topic|path|worldview|debate|practice|editorial)-[a-z0-9-]+\.md$/.test(name)) continue;
    const relative = "public/content/apologetics/" + name;
    if (result.artifacts.has(relative)) continue;
    if (checkOnly) stale.push(relative);
    else {
      const target = path.resolve(exportRoot, name);
      if (path.dirname(target) !== exportRoot) throw new Error("Export cleanup escaped its output directory");
      unlinkSync(target);
    }
  }
  if (stale.length) throw new Error(`Generated content is missing or stale. Run npm run content:build.\n${stale.join("\n")}`);
  return result;
}

/** Deployment preparation must use the public documents from this exact valid content revision. */
export function verifyBuiltContent(root = PROJECT_ROOT) {
  const result = prepareArtifacts(root);
  for (const [relative, text] of result.artifacts) {
    if (!relative.startsWith("public/")) continue;
    const built = path.join(root, "dist", relative.slice("public/".length));
    if (!existsSync(built) || readFileSync(built, "utf8") !== text) throw new Error(`Built apologetics content is missing or stale: ${relative}. Run npm run build before preparing a release.`);
  }
  return JSON.parse(result.artifacts.get("public/content/apologetics/index.json")!).hash as string;
}
