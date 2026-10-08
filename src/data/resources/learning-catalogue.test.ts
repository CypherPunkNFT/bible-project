// The Learning division's catalogue (learning-catalogue.json) holds together: every reference inside it exists, every
// "built from" link opens a real page of this site (its route and the data behind it, not a redirect), and a title is
// ready exactly when scripts/build-learning.mjs has built it (a row in learning.json, its PDFs and pages on disk).
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PATHS, STUDIES } from "@/generated/apologetics";
import type { LearningData } from "./index";
import { CATALOGUE, buildDivision, divisionCounts } from "./learning-catalogue";

const SITE = path.resolve(__dirname, "../../..");
const read = (file: string) => fs.readFileSync(path.join(SITE, file), "utf8");
const learning = JSON.parse(read("src/data/resources/learning.json")) as LearningData;

// The app's own routes (src/App.tsx), without those that only redirect elsewhere.
const REDIRECTS = /^(StudyRedirect|AtlasRedirect|PersonRedirect|Navigate)\b/;
const ROUTES = new Set([...read("src/App.tsx").matchAll(/<Route path="([^"]+)" element=\{<(\w+)/g)].filter(([, , el]) => !REDIRECTS.test(el)).map(([, p]) => p));
const topicCategories = new Set((JSON.parse(read("data/topics/index.json")) as { categories: { id: string }[] }).categories.map((c) => c.id));
const peoplePages = JSON.parse(read("src/data/people-pages/index.json")) as Record<string, { id: string }[]>;
const ASPECTS: Record<string, string> = { rule: "rulers", mission: "apostles", word: "prophets" };
const PEOPLE_VIEWS = new Set([...(read("src/pages/study/PeoplePage.tsx").match(/CARD_VIEWS = \[([^\]]+)\]/)?.[1].matchAll(/"(\w+)"/g) ?? [])].map((m) => m[1]).concat("families"));
const JOURNEYS = read("src/pages/places/AtlasCollection.tsx");
const CHART_PANELS = new Set([...read("src/pages/ChartsPage.tsx").matchAll(/<ChartPanel id="([\w-]+)"/g)].map((m) => m[1]));

/** Why an address does not open a real page, or null when it does. */
function unresolved(address: string): string | null {
  const url = new URL(address, "https://site.invalid");
  const parts = url.pathname.split("/").filter(Boolean);
  const [first, second, third, fourth] = parts;
  if (first === "people") {
    if (!second || parts.length > 3) return "not a person address";
    if (!fs.existsSync(path.join(SITE, "data/study/people", `${second}.json`))) return `no person "${second}"`;
    if (third && !(peoplePages[ASPECTS[third]] ?? []).some((p) => p.id === second)) return `"${second}" has no ${third} page`;
    return null;
  }
  if (first === "topics" && second === "c") return third && topicCategories.has(third) && !fourth ? null : `no Topics category "${third}"`;
  if (first === "apologetics" && second === "paths") return PATHS.some((p) => p.id === third) ? null : `no apologetics path "${third}"`;
  if (first === "apologetics" && second === "study") return STUDIES.some((s) => s.id === third) ? null : `no apologetics study "${third}"`;
  if (first === "resources" && second === "learning" && third) return CATALOGUE.items.some((i) => i.id === third) ? null : `no title "${third}"`;
  if (first === "study" && second === "atlas" && third) {
    if (third !== "journeys" || fourth) return `no Atlas page "${third}"`;
    const focus = url.searchParams.get("focus");
    return !focus || JOURNEYS.includes(`id: "${focus}"`) ? null : `no journey "${focus}"`;
  }
  if (url.pathname === "/study/people" && url.searchParams.has("view")) return PEOPLE_VIEWS.has(url.searchParams.get("view")!) ? null : `no People view "${url.searchParams.get("view")}"`;
  if (url.pathname === "/study/gospels" && url.hash) return CHART_PANELS.has(url.hash.slice(1)) ? null : `no panel ${url.hash} on /study/gospels`;
  const route = [...ROUTES].find((r) => r === url.pathname || (r.endsWith("/*") && url.pathname === r.slice(0, -2)));
  return route ? null : `${url.pathname} is not a route of its own (src/App.tsx), or only redirects`;
}

describe("learning-catalogue.json", () => {
  it("has 41 titles whose readers, kinds, subjects and series all exist", () => {
    const ids = (list: { id: string }[]) => new Set(list.map((x) => x.id));
    const [audiences, kinds, tracks, series] = [ids(CATALOGUE.audiences), ids(CATALOGUE.kinds), ids(CATALOGUE.tracks), ids(CATALOGUE.series)];
    expect(CATALOGUE.items).toHaveLength(41);
    expect(ids(CATALOGUE.items).size, "title ids are unique").toBe(CATALOGUE.items.length);
    expect(CATALOGUE.audiences.map((a) => a.id)).toEqual(["little", "children", "teens", "young", "adults", "families", "leaders"]);
    for (const t of CATALOGUE.items) {
      expect(["ready", "planned"], t.id).toContain(t.status);
      expect(audiences.has(t.audience), `${t.id} audience ${t.audience}`).toBe(true);
      expect(kinds.has(t.kind), `${t.id} kind ${t.kind}`).toBe(true);
      expect(tracks.has(t.track), `${t.id} track ${t.track}`).toBe(true);
      for (const s of t.series ?? []) expect(series.has(s.id), `${t.id} series ${s.id}`).toBe(true);
      expect(t.title && t.sub, t.id).toBeTruthy();
      expect(t.builtFrom.length, `${t.id} names what it is written from`).toBeGreaterThan(0);
      for (const b of t.builtFrom) expect(b.title, `${t.id} ${b.path}`).toBeTruthy();
    }
    for (const s of CATALOGUE.series) {
      const steps = CATALOGUE.items.flatMap((t) => (t.series ?? []).filter((x) => x.id === s.id).map((x) => x.step)).sort((x, y) => x - y);
      expect(steps, `${s.id} steps run 1, 2, 3 …`).toEqual(steps.map((_, i) => i + 1));
    }
  });

  it("links every title and every subject only to real pages of the site", () => {
    const links = [...CATALOGUE.items.flatMap((t) => t.builtFrom.map((b) => [t.id, b.path])), ...CATALOGUE.tracks.map((t) => [`track ${t.id}`, t.path])];
    const broken = links.map(([where, address]) => [where, address, unresolved(address)]).filter(([, , why]) => why);
    expect(broken, broken.map(([w, a, why]) => `${w}: ${a} (${why})`).join("\n")).toEqual([]);
    expect(links.length).toBeGreaterThan(60);
  });

  it("catches a link that does not resolve", () => {
    expect(unresolved("/people/nobody-gen-1-1")).toMatch(/no person/);
    expect(unresolved("/people/noah-gen-5-29/rule")).toMatch(/no rule page/);
    expect(unresolved("/topics/c/not-a-category")).toMatch(/no Topics category/);
    expect(unresolved("/study/harmony")).toMatch(/only redirects/);
    expect(unresolved("/apologetics/paths/nowhere")).toMatch(/no apologetics path/);
    expect(unresolved("/study/atlas/journeys?focus=nobody")).toMatch(/no journey/);
  });
});

describe("ready only when built", () => {
  const built = new Map(learning.items.map((w) => [w.id, w]));
  it("marks a title ready exactly when learning.json has its built workbook", () => {
    for (const t of CATALOGUE.items) expect(t.status === "ready", `${t.id}: declared ${t.status}, built ${built.has(t.id)}`).toBe(built.has(t.id));
    for (const w of learning.items) expect(CATALOGUE.items.some((t) => t.id === w.id), `${w.id} is built but has no place in the catalogue`).toBe(true);
  });

  it("has the PDFs, cover and every page image of each built workbook on disk, and the same sources", () => {
    for (const w of learning.items) {
      for (const file of [w.pdf.a4, w.pdf.letter, w.cover, ...(w.pageImages ?? [])]) expect(fs.existsSync(path.join(SITE, "public", file)), `${w.id}: ${file}`).toBe(true);
      expect(w.pageImages?.length, `${w.id}: one image per page`).toBe(w.pages);
      expect(w.outline?.sessions.length).toBe(w.sessions);
      const entry = CATALOGUE.items.find((t) => t.id === w.id)!;
      expect(entry.builtFrom.map((b) => b.path).sort()).toEqual([...w.builtFrom].sort());
    }
  });

  it("merges the built records in: planned titles carry no files, ready ones carry their record", () => {
    const division = buildDivision(CATALOGUE, learning.items);
    expect(division.ready.map((t) => t.id).sort()).toEqual([...built.keys()].sort());
    for (const t of division.planned) expect(t.record, t.id).toBeUndefined();
    for (const t of division.ready) expect(t.review, t.id).toMatch(/^Checked \d{4}-\d{2}-\d{2}/);
    // Nothing built: every title planned, whatever the catalogue says.
    expect(buildDivision(CATALOGUE, []).ready).toHaveLength(0);
    expect(division.forAudience("leaders").length).toBe(15);
    expect(divisionCounts()).toEqual({ ready: division.ready.length, planned: division.planned.length, readers: 7 });
  });
});
