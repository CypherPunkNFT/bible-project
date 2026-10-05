import { parseArgs } from "node:util";
import { existsSync, mkdirSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";
import path from "node:path";
import { buildContent, PROJECT_ROOT } from "./content/compile.ts";
import { assertValid, contentHash, impact, inspectRepository, recordReview, reviewState, selectDocuments } from "./content/repository.ts";
import { exportRecord, renderDocument } from "./content/export.ts";
import { documentKey, FOLDERS, type DocumentKind } from "./content/model.ts";
import { assertOrdinaryPath } from "./content/files.ts";

const { positionals, values } = parseArgs({ allowPositionals: true, options: {
  document: { type: "string" }, topic: { type: "string" }, source: { type: "string" }, kind: { type: "string" },
  format: { type: "string", default: "markdown" }, out: { type: "string" }, json: { type: "boolean" }, published: { type: "boolean" },
  "include-scripture": { type: "boolean" }, reviewer: { type: "string" }, "review-kind": { type: "string" }, scope: { type: "string" }, note: { type: "string" }, title: { type: "string" },
} });
const [command = "help", key] = positionals;
try {
  if (command === "help") {
    console.log(`Apologetics documents — content/apologetics (the only editable source)\n
  npm run content -- list [--kind study] [--topic god] [--source wcf] [--json]
  npm run content -- show study/morality [--include-scripture]
  npm run content -- validate [--json]
  npm run content -- audit [--json]
  npm run content -- impact source/wcf
  npm run content -- export [--document study/morality | --topic god | --source wcf]
      [--format markdown|jsonl] [--out .local/apologetics-review] [--include-scripture]
  npm run content -- new study/new-id --title "A question?" --topic god
  npm run content -- new source/new-id --title "Source title"
  npm run content -- review study/morality --reviewer "Name" --review-kind ai-assisted|human
      --scope "What was checked" --note "Findings and remaining limits"
  npm run content:build
  npm run content:check\n
Review records are explicit attestations, not automatic theological approval.
Drafts stay out of the site. Published documents require current reviews.
Generated Markdown is for reading; apply edits to the JSON source documents.`);
  } else if (command === "build" || command === "check") {
    const result = buildContent(PROJECT_ROOT, command === "check");
    console.log(`${command === "check" ? "Verified" : "Built"} ${result.runtime.STUDIES.length} studies from ${result.repository.entries.length} documents; ${result.artifacts.size} generated artifacts.`);
  } else if (command === "review") {
    if (!key || !values.reviewer || !values["review-kind"] || !values.scope || !values.note) throw new Error("Supply a document key, --reviewer, --review-kind, --scope and --note.");
    console.log(JSON.stringify(recordReview(PROJECT_ROOT, key, { reviewer: values.reviewer, kind: values["review-kind"] as "human" | "ai-assisted", scope: values.scope, note: values.note }), null, 2));
  } else {
    const repo = inspectRepository(PROJECT_ROOT, { allowStaleReviews: command !== "validate" }), documents = repo.entries.map((e) => e.document);
    if (command === "validate" || command === "audit") {
      const result = { documents: documents.length, issues: repo.issues, reviews: documents.map((doc) => ({ key: documentKey(doc), publication: doc.publication, state: reviewState(doc, documents), contentHash: contentHash(doc) })) };
      console.log(values.json ? JSON.stringify(result, null, 2) : `${documents.length} documents\n${repo.issues.map((i) => `${i.severity.toUpperCase()} ${i.file}${i.pointer}: ${i.message}`).join("\n") || "No structural, citation, relationship or review issues."}`);
      if (repo.issues.some((i) => i.severity === "error")) process.exitCode = 1;
    } else {
      assertValid(repo.issues);
      if (values.kind && !(values.kind in FOLDERS)) throw new Error("Unknown document kind: " + values.kind);
      const selected = selectDocuments(documents, { document: values.document, topic: values.topic, source: values.source, kind: values.kind as DocumentKind | undefined, published: values.published });
      if (command === "list") {
        const rows = selected.map((doc) => ({ key: documentKey(doc), title: doc.content.title, publication: doc.publication, review: reviewState(doc, documents), file: `content/apologetics/${FOLDERS[doc.kind]}/${doc.id}.json` }));
        console.log(values.json ? JSON.stringify(rows, null, 2) : rows.map((r) => `${r.key} | ${r.publication} | ${r.review}\n  ${r.title}\n  ${r.file}`).join("\n"));
      } else if (command === "show") {
        const doc = documents.find((d) => documentKey(d) === key); if (!doc) throw new Error("Unknown document: " + key);
        console.log(renderDocument(doc, documents, repo.index, { includeScripture: values["include-scripture"], root: PROJECT_ROOT }));
      } else if (command === "impact") console.log(JSON.stringify(impact(documents, key), null, 2));
      else if (command === "export") {
        if (!["markdown", "jsonl"].includes(values.format)) throw new Error("Export format must be markdown or jsonl.");
        if (values.format === "jsonl" && values["include-scripture"]) throw new Error("--include-scripture is supported by Markdown exports. JSONL retains structured Scripture references.");
        if (!selected.length) throw new Error("No documents match this selection.");
        const out = path.resolve(PROJECT_ROOT, values.out ?? ".local/apologetics-review"), localRoot = path.resolve(PROJECT_ROOT, ".local");
        if (!out.startsWith(localRoot + path.sep)) throw new Error("Review exports must go inside .local/ to protect canonical documents and public releases.");
        assertOrdinaryPath(PROJECT_ROOT, out);
        // Render everything before writing: a missing Scripture dataset must not leave a partial packet.
        const rendered = selected.map((doc) => ({ doc, text: renderDocument(doc, documents, repo.index, { includeScripture: values["include-scripture"], root: PROJECT_ROOT }) }));
        mkdirSync(out, { recursive: true });
        const outputNames = values.format === "jsonl" ? ["documents.jsonl", "index.json"] : ["all.md", "index.json", ...selected.map((d) => `${d.kind}-${d.id}.md`)];
        for (const name of outputNames) assertOrdinaryPath(PROJECT_ROOT, path.join(out, name));
        // A reused packet contains only its current selection, including when switching formats.
        for (const name of readdirSync(out)) if (!outputNames.includes(name) && /^(?:all\.md|documents\.jsonl|(?:study|source|topic|path|worldview|debate|practice|editorial)-[a-z0-9-]+\.md)$/.test(name)) {
          const target = path.join(out, name); assertOrdinaryPath(PROJECT_ROOT, target); unlinkSync(target);
        }
        if (values.format === "jsonl") writeFileSync(path.join(out, "documents.jsonl"), selected.map((d) => JSON.stringify(exportRecord(d, documents))).join("\n") + "\n");
        else {
          for (const { doc, text } of rendered) writeFileSync(path.join(out, `${doc.kind}-${doc.id}.md`), text);
          writeFileSync(path.join(out, "all.md"), rendered.map((r) => r.text).join("\n---\n\n"));
        }
        writeFileSync(path.join(out, "index.json"), JSON.stringify({ format: values.format, documents: selected.map((doc) => ({ key: documentKey(doc), hash: contentHash(doc), review: reviewState(doc, documents), file: values.format === "jsonl" ? "documents.jsonl" : `${doc.kind}-${doc.id}.md` })) }, null, 2) + "\n");
        console.log(`Exported ${selected.length} documents to ${out}. Use index.json for this packet's current membership.`);
      } else if (command === "new") {
        const match = /^(study|source)\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(key ?? "");
        if (!match || !values.title) throw new Error("Use new study/id --title ... --topic ... or new source/id --title ...");
        const [, kind, id] = match, file = path.join(PROJECT_ROOT, "content/apologetics", FOLDERS[kind as DocumentKind], id + ".json");
        if (existsSync(file)) throw new Error("Document already exists: " + key);
        if (kind === "study" && !documents.some((d) => d.kind === "topic" && d.id === values.topic)) throw new Error("Supply --topic with an existing topic ID.");
        const block = (id: string) => ({ id, text: "", citations: [] });
        const content = kind === "study" ? { title: values.title, topic: values.topic, summary: "", answer: block("answer"), reasoning: [block("reason-1"), block("reason-2")], conclusion: block("conclusion"), sections: [{ ...block("section-1"), title: "" }], objection: "", reply: block("reply"), limit: block("limit"), prompt: block("conversation"), passages: [], related: [], keywords: [] } : { title: values.title, author: "", kind: "", url: "https://example.org/", role: "Primary record · not a teaching authority", note: "" };
        const doc = { $schema: "../schema.json", schemaVersion: 1, kind, id, order: Math.max(0, ...documents.filter((d) => d.kind === kind).map((d) => d.order)) + 1, publication: "draft", content, reviews: [] };
        mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, JSON.stringify(doc, null, 2) + "\n", { flag: "wx" });
        console.log(`Created draft ${file}. Complete its content and citations before recording a review and publishing.`);
      } else throw new Error("Unknown command. Run npm run content -- help.");
    }
  }
} catch (error) { console.error((error as Error).message); process.exitCode = 1; }
