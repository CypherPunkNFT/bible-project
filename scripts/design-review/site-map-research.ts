// M04 draft journeys. These addresses are served only by the local preview.
import { firstOf, longestText, readJson, single, variant, type TemplateDef } from "./model.ts";

interface RecordTitle { id: string; title: string; kind?: string }
interface Drafts { cases: RecordTitle[]; sources: RecordTitle[]; contributors: { id: string; name: string }[]; lessons: RecordTitle[] }

export function researchTemplates() {
  const data = readJson<Drafts>("content/research/phase-2.json");
  const base = "/review/research";
  const common = { entries: ["src/pages/research/ResearchPreviewPage.tsx", "content/research/phase-2.json"], scopes: ["src/pages/research/"] };
  const examples = (id: string, name: string, what: string, route: string, records: RecordTitle[]) => variant({
    id, name, what, records, url: (r: RecordTitle) => `${base}/${route}/${r.id}`,
    samples: [firstOf<RecordTitle>(r => r.title, "example"), longestText<RecordTitle>("longest", "Longest title", r => r.title, "title")],
  });
  const templates: TemplateDef[] = [
    { ...common, id: "research-landing", area: "site", name: "Research collection doorways", what: "Three linked reading paths, with the source catalogue close at hand.", address: base, signature: { selector: ".rs-card-grid", label: "Reading paths" }, variants: [
      single("all", "All readings", "Historical, manuscript and Scripture-led readings together.", base),
      single("cases", "Apologetics", "The historical and manuscript questions.", base + "/cases"),
      single("study", "Studies", "Scripture-led theological lessons.", base + "/study"),
    ] },
    { ...common, id: "research-catalogue", area: "site", name: "Research works catalogue", what: "Search named source editions and follow their contributors.", address: base + "/works", signature: { selector: ".rs-source-grid", label: "Source editions" }, variants: [single("works", "Works and editions", "Search the two selected editions.", base + "/works")] },
    { ...common, id: "research-case", area: "apologetics", name: "Historical and manuscript cases", what: "A bounded answer, exact source locations, comparisons and limits.", address: base + "/cases/<case>", signature: { selector: ".rs-answer", label: "The question and answer" }, variants: [
      examples("historical", "Historical case", "A royal inscription alongside the biblical account.", "cases", data.cases.filter(r => r.kind === "historical")),
      examples("manuscript", "Manuscript case", "A named witness and its exact textual boundary.", "cases", data.cases.filter(r => r.kind === "manuscript")),
    ] },
    { ...common, id: "research-source", area: "site", name: "Research source and evidence records", what: "One edition, its attribution, locator, use and limits.", address: base + "/works/<source> or /evidence/<source>", signature: { selector: ".rs-source-layout", label: "Edition and source context" }, variants: [
      examples("edition", "Work and edition", "Bibliographic record and real uses.", "works", data.sources),
      examples("evidence", "Evidence record", "The same source identity seen from a historical question.", "evidence", data.sources),
    ] },
    { ...common, id: "research-contributor", area: "site", name: "Research contributor profiles", what: "Sourced editorial roles, named works and linked readings.", address: base + "/contributors/<contributor>", signature: { selector: ".rs-source-grid", label: "Attributed editions" }, variants: [examples("profiles", "People and projects", "Attribution follows the edition's own credits.", "contributors", data.contributors.map(c => ({ id: c.id, title: c.name })))] },
    { ...common, id: "research-lesson", area: "study", name: "Scripture-led research lessons", what: "Read Scripture, interpret it in context, distinguish historical notes and respond.", address: base + "/study/<lesson>", signature: { selector: ".rs-passage", label: "Begin with Scripture" }, variants: [examples("lesson", "Theological lesson", "Hezekiah's prayer in 2 Kings 19.", "study", data.lessons)] },
  ];
  return { templates, valid: { research: [...new Set(templates.flatMap(t => t.variants.flatMap(v => v.records.map(r => v.url(r)))))] } };
}
