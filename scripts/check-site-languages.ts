// Build check: refuses a site-languages.json the site's own checker (src/lib/site-languages-check.ts) finds unsound,
// before anything is built from it. Run first in both build paths: `npm run build` (package.json prebuild) and the
// quick release's code build (scripts/quick-release-build.mjs), which passes the release tree as the argument.
//   node --experimental-strip-types scripts/check-site-languages.ts [<Website tree>]
// Exit: 0 sound; 1 unsound; 2 unreadable. A tree from before the language file (no site-languages.ts either) is passed.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { siteLanguageProblems } from "../src/lib/site-languages-check.ts";

const root = path.resolve(process.argv[2] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), ".."));
const file = path.join(root, "src/lib/site-languages.json");

if (!fs.existsSync(file)) {
  if (fs.existsSync(path.join(root, "src/lib/site-languages.ts"))) {
    console.error(`Language file check: ${file} is missing, but site-languages.ts in the same tree reads it.`);
    process.exit(1);
  }
  console.log(`Language file check: ${root} predates the language file; nothing to check.`);
  process.exit(0);
}
let data: unknown;
try {
  data = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (error) {
  console.error(`Language file check: ${file} is not readable JSON: ${(error as Error).message}`);
  process.exit(2);
}
const problems = siteLanguageProblems(data);
if (problems.length) {
  console.error(`Language file check: ${file} is not sound (src/lib/site-languages-check.ts):\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`Language file check: ${file} is sound.`);
