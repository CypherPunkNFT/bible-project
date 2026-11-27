import { readFileSync } from "node:fs";
import path from "node:path";
import { citationsIn, walk, type ContentDocument, type StudyFormat } from "./model.ts";
import { sourceIds } from "./repository.ts";
import { studyWords } from "./formats.ts";

/** content/apologetics/targets.json: each article's planned format and word range, from part B of the plan. */
export interface DepthTarget { topic: string; format: StudyFormat; words: [number, number]; existing: boolean; spine?: string; alsoIn?: string[] }
export interface DepthRow {
  id: string; topic: string; publication: string; format: string; words: number; target: [number, number] | null; targetFormat: string | null;
  status: "below" | "on target" | "above" | "no target"; objections: number; citations: number; baptist: number; scripture: number; debates: number; related: number;
}
export interface DepthReport { rows: DepthRow[]; planned: { id: string; topic: string; format: StudyFormat }[] }

export function loadTargets(root: string): Record<string, DepthTarget> {
  const file = path.join(root, "content/apologetics/targets.json"), value = JSON.parse(readFileSync(file, "utf8"));
  if (!value || typeof value.targets !== "object") throw new Error(`Expected { targets: { id: … } } in ${file}`);
  return value.targets;
}

/** One row per study in the field (its own topic, or listed there through alsoIn), drafts included and marked; then the
 * planned articles of the field not yet written. Counts:
 * - words: every prose text (answers, blocks, objections, questions, terms, extracts), as studyWords counts them;
 * - objections: objection pairs, today's one included; citations: every citation, plus each extract;
 * - baptist: distinct cited sources whose role is Baptist; scripture: distinct Scripture references, cited or as passages;
 * - debates: debates the study names, or that list it; related: the studies it recommends. */
export function depthReport(documents: ContentDocument[], targets: Record<string, DepthTarget>, topic?: string): DepthReport {
  const studies = documents.filter((d): d is ContentDocument<"study"> => d.kind === "study" && (!topic || d.content.topic === topic || (d.content.alsoIn ?? []).includes(topic)));
  const sources = new Map(documents.flatMap((d) => d.kind === "source" ? [[d.id, d] as const] : []));
  const debates = documents.filter((d): d is ContentDocument<"debate"> => d.kind === "debate");
  const rows = studies.map((doc): DepthRow => {
    const c = doc.content, target = targets[doc.id], words = studyWords(c), references = new Set<string>();
    walk(c, (entry) => { if (typeof entry.reference === "string") references.add(entry.reference); });
    const linked = new Set([...(c.debates ?? []), ...debates.filter((d) => d.content.studies.includes(doc.id)).map((d) => d.id)]);
    return { id: doc.id, topic: c.topic, publication: doc.publication, format: c.format ?? "short-answer (today's)", words, target: target?.words ?? null, targetFormat: target?.format ?? null,
      status: !target ? "no target" : words < target.words[0] ? "below" : words > target.words[1] ? "above" : "on target",
      objections: (c.objection !== undefined ? 1 : 0) + (c.objections?.length ?? 0), citations: citationsIn(c).length + (c.extracts?.length ?? 0),
      baptist: sourceIds(doc).filter((id) => sources.get(id)?.content.role.startsWith("Baptist")).length, scripture: references.size, debates: linked.size, related: c.related.length };
  });
  const written = new Set(documents.filter((d) => d.kind === "study").map((d) => d.id));
  const planned = Object.entries(targets).filter(([id, t]) => !written.has(id) && (!topic || t.topic === topic || (t.alsoIn ?? []).includes(topic))).map(([id, t]) => ({ id, topic: t.topic, format: t.format }));
  return { rows, planned };
}

const number = (n: number) => n.toLocaleString("en-US");
export function depthTable({ rows, planned }: DepthReport): string {
  const header = ["article", "format", "words", "target", "status", "objections", "citations", "Baptist", "Scripture", "debates", "related"];
  const cells = rows.map((r) => [r.id + (r.publication === "draft" ? " (draft)" : ""), r.format + (r.targetFormat && r.targetFormat !== r.format.split(" ")[0] ? ` → ${r.targetFormat}` : ""), number(r.words),
    r.target ? `${number(r.target[0])}–${number(r.target[1])}` : "—", r.status, ...[r.objections, r.citations, r.baptist, r.scripture, r.debates, r.related].map(String)]);
  const widths = header.map((h, i) => Math.max(h.length, ...cells.map((row) => row[i].length)));
  const line = (row: string[]) => row.map((cell, i) => i >= 2 ? cell.padStart(widths[i]) : cell.padEnd(widths[i])).join("  ").trimEnd();
  const below = rows.filter((r) => r.status === "below").length;
  return [line(header), widths.map((w) => "-".repeat(w)).join("  "), ...cells.map(line), "",
    `${rows.length} articles; ${below} below target. ${planned.length} planned, not yet written${planned.length ? ": " + planned.map((p) => `${p.id} (${p.format})`).join(", ") : ""}.`].join("\n");
}

