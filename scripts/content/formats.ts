import { walk, type ContentDocument, type StudyContent, type StudyFormat } from "./model.ts";

type Add = (pointer: string, message: string, severity?: "error" | "warning") => void;
type Field = keyof StudyContent;

/** Every study has these; the schema requires them. */
const BASE: Field[] = ["title", "topic", "summary", "answer", "passages", "related", "keywords"];
/** Any format may carry these. */
const SHARED: Field[] = ["format", "spine", "alsoIn", "debates", "sections", "conclusion", "limit", "prompt"];
/** Today's article: a study without `format` is this, under today's rules. */
const LEGACY: Field[] = ["reasoning", "conclusion", "sections", "objection", "reply", "limit", "prompt"];
/** What each format needs and what else it may carry beyond BASE and SHARED (plan APOLOGETICS-FIELDS §3). */
export const FORMAT_FIELDS: Record<StudyFormat, { label: string; needs: Field[]; allows: Field[] }> = {
  "short-answer": { label: "A short answer", needs: LEGACY, allows: ["objections"] },
  essay: { label: "An essay", needs: ["spine", "parts"], allows: [] },
  objections: { label: "An objections & replies article", needs: ["objections"], allows: [] },
  figure: { label: "A key figure article", needs: ["figure", "sections", "works"], allows: [] },
  reading: { label: "A primary-source reading", needs: ["extracts"], allows: [] },
  timeline: { label: "A timeline", needs: ["events"], allows: [] },
  "debate-guide": { label: "A views compared article", needs: ["views", "common"], allows: [] },
  glossary: { label: "A glossary", needs: ["terms"], allows: [] },
  faq: { label: "A questions answered article", needs: ["questions"], allows: [] },
  "case-study": { label: "A case study", needs: ["spine", "sections", "limit"], allows: [] },
};
/** How many of its main items each format holds: [field, what one is called, fewest, most]. */
const COUNTS: Partial<Record<StudyFormat, [Field, string, number, number]>> = {
  essay: ["parts", "parts", 3, 8],
  objections: ["objections", "objection pairs", 5, 10],
  figure: ["works", "works", 1, Infinity],
  reading: ["extracts", "extracts", 1, Infinity],
  timeline: ["events", "dated events", 12, 30],
  "debate-guide": ["views", "views", 2, 5],
  glossary: ["terms", "terms", 25, 60],
  faq: ["questions", "questions", 8, 15],
  "case-study": ["sections", "sections (setting, the claim, the evidence, what survives)", 4, Infinity],
};
/** Formats a page can show. A declared format stays a draft until its page exists; plan step 6 built a renderer for each
 * (src/components/apologetics/StudyFormats.tsx and its app copy), so all ten are listed. A format added later stays a
 * draft until its page is built and it is listed here. A study without `format` is today's article, which today's page shows. */
export const PAGE_READY: readonly StudyFormat[] = ["short-answer", "essay", "objections", "figure", "reading", "timeline", "debate-guide", "glossary", "faq", "case-study"];
/** A source whose role forbids quotation can never carry an extract, whatever copy we hold. */
const NOT_QUOTED_ROLE = "Scholarship · described, not quoted";
const range = (min: number, max: number) => max === Infinity ? `at least ${min}` : `${min} to ${max}`;

export const studyFormat = (content: StudyContent): StudyFormat => content.format ?? "short-answer";

/** The rules of the study's format. Structure and rights are errors in a draft too; counts and completeness warn in a
 * draft and fail publication, like the rest of validateDocuments. */
export function formatIssues(doc: ContentDocument<"study">, byKey: Map<string, ContentDocument>, add: Add) {
  const c = doc.content, format = studyFormat(c), rule = FORMAT_FIELDS[format], declared = c.format !== undefined;
  const complete = doc.publication === "published" ? "error" : "warning";
  const present = (field: Field) => c[field] !== undefined;
  const allowed = new Set<Field>([...BASE, ...SHARED, ...rule.needs, ...rule.allows]);
  for (const field of rule.needs) if (!present(field)) add("/content", `${rule.label} needs ${field}; it is missing.`);
  if (!declared) allowed.delete("objections"); // further pairs come with the declared short answer and its count rule
  for (const field of Object.keys(c) as Field[]) if (!allowed.has(field)) {
    const owners = (Object.keys(FORMAT_FIELDS) as StudyFormat[]).filter((f) => FORMAT_FIELDS[f].needs.includes(field) || FORMAT_FIELDS[f].allows.includes(field));
    add(`/content/${field}`, `${declared ? rule.label : "A study without a format"} cannot carry ${field}, which belongs to ${owners.join(", ")}; found it on format ${declared ? format : "(none)"}. ${declared ? "Change the format or move the text." : "Declare format short-answer to add objection pairs."}`);
  }
  const count = COUNTS[format];
  if (count) {
    const [field, noun, min, max] = count, found = (c[field] as unknown[] | undefined)?.length ?? 0;
    if (present(field) && (found < min || found > max)) add(`/content/${field}`, `${rule.label} needs ${range(min, max)} ${noun}; found ${found}.`, complete);
  }
  if (format === "short-answer" && declared) {
    const pairs = (c.objection !== undefined ? 1 : 0) + (c.objections?.length ?? 0);
    if (pairs < 2 || pairs > 5) add("/content/objections", `A short answer needs 2 to 5 objection pairs, counting objection/reply; found ${pairs}.${pairs > 5 ? " Use the objections format for more." : ""}`, complete);
  }
  if (format === "essay" && c.spine) {
    const close: Field = c.spine === "academic" ? "limit" : "prompt";
    if (!present(close)) add("/content", `An essay on the ${c.spine} spine closes with ${close} (${close === "limit" ? "where the evidence stops" : "read the passage again"}); it is missing.`);
  }
  if (format === "case-study" && c.spine && c.spine !== "academic") add("/content/spine", `A case study takes the academic spine (what survives, and what am I inferring?); found ${c.spine}.`);
  const own = (field: "objections" | "views", items: { heldBy: string[] }[] | undefined) => items?.forEach((item, i) => {
    if (!item.heldBy.some((name) => name.trim())) add(`/content/${field}/${i}/heldBy`, `Each of the ${field} names who holds it; heldBy is empty.`, complete);
  });
  own("objections", c.objections); own("views", c.views);
  c.parts?.forEach((part, i) => { if (!part.passages.length) add(`/content/parts/${i}/passages`, `Each essay part carries its own passages; part ${part.id} has none.`, complete); });
  c.views?.forEach((view, i) => {
    if (!view.texts.length) add(`/content/views/${i}/texts`, `Each view names the texts it rests on; view ${view.label || view.id} has none.`, complete);
    if (!view.case.citations.some((citation) => citation.kind === "source")) add(`/content/views/${i}/case/citations`, `Each view needs a named source for its case; view ${view.label || view.id} cites only Scripture or nothing.`, complete);
  });
  if (c.figure && !c.figure.citations.some((citation) => citation.kind === "source")) add("/content/figure/citations", "A key figure's dates and tradition need a source, given as the source gives them; the figure cites no source.", complete);
  c.events?.forEach((event, i) => {
    if ((event.certainty === "debated" || event.certainty === "estimate") && !event.dateNote?.trim()) add(`/content/events/${i}/dateNote`, `A ${event.certainty} date says so: event ${event.id} needs a dateNote naming the dispute or the estimate; it has none.`, complete);
  });
  c.works?.forEach((work, i) => {
    if (work.url === undefined) return;
    let ok = false; try { const url = new URL(work.url); ok = url.protocol === "https:" && !url.username && !url.password; } catch { /* reported below */ }
    if (!ok) add(`/content/works/${i}/url`, `A work's link must be an https address with no user name or password; found ${work.url}.`);
  });
  c.extracts?.forEach((extract, i) => {
    const source = byKey.get("source/" + extract.source);
    if (source?.kind !== "source") return; // dependencies() reports the missing source
    // `checked` says how the text was read, not whether it may be quoted: publicDomain is the rights record.
    const pd = source.content.publicDomain;
    if (!pd) add(`/content/extracts/${i}/source`, `An extract may quote only a source whose record names its public-domain edition (publicDomain); source ${extract.source} has none.`);
    else if (pd.edition !== extract.edition) add(`/content/extracts/${i}/edition`, `An extract quotes the public-domain edition its source names; expected "${pd.edition}", found "${extract.edition}".`);
    if (source.content.checked === "none") add(`/content/extracts/${i}/source`, `An extract may quote only a source checked against a held copy or a named edition; source ${extract.source} is marked checked: none.`);
    if (source.content.role === NOT_QUOTED_ROLE) add(`/content/extracts/${i}/source`, `An extract cannot quote source ${extract.source}: its role is "${NOT_QUOTED_ROLE}".`);
  });
  if (c.terms) {
    const ids = new Set(c.terms.map((term) => term.id)), names = new Map<string, string>();
    c.terms.forEach((term, i) => {
      const name = term.term.trim().toLowerCase();
      if (name && names.has(name)) add(`/content/terms/${i}/term`, `Each term appears once in a glossary; ${term.term} repeats term ${names.get(name)}.`);
      else names.set(name, term.id);
    });
    c.terms.forEach((term, i) => term.seeAlso.forEach((target, j) => {
      if (target === term.id) add(`/content/terms/${i}/seeAlso/${j}`, `Term ${term.id} cannot see itself.`);
      else if (!ids.has(target)) add(`/content/terms/${i}/seeAlso/${j}`, `See-also must name a term in this glossary; ${target} is not one.`);
    }));
  }
  c.questions?.forEach((question, i) => { if (question.study === doc.id) add(`/content/questions/${i}/study`, `An answer links to a fuller article elsewhere; question ${question.id} links to this study itself.`); });
  if (doc.publication === "published" && declared && !PAGE_READY.includes(format)) add("/content/format", `No page shows the ${format} format yet (plan step 6 builds each); keep this study a draft until it does.`);
  c.alsoIn?.forEach((topic, i) => {
    // A topic that does not exist is reported by dependencies(), through formatLinks.
    if (topic === c.topic) add(`/content/alsoIn/${i}`, `alsoIn lists the other fields that show this study; ${topic} is already its own topic.`);
  });
}

/** Sources quoted by extracts: they count as cited, for the basis hash, the source lists and the missing-source check. */
export const extractSources = (content: StudyContent) => (content.extracts ?? []).map((extract) => extract.source);
/** Documents a study links to beyond its topic, related studies and sources. */
export const formatLinks = (content: StudyContent) => [
  ...(content.alsoIn ?? []).map((id) => "topic/" + id), ...(content.debates ?? []).map((id) => "debate/" + id),
  ...(content.questions ?? []).flatMap((q) => q.study ? ["study/" + q.study] : []),
];

/** The blank fields `npm run content -- new study/<id> --format <format>` writes: every field the format needs, empty. */
export function formatScaffold(format: StudyFormat): Partial<StudyContent> {
  const block = (id: string) => ({ id, text: "", citations: [] });
  const section = (id: string) => ({ ...block(id), title: "" });
  switch (format) {
    case "short-answer": return { reasoning: [block("reason-1"), block("reason-2")], conclusion: block("conclusion"), sections: [section("section-1")], objection: "", reply: block("reply"), limit: block("limit"), prompt: block("conversation"), objections: [] };
    case "essay": return { spine: "academic", parts: [], limit: block("limit") };
    case "objections": return { objections: [] };
    case "figure": return { figure: { name: "", dates: "", tradition: "", roles: [], citations: [] }, sections: [section("life"), section("argued"), section("legacy")], works: [] };
    case "reading": return { extracts: [] };
    case "timeline": return { events: [] };
    case "debate-guide": return { views: [], common: block("common") };
    case "glossary": return { terms: [] };
    case "faq": return { questions: [] };
    case "case-study": return { spine: "academic", sections: [section("setting"), section("claim"), section("evidence"), section("survives")], limit: block("limit") };
  }
}

/** Words of every text a reader sees, for the reading time of a declared format (a format-less study keeps today's count). */
export function studyWords(c: StudyContent): number {
  let words = 0;
  walk(c, (entry) => { for (const key of ["text", "objection", "question", "term"]) if (typeof entry[key] === "string") words += (entry[key] as string).split(/\s+/).filter(Boolean).length; });
  return words; // walk visits the study itself too, so today's objection is counted
}
