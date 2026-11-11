// Bible twenty questions: the tagging build's gate (design §5.5) and its review sheet (design §5.7).
// Run after tq_build.py:  node --experimental-strip-types scripts/twenty-questions/check.ts
// Exits 1 on any failure. Not part of the site's prebuild; npm test runs the same simulation in data.test.ts.
import fs from "node:fs";
import path from "node:path";
import { prepare, type TqData } from "../../src/pages/games/twenty-questions/engine.ts";
import { questionProblems } from "../../src/pages/games/twenty-questions/questions.ts";
import { TARGETS, playEveryone, separations } from "../../src/pages/games/twenty-questions/simulation.ts";

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const SITE = path.resolve(HERE, "../..");
const read = <T>(file: string): T => JSON.parse(fs.readFileSync(file, "utf8")) as T;

interface SourceTag { id: string; group: string; source: string; implies?: string[]; excludes?: string[]; question: string }
interface Value { v: string; by: string; ref?: number; src?: string; slip?: boolean; why?: string; dataWas?: string }
interface Tagged { id: string; label: string; tier: number; values: Record<string, Value> }
interface BuildNotes {
  droppedRefs: string[]; modelStats?: Record<string, number>; disputes?: Record<string, string[]>;
  unresolved?: Record<string, string[]>; missingPasses?: string[];
}

const tags = read<{ tags: SourceTag[] }>(path.join(HERE, "tags.source.json")).tags;
const tagged = read<Tagged[]>(path.join(HERE, "tagged.json"));
const jesus = read<{ values: Record<string, string[]> }>(path.join(HERE, "jesus.source.json")).values;
const build = read<BuildNotes>(path.join(HERE, "build-notes.json"));
const notes = build.droppedRefs;
const data = read<TqData>(path.join(SITE, "src/data/twenty-questions/twenty-questions.json"));
const failures: string[] = [], warnings: string[] = [];
const yes = (v?: Value) => v?.v === "y", no = (v?: Value) => v?.v === "n";
const dataOwned = new Set(tags.filter((t) => t.source === "data").map((t) => t.id));

for (const person of tagged) {
  for (const tag of tags) {
    const value = person.values[tag.id];
    if (!value) { failures.push(`${person.label}: no value for ${tag.id}`); continue; }
    // check 2: a model value may fill a data gap (the data stage said unsure) but never replace a data yes or no
    if (!["data", "hand"].includes(value.by) && dataOwned.has(tag.id) && value.dataWas !== "?")
      failures.push(`${person.label}: ${tag.id} is a ${value.by} value where the data stage had an answer (check 2)`);
    if (yes(value)) {
      for (const other of tag.implies ?? []) if (no(person.values[other])) failures.push(`${person.label}: ${tag.id} is yes, so ${other} cannot be no`);
      for (const other of tag.excludes ?? []) if (yes(person.values[other])) failures.push(`${person.label}: ${tag.id} is yes, so ${other} cannot be yes`);
      if (["story", "places", "books"].includes(tag.group) && typeof value.ref !== "number" && !value.src)
        failures.push(`${person.label}: ${tag.id} is yes without a verse or source (check 3)`);
    }
  }
}
for (const tag of tags) {
  const values = tagged.map((p) => p.values[tag.id]?.v);
  if (!values.includes("y") || values.every((v) => v === "y")) failures.push(`tag ${tag.id} is yes for ${values.includes("y") ? "everybody" : "nobody"} (check 6)`);
}
const christ = tagged.find((p) => p.id === "jesus-isa-7-14");
for (const [tag, [letter]] of Object.entries(jesus)) if (christ?.values[tag]?.v !== letter) failures.push(`Jesus: ${tag} differs from jesus.source.json (check 7)`);
for (const tag of data.tags) for (const problem of questionProblems(tag.q, data.tags.map((t) => t.q))) failures.push(`question for ${tag.id}: ${problem}`);

const engine = prepare(data);
const thin: string[] = [];
data.people.forEach((a, i) => data.people.forEach((b, j) => {
  if (j <= i || (a.t !== 1 && b.t !== 1)) return;
  const count = separations(engine, i, j);
  const both = a.t === 1 && b.t === 1;
  if (count === 0 && both) failures.push(`${a.label} and ${b.label}: no tag separates them (check 4)`);
  else if (count < 2) (both ? failures : thin).push(`${a.label} and ${b.label}: ${count ? "only one tag separates" : "no tag separates"} them (check 5)`);
}));
warnings.push(...thin);

const report = playEveryone(data, engine);
const pct = (x: number) => `${(100 * x).toFixed(1)} %`;
const targetRows = (Object.keys(TARGETS) as (keyof typeof TARGETS)[]).map((key) => {
  const met = report.rates[key] >= TARGETS[key];
  if (!met) failures.push(`simulation: ${key} ${pct(report.rates[key])} is below the design's target ${pct(TARGETS[key])}`);
  return `| ${key} | ${pct(report.rates[key])} | ${pct(TARGETS[key])} | ${met ? "met" : "**not met**"} |`;
});
const worst = report.people.filter((r) => r.truthful === null || (r.tier === 1 && (r.dontKnow === null || r.oneSlip === null)));
const show = (n: number | null) => (n === null ? "lost" : String(n));
const byId = new Map(tagged.map((p) => [p.id, p]));
function resolverRows(): string[] {
  const rows: string[] = [];
  for (const [pid, disputed] of Object.entries(build.disputes ?? {})) {
    const person = byId.get(pid);
    for (const tag of disputed) {
      const value = person?.values[tag];
      const verdict = value?.by === "resolved" ? `${value.v}${value.ref ? ` (${value.ref})` : ""}${value.why ? `: ${value.why}` : ""}`
        : value?.by === "rule" ? `${value.v} by implies/excludes rule${value.why ? ` (${value.why})` : ""}` : "unresolved, unsure";
      rows.push(`- ${person?.label ?? pid} · ${tag}: ${verdict}`);
    }
  }
  return rows.length ? rows : ["None."];
}

const sheet = [
  "# Bible twenty questions: review sheet", "",
  `Generated by [check.ts](../../../scripts/twenty-questions/check.ts) for game file \`${data.version}\`. Do not edit by hand.`, "",
  `${data.people.length} people (${data.people.filter((p) => p.t === 1).length} in tier 1), ${data.tags.length} tags. ` +
    "Story, place, book-participation and open family and role values come from the two-pass model run of design §5.3 " +
    "(BatchRunner, Haiku-class passes A and B, merged by tq_merge.py; yes-against-no disputes settled by a Sonnet-class resolver). " +
    "Data values and the hand corrections (corrections.source.json) are never overwritten by the model.", "",
  "## Model run (design §5.3-§5.4)", "",
  `Merged values by source: ${Object.entries(build.modelStats ?? {}).map(([k, v]) => `${k} ${v}`).join(", ") || "none"}.`, "",
  "### Resolver decisions (passes disagreed yes against no)", "",
  ...resolverRows(), "",
  "### Passes without a usable answer", "", ...((build.missingPasses?.length ? build.missingPasses : ["None."]).map((m) => `- ${m}`)), "",
  "## Simulation (design §5.5)", "", "| Player | Result | Target | |", "|---|---|---|---|", ...targetRows, "",
  `Average turns to a right guess (truthful player): ${report.averageTurns.toFixed(1)}.`, "",
  "### People not found by every player, worst first", "", "| Person | Tier | Truthful | Don't know on detail | One slip |", "|---|---|---|---|---|",
  ...worst.map((r) => `| ${r.label} | ${r.tier} | ${show(r.truthful)} | ${show(r.dontKnow)} | ${show(r.oneSlip)} |`), "",
  "## Failures", "", ...(failures.length ? failures.map((f) => `- ${f}`) : ["None."]), "",
  "## Warnings (a tier-1 and a tier-2 person separated by fewer than two tags)", "", ...(warnings.length ? warnings.map((w) => `- ${w}`) : ["None."]), "",
  "## Reference notes from the build", "", ...(notes.length ? notes.map((n) => `- ${n}`) : ["None."]), "",
  "## Slip marks", "", ...tagged.flatMap((p) => Object.entries(p.values).filter(([, v]) => v.slip).map(([t]) => `- ${p.label} · ${t}`)), "",
].join("\n");
fs.writeFileSync(path.join(SITE, "docs/features/twenty-questions/review-sheet.md"), sheet, "utf8");
console.log(`review sheet written: ${failures.length} failures, ${warnings.length} warnings`);
for (const [key, value] of Object.entries(report.rates)) console.log(`  ${key}: ${pct(value)}`);
if (failures.length) {
  console.log(failures.slice(0, 40).join("\n"));
  process.exit(1);
}
