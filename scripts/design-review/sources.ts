// A page type's own code files and one fingerprint over them. The board marks an accepted design "Changed since
// accepted" when this fingerprint moves, so it follows imports from the page's entry files, but only into the folders
// that belong to that page type (shared helpers such as utils or the data loaders would make every page "changed").
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export const WEBSITE = path.resolve(import.meta.dirname, "..", "..");
const EXTENSIONS = ["", ".ts", ".tsx", ".css", "/index.ts", "/index.tsx"];
const IMPORT = /(?:from\s+|import\s*\(\s*|import\s+)["']([^"']+)["']/g;

function resolve(spec: string, fromFile: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = path.join(WEBSITE, "src", spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(fromFile), spec);
  else return null; // a package
  for (const extension of EXTENSIONS) {
    const file = base + extension;
    if (existsSync(file) && statSync(file).isFile()) return file;
  }
  return null;
}

const rel = (file: string) => path.relative(WEBSITE, file).split(path.sep).join("/");

/** Entry files plus everything they import that lives under one of `scopes` (workspace-relative folders or files). */
export function sourceFiles(entries: string[], scopes: string[]): string[] {
  const allowed = [...entries, ...scopes].map((s) => s.replace(/\/$/, ""));
  const inScope = (file: string) => allowed.some((s) => rel(file) === s || rel(file).startsWith(s + "/"));
  const seen = new Set<string>();
  const queue = entries.map((e) => {
    const file = path.join(WEBSITE, e);
    if (!existsSync(file)) throw new Error(`design review: template entry file ${e} does not exist (renamed? update scripts/design-review/site-map.ts)`);
    return file;
  });
  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    if (file.endsWith(".css")) continue;
    for (const match of readFileSync(file, "utf8").matchAll(IMPORT)) {
      const target = resolve(match[1], file);
      if (target && inScope(target) && !seen.has(target) && !/\.test\.tsx?$/.test(target)) queue.push(target);
    }
  }
  return [...seen].map(rel).sort();
}

/** One short fingerprint over the files' contents (line endings ignored, so a CRLF checkout does not count as a change). */
export function fingerprint(files: string[]): string {
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(file + "\0");
    hash.update(readFileSync(path.join(WEBSITE, file), "utf8").replace(/\r\n/g, "\n"));
  }
  return hash.digest("hex").slice(0, 16);
}
