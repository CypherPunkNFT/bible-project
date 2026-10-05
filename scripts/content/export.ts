import { citationsIn, documentKey, type Block, type Citation, type ContentDocument, type ScriptureIndex } from "./model.ts";
import { contentHash, basisHash, dependencies, reviewState, sourceIds } from "./repository.ts";
import { parseReference, scriptureText } from "./scripture.ts";

interface ExportOptions { publicExport?: boolean; includeScripture?: boolean; root?: string }
function citationText(c: Citation, documents: ContentDocument[]): string {
  if (c.kind === "scripture") return c.reference;
  const source = documents.find((doc) => doc.kind === "source" && doc.id === c.source);
  return source?.kind === "source" ? `[${source.content.author} — ${c.locator}](${source.content.url})` : `[MISSING SOURCE: ${c.source}]`;
}
function blockMarkdown(block: Block, label: string, documents: ContentDocument[]): string {
  return `## ${label}\n\n<!-- block: ${block.id} -->\n${block.text}\n\nBasis: ${block.citations.map((c) => citationText(c, documents)).join("; ") || "MISSING — research and cite this claim"}\n`;
}

export function renderDocument(doc: ContentDocument, documents: ContentDocument[], index: ScriptureIndex, options: ExportOptions = {}): string {
  const lines = [`# ${doc.content.title}`, "", `Document: ${documentKey(doc)}`, ""];
  if (!options.publicExport) {
    lines.push(`Publication: ${doc.publication} · Review: ${reviewState(doc, documents)}`, `Content hash: ${contentHash(doc)}`, `Basis hash: ${basisHash(doc, documents)}`, "", "This is a generated review copy. Edit the corresponding JSON document in content/apologetics, not this export. External source texts have not been fetched by this export.", "");
    if (doc.reviews.length) lines.push("## Review history", "", ...doc.reviews.map((r) => `- ${r.date} · ${r.kind} · ${r.reviewer} · ${r.scope}: ${r.note}`), "");
  }
  if (doc.kind === "study") {
    const c = doc.content;
    lines.push(c.summary, "", `Topic: ${c.topic}`, `Keywords: ${c.keywords.join(", ")}`, "", blockMarkdown(c.answer, "Starting answer", documents), ...c.reasoning.map((b, i) => blockMarkdown(b, `Reasoning ${i + 1}`, documents)), blockMarkdown(c.conclusion, "Conclusion", documents), ...c.sections.map((b) => blockMarkdown(b, b.title, documents)), `## Objection\n\n${c.objection}\n`, blockMarkdown(c.reply, "Reply", documents), blockMarkdown(c.limit, "Scope and limits", documents), blockMarkdown(c.prompt, "Conversation starter · editorial application", documents), "## Read in Scripture", "", ...c.passages.map((p) => `- ${p.reference}: ${p.note}`), "", `Related studies: ${c.related.join(", ")}`, "");
  } else if (doc.kind === "worldview") {
    lines.push(doc.content.subtitle, "", doc.content.description, "", `Comparison account: ${doc.content.otherLabel}`, "");
    for (const row of doc.content.rows) lines.push(`## ${row.question}`, "", blockMarkdown(row.christian, "Christian account", documents), blockMarkdown(row.other, "Other account · primary record", documents), `Study: ${row.study}`, "");
  } else if (doc.kind === "debate") {
    const c = doc.content;
    lines.push(`${c.speakers} · ${c.setting}`, "", c.description, "", `Reading focus: ${c.lens}`, "", "A record of the speakers’ positions, not a doctrinal authority.", "", blockMarkdown(c.claim, "The exchange", documents), "## Questions for reading · editorial", "", c.hinge, "", ...c.prompts.map((p) => "- " + p), "");
  } else if (doc.kind === "practice") {
    const c = doc.content;
    lines.push("Imagined conversation; responses and feedback are editorial applications.", "", `Conversation label: ${c.label}`, "", c.context, "", `## ${c.question}`, "", ...c.options.map((s, i) => `${i + 1}. ${s}${i === c.best ? " [suggested first response]" : ""}`), "", blockMarkdown(c.explanation, "Feedback", documents), "## Your reflection", "", c.prompt, "");
  } else if (doc.kind === "editorial") {
    const c = doc.content;
    lines.push(c.policy.eyebrow, "", blockMarkdown(c.policy.introduction, c.policy.title, documents), ...c.policy.sections.map((s) => blockMarkdown(s, s.title, documents)), "## Conversation practice", "");
    for (const step of c.conversationSteps) lines.push(`### ${step.title} <!-- block: ${step.id} -->`, "", step.line, "", step.detail, "", step.prompt, "", `Basis: ${step.reference}`, "");
    lines.push("## Editorial notices", "", ...Object.entries(c.copy).flatMap(([key, value]) => [`### ${key}`, "", value, ""]), `Anchor: ${c.anchor}`, `Foundations: ${c.foundations.join(", ")}`, "", "## Legacy comparison questions", "", ...c.islamStudyQuestions.map((q) => "- " + q), "");
  } else if (doc.kind === "source") {
    const c = doc.content; lines.push(`Author/publisher: ${c.author}`, `Type: ${c.kind}`, `Role: ${c.role}`, "", `[Open the source](${c.url})`, "", "## Scope of use", "", c.note, "");
  } else if (doc.kind === "topic") lines.push(doc.content.description, "", `Short label: ${doc.content.short}`, `Display colour: ${doc.content.color}`, `Question: ${doc.content.question}`, "");
  else if (doc.kind === "path") lines.push(doc.content.label, "", doc.content.description, "", "## Reading order", "", ...doc.content.studies.map((id, i) => `${i + 1}. ${id}`), "");
  if (doc.kind !== "source") {
    lines.push("## Sources and their limits", "");
    for (const id of sourceIds(doc)) {
      const source = documents.find((d) => d.kind === "source" && d.id === id);
      if (source?.kind === "source") lines.push(`### ${source.content.title} [${id}]`, "", `${source.content.author} · ${source.content.role}`, "", `[Read source](${source.content.url})`, "", source.content.note, "");
    }
  }
  // Include every relationship, including documentary links that do not occur in a paragraph.
  lines.push("## Connected documents", "", ...dependencies(doc).map((key) => `- ${options.publicExport ? `[${key}](${key.replace("/", "-")}.md)` : key}`), "");
  if (!options.publicExport && doc.kind !== "editorial") {
    const policy = documents.find((d): d is ContentDocument<"editorial"> => d.kind === "editorial" && d.id === "library")?.content.policy;
    if (policy) lines.push("## Editorial basis for this review", "", policy.introduction.text, "", ...policy.sections.flatMap((section) => [blockMarkdown(section, section.title, documents)]));
  }
  if (options.includeScripture) {
    if (!options.root) throw new Error("A repository root is required to include local Scripture text");
    const refs = new Set(citationsIn(doc.content).flatMap((c) => c.kind === "scripture" ? [c.reference] : []));
    if (doc.kind === "study") doc.content.passages.forEach((p) => refs.add(p.reference));
    if (doc.kind === "editorial") { refs.add(doc.content.anchor); doc.content.conversationSteps.forEach((step) => refs.add(step.reference)); }
    lines.push("## Scripture text · KJV · public domain", "");
    for (const reference of refs) { parseReference(reference, index); lines.push(`### ${reference}`, "", scriptureText(reference, index, options.root), ""); }
  }
  return lines.join("\n").trimEnd() + "\n";
}

export function exportRecord(doc: ContentDocument, documents: ContentDocument[]) {
  const editorial = documents.find((d): d is ContentDocument<"editorial"> => d.kind === "editorial" && d.id === "library");
  return { key: documentKey(doc), document: doc, contentHash: contentHash(doc), basisHash: basisHash(doc, documents), reviewState: reviewState(doc, documents), dependencies: dependencies(doc), editorialBasis: editorial?.content.policy, sources: sourceIds(doc).map((id) => documents.find((d) => d.kind === "source" && d.id === id)) };
}
