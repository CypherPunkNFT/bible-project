// The design review inventory: every page TYPE on the site, its variants, instance counts and rule-picked samples,
// derived from the route table's data (never hand-maintained). Run: bun run review:inventory
// Writes content/design-review/templates.json (small, in git: the board and every chat read it) and
// design/review/instances.json (every page address per variant plus the valid ids for the link check; not in git).
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { AREAS, pickSamples, type TemplateDef } from "./model.ts";
import { atlasTemplates } from "./site-map-atlas.ts";
import { peopleTemplates } from "./site-map-people.ts";
import { restTemplates } from "./site-map-rest.ts";
import { researchTemplates } from "./site-map-research.ts";
import { fingerprint, sourceFiles, WEBSITE } from "./sources.ts";

const commit = (() => {
  try { return execFileSync("git", ["rev-parse", "--short=8", "HEAD"], { cwd: WEBSITE, encoding: "utf8" }).trim(); } catch (error) { console.error("design review: no git commit", error); return ""; }
})();

const people = peopleTemplates();
const atlas = await atlasTemplates();
const rest = await restTemplates();
const research = researchTemplates();
const order = AREAS.map((a) => a.id);
const defs: TemplateDef[] = [...people.templates, ...atlas.templates, ...rest.templates, ...research.templates].sort((a, b) => order.indexOf(a.area) - order.indexOf(b.area));

const ids = new Set<string>();
const templates = defs.map((t) => {
  if (ids.has(t.id)) throw new Error(`design review: two templates have the id ${t.id}`);
  ids.add(t.id);
  if (!order.includes(t.area)) throw new Error(`design review: template ${t.id} has unknown area ${t.area}`);
  const sources = sourceFiles(t.entries, t.scopes);
  const variants = t.variants.map((v) => {
    const samples = pickSamples(v);
    if (!samples.length && v.records.length) throw new Error(`design review: ${t.id}/${v.id} has ${v.records.length} pages but no sample was picked`);
    return { id: v.id, name: v.name, what: v.what, instances: v.records.length, samples };
  }).filter((v) => v.instances > 0);
  const unique = new Set(t.variants.flatMap((v) => v.records.map((r) => v.url(r)))).size;
  return { id: t.id, area: t.area, name: t.name, what: t.what, address: t.address, instances: t.instances ?? unique, sources, sourceHash: fingerprint(sources), signature: t.signature ?? null, variants };
});

const instances = Object.fromEntries(defs.flatMap((t) => t.variants.filter((v) => v.records.length).map((v) => {
  const checked = v.checkRecords ?? v.records;
  return [`${t.id}/${v.id}`, { instances: v.records.length, coverage: v.coverage ?? (checked.length === v.records.length ? "" : "a subset"), urls: [...new Set(checked.map((r) => v.url(r)))] }];
})));

const content = path.join(WEBSITE, "content", "design-review");
const local = path.join(WEBSITE, "design", "review");
mkdirSync(content, { recursive: true });
mkdirSync(local, { recursive: true });
writeFileSync(path.join(content, "templates.json"), JSON.stringify({ schema: 1, generatedAt: new Date().toISOString(), commit, areas: AREAS, templates }, null, 1) + "\n", "utf8");
writeFileSync(path.join(local, "instances.json"), JSON.stringify({ commit, variants: instances, valid: { ...people.valid, ...atlas.valid, ...rest.valid, ...research.valid } }) + "\n", "utf8");

const variantCount = templates.reduce((n, t) => n + t.variants.length, 0);
const sampleCount = templates.reduce((n, t) => n + t.variants.reduce((m, v) => m + v.samples.length, 0), 0);
const checkCount = Object.values(instances).reduce((n, v) => n + v.urls.length, 0);
console.log(`${templates.length} page types, ${variantCount} designs, ${sampleCount} samples; the machine checks will open ${checkCount.toLocaleString("en-US")} pages`);
for (const t of templates) console.log(`  ${t.area.padEnd(12)} ${t.name.padEnd(40)} ${String(t.instances).padStart(6)} pages · ${t.variants.length} designs · ${t.variants.reduce((m, v) => m + v.samples.length, 0)} samples · ${t.sources.length} code files`);
