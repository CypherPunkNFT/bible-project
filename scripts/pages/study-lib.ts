// Shared helpers for the Study area's CONTENT.md extractors (study.ts and study-*.ts beside it).
// Everything here reads the site's own data and source files; nothing is written.
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { formatRange } from "../../src/lib/refs";
import type { Catalog } from "../../src/lib/types";

export const WEBSITE = path.resolve(import.meta.dirname, "..", "..");
export const SRC = path.join(WEBSITE, "src");
export const SITE = "https://bibleproject.io";

export type Span = [number, number];

export async function readJson<T>(relative: string): Promise<T> {
  const file = path.join(WEBSITE, ...relative.split("/"));
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch (error) {
    throw new Error(`Study content: could not read ${relative} (${(error as Error).message}). Build the site data first (scripts/build-data.py, build-study.py).`);
  }
}

let catalogPromise: Promise<Catalog> | null = null;
export const loadCatalog = () => (catalogPromise ??= readJson<Catalog>("data/catalog.json"));

/** "Matthew 14:13–21", as the site's reference links print it. */
export const ref = (catalog: Catalog, [start, end]: Span) => formatRange(catalog, start, end);
export const refs = (catalog: Catalog, spans: Span[] | undefined, separator = "; ") => (spans ?? []).map((span) => ref(catalog, span)).join(separator);

/** A Markdown table cell: one line, pipes escaped. */
export const cell = (value: unknown) => String(value ?? "").replace(/\s*\n\s*/g, " ").replace(/\|/g, "\\|").trim();
export function table(head: string[], rows: unknown[][]): string {
  return [`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`, ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`)].join("\n");
}
export const n = (value: number) => value.toLocaleString("en-US");
export const link = (address: string) => `[${address}](${SITE}${address})`;
/** Join Markdown blocks with one blank line between them, dropping empty ones. */
export const blocks = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join("\n\n");

let aliasRegistered = false;
/**
 * Let Bun load the site's own React modules: their imports use Vite's "@/" prefix (src/) and the Letters data module
 * calls Vite's import.meta.glob at load time. Only files under Website/src are rewritten, in memory; the rewrite is
 * the same resolution Vite performs, so the modules behave as on the site. Nothing is rendered.
 */
export function registerSiteModules(): void {
  if (aliasRegistered) return;
  aliasRegistered = true;
  const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter = new RegExp(`^${SRC.split(/[\\/]/).map(escape).join("[\\\\/]")}[\\\\/].*\\.tsx?$`, "i");
  Bun.plugin({
    name: "study-content-site-modules",
    setup(build) {
      build.onLoad({ filter }, (args) => {
        const fromDir = path.relative(path.dirname(args.path), SRC).split(path.sep).join("/");
        const prefix = fromDir === "" ? "." : fromDir.startsWith(".") ? fromDir : `./${fromDir}`;
        const contents = readFileSync(args.path, "utf8")
          .replace(/import\.meta\.glob(?:<[^>]*>)?\(/g, "((..._pattern: unknown[]) => ({}))(")
          .replace(/(from\s+|import\s*\(\s*|import\s+)(["'])@\//g, `$1$2${prefix}/`);
        return { contents, loader: args.path.endsWith("x") ? "tsx" : "ts" };
      });
    },
  });
}
