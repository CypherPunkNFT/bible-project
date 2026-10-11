import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { firstOf, longestText, readJson, single, variant, type TemplateDef } from "./model.ts";
import { WEBSITE } from "./sources.ts";

interface Work { id: string; title: string; availability: string; pages: number }
interface Source { id: string; title: string; basis?: string; catholic?: boolean }
export function teacherReadingTemplates() {
  const folder = path.join(WEBSITE, "public/content/teacher-library/records");
  const works: Work[] = existsSync(folder) ? readdirSync(folder).flatMap(file => Object.values(readJson<Record<string, Work>>("public/content/teacher-library/records/" + file))) : [];
  const sources = readJson<Source[]>("public/content/reading-sources.json");
  const common = { area: "site", scopes: ["src/pages/teachers/shared/"], entries: ["src/pages/teachers/LibraryWorkPage.tsx"] };
  const workVariant = (id: string, name: string, records: Work[]) => {
    const samples = [firstOf<Work>(r => r.title, "example"), longestText<Work>("long-title", "Long title", r => r.title, "title")];
    const checks = samples.map(s => s.pick(records)).filter((r): r is Work => Boolean(r));
    return variant({ id, name, what: "A recorded edition with honest availability and bottom provenance.", records,
      url: (r: Work) => "/teachers/works/" + r.id, samples, checkRecords: checks,
      coverage: "Representative page states; package generation verifies all record, shelf and reading-page references." });
  };
  const templates: TemplateDef[] = [
    { ...common, id: "scholars", name: "Scholars directory", what: "Scholars, living and historical, with subject labels and source collections.", address: "/teachers/scholars", entries: ["src/pages/teachers/scholars/ScholarsPage.tsx"], scopes: ["src/pages/teachers/scholars/", "src/data/teachers/"], signature: { selector: "#catalogue", label: "Scholars catalogue" }, variants: [single("directory", "Directory", "Browse and open a scholar profile.", "/teachers/scholars")] },
    { ...common, id: "scholar-writings", name: "Scholar writings", what: "An author’s source catalogue, shared with Apologetics materials.", address: "/teachers/scholars/<id>/writings", entries: ["src/pages/teachers/ScholarWritingsPage.tsx"], scopes: ["src/pages/teachers/scholar-writings.css", "content/teachers/writings/"], signature: { selector: ".sw-filters", label: "Search and category filters" }, variants: [
      variant({ id: "catalogue", name: "Writings catalogue", what: "Original article and PDF links with subject filters.", records: readJson<{ name: string; path: string }[]>("content/teachers/writings/index.json"), url: r => r.path, samples: [firstOf(r => r.name, "example")] }),
    ] },
    { ...common, id: "teacher-holdings", name: "Teachers acquired shelves", what: "Acquired contributors below the existing biographies.", address: "/teachers/<side>#acquired", signature: { selector: ".acq-catalogue", label: "Acquired contributors" }, variants: [
      single("preachers", "Preachers", "Acquired Baptist and evangelical author shelves.", "/teachers/preachers-and-authors#acquired"),
      single("scholars", "Scholars", "Recorded authors, editors and translators; unknown biographies stay unknown.", "/teachers/scholars#acquired"),
    ] },
    { ...common, id: "teacher-library", name: "Library collection browsing", what: "Includes inscriptions and anonymous texts.", address: "/teachers/works", signature: { selector: ".acq-collections", label: "Collections" }, variants: [single("collections", "Collections", "Choose a source and reading availability.", "/teachers/works")] },
    { ...common, id: "teacher-reading", name: "Held edition reader", what: "Read permission-cleared text on this site.", address: "/teachers/works/<id>", signature: { selector: ".acq-reader", label: "Reading and provenance" }, variants: [
      workVariant("readable", "Reading copy", works.filter(w => w.availability === "on-site-text")),
      workVariant("pending", "Permission pending", works.filter(w => w.availability === "permission-required")),
      workVariant("identity", "Identity review", works.filter(w => w.availability === "identity-review")),
    ] },
    { ...common, entries: ["src/pages/ReadingSourcePage.tsx"], id: "reading-source", name: "Source reading record", what: "Citations stay local; original references are bottom credits.", address: "/sources/reading/<id>", signature: { selector: ".acq-reader", label: "Source and edition" }, variants: [
      single("confession", "Confession", "Chapter reading in the held transcription.", "/sources/reading/ap-wcf?at=11.1"),
      single("comparison", "Comparison translation", "Actual Pickthall edition labelled separately from the cited edition.", "/sources/reading/ap-q112"),
      single("pending", "Public copy pending", "Doctrinal warning and provenance remain visible.", "/sources/reading/ap-aquinas"),
    ] },
  ];
  return { templates, valid: { teacherWorks: works.map(w => w.id), readingSources: sources.map(s => s.id), scholarWritings: readJson<{ path: string }[]>("content/teachers/writings/index.json").map(c => c.path) } };
}
