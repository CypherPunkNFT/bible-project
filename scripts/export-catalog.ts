// The site catalog as Markdown, generated from the same data the pages use (never written by hand).
//   node --experimental-strip-types scripts/export-catalog.ts      -> catalog/topics.md
// Part 1 of CATALOG.md (project root): Topics. Studies, apologetics and the atlas follow.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { TOPIC_SECTIONS } from "../src/lib/topic-style.ts";

interface Group { id: string; title: string; description: string; topics: string[] }
interface Family { id: string; title: string; description: string; subcategories: Group[] }
interface Index { source: string; categories: Family[]; topics: Record<string, { title: string; points: number; refs: number }>; readings?: { title: string }[] }

const root = path.resolve(import.meta.dirname, "..");
const index = JSON.parse(await readFile(path.join(root, "data/topics/index.json"), "utf8")) as Index;
const families = new Map(index.categories.map((family) => [family.id, family]));
const count = (family: Family) => family.subcategories.reduce((n, group) => n + group.topics.length, 0);
const title = (id: string) => index.topics[id]?.title ?? id;
const byName = (a: string, b: string) => title(a).replace(/^The /, "").localeCompare(title(b).replace(/^The /, ""));

const lines: string[] = [
  "# Topics superlist",
  "",
  `Generated from \`data/topics/index.json\` by \`scripts/export-catalog.ts\`. Do not edit by hand. Source: ${index.source}.`,
  "",
  `${TOPIC_SECTIONS.length} sections · ${index.categories.length} cards · ${index.categories.reduce((n, f) => n + f.subcategories.length, 0)} groups · ${Object.keys(index.topics).length.toLocaleString("en-US")} topics`,
  "",
];
const placed = new Set<string>();
TOPIC_SECTIONS.forEach((section, s) => {
  const cards = section.categories.flatMap((id) => families.get(id) ?? []);
  lines.push(`## ${String(s + 1).padStart(2, "0")} ${section.title} (${cards.length} cards, ${cards.reduce((n, f) => n + count(f), 0).toLocaleString("en-US")} topics)`, "", section.description, "");
  for (const family of cards) {
    placed.add(family.id);
    lines.push(`### ${family.title} · ${count(family)} topics · \`${family.id}\``, "", family.description, "");
    for (const group of family.subcategories) {
      lines.push(`- **${group.title}** · ${group.topics.length} topics · \`${group.id}\`: ${group.description}`);
      lines.push(`  - ${[...group.topics].sort(byName).map(title).join(" · ")}`);
    }
    lines.push("");
  }
});
const loose = index.categories.filter((family) => !placed.has(family.id));
if (loose.length) lines.push("## Cards in no section", "", ...loose.map((family) => `- ${family.title} (\`${family.id}\`)`), "");
if (index.readings?.length) lines.push("## Great passages", "", ...index.readings.map((reading, i) => `${i + 1}. ${reading.title}`), "");

await mkdir(path.join(root, "catalog"), { recursive: true });
await writeFile(path.join(root, "catalog/topics.md"), lines.join("\n"), "utf8");
console.log(`catalog/topics.md: ${lines.length} lines`);
