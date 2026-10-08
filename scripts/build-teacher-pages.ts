// The two Teachers subpages' data: Preachers & authors (src/data/teachers/people.json) and Scholars
// (src/data/teachers/scholars.json), and a few counts for the /teachers front page (summary.json), from
// content/teachers/*.json and the library catalogue.
//   node --experimental-strip-types scripts/build-teacher-pages.ts           rebuild the three files
//   node --experimental-strip-types scripts/build-teacher-pages.ts --check   fail if any file is stale
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPeople } from "./teacher-pages/people.ts";
import { buildScholars } from "./teacher-pages/scholars.ts";

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const people = buildPeople(site), scholars = buildScholars(site);
// The front page (/teachers) shows a few counts without loading either large file.
const summary = {
  people: people.people.length,
  works: people.people.reduce((n, p) => n + p.works, 0),
  sermons: people.people.reduce((n, p) => n + (p.genres.sermon ?? 0), 0),
  scholars: scholars.scholars.length,
  scholarsInUse: scholars.scholars.filter((s) => s.site?.status === "in-use").length,
};
const outputs: [string, unknown][] = [
  ["src/data/teachers/people.json", people],
  ["src/data/teachers/scholars.json", scholars],
  ["src/data/teachers/summary.json", summary],
];
const check = process.argv.includes("--check");
let stale = 0;
for (const [file, value] of outputs) {
  const text = `${JSON.stringify(value)}\n`;
  const target = path.join(site, file);
  if (check) {
    const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
    if (current !== text) { console.error(`${file} is stale: run npm run teacher-pages`); stale++; }
    else console.log(`${file} is current`);
  } else {
    fs.writeFileSync(target, text);
    console.log(`wrote ${file} (${(text.length / 1024).toFixed(0)} KB)`);
  }
}
if (stale) process.exit(1);
