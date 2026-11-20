// Cuts each large data set (scripts/split-data/datasets.ts) into the small files of src/lib/split-data.ts, under
// data/split/<dataset>/, each part under the per-file budget in data-budgets.json. Run by prebuild after the sources
// are refreshed, and by hand:
//   node --experimental-strip-types scripts/split-data.ts [dataset...]           write
//   node --experimental-strip-types scripts/split-data.ts --check [--dir <data>] are the written files current and whole?
// Writing adds the new parts, then the manifest (through a temporary file), then removes parts that neither the new
// manifest nor the one before it names, so a page opened before a rebuild can still read its parts. It removes only
// files named like a part, inside its own data/split/<dataset>/ folder. --check never changes anything.
import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSplitManifest, SPLIT_PART, type SplitManifest } from "../src/lib/split-data.ts";
import { buildDataset, sameJson, type Budget, type Built, type Dataset } from "./split-data/engine.ts";
import { DATASETS } from "./split-data/datasets.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The per-file budget the parts are cut to (data-budgets.json, the one place budgets live). */
export function readBudget(): Budget {
  const config = JSON.parse(readFileSync(path.join(root, "data-budgets.json"), "utf8"));
  return { gzipBytes: config.perFileGzipKB * 1024, rawBytes: config.perFileRawKB * 1024, level: config.gzipLevel };
}

export function buildFromSource(dataset: Dataset, budget = readBudget()): Built {
  const source = JSON.parse(readFileSync(path.join(root, dataset.source), "utf8"));
  return buildDataset(dataset, source, budget, String(source.builtAt ?? ""));
}

const manifestFiles = (m: SplitManifest) => [m.head, ...(m.extra ? [m.extra] : []), ...Object.values(m.layers).flatMap((l) => l.files.map((f) => f.file)), ...(m.details?.files ?? [])];

function readManifest(folder: string, name: string): SplitManifest | null {
  const file = path.join(folder, "manifest.json");
  return existsSync(file) ? parseSplitManifest(JSON.parse(readFileSync(file, "utf8")), name) : null;
}

/** The data set's own folder, refused unless it really is inside data/split (no link leading elsewhere). */
function ownFolder(dataDir: string, name: string): string {
  const splitDir = path.join(dataDir, "split"), folder = path.join(splitDir, name);
  mkdirSync(folder, { recursive: true });
  const real = realpathSync(folder), realSplit = realpathSync(splitDir);
  if (path.dirname(real) !== realSplit || path.basename(real) !== name) throw new Error(`Refusing to write ${folder}: it resolves to ${real}, outside ${realSplit}`);
  return real;
}

function write(dataset: Dataset, built: Built, dataDir: string) {
  const folder = ownFolder(dataDir, dataset.name);
  const before = readManifest(folder, dataset.name);
  for (const [file, bytes] of built.files) if (!existsSync(path.join(folder, file))) writeFileSync(path.join(folder, file), bytes);
  const temp = path.join(folder, `manifest.${process.pid}.tmp`);
  writeFileSync(temp, JSON.stringify(built.manifest, null, 1) + "\n");
  renameSync(temp, path.join(folder, "manifest.json"));
  const keep = new Set([...manifestFiles(built.manifest), ...(before ? manifestFiles(before) : [])]);
  const stale = readdirSync(folder).filter((file) => SPLIT_PART.test(file) && !keep.has(file));
  for (const file of stale) rmSync(path.join(folder, file));
  const bytes = [...built.files.values()].reduce((sum, b) => sum + b.length, 0);
  console.log(`split ${dataset.name}: ${built.manifest.rows} rows, ${built.files.size} parts, ${(bytes / 1048576).toFixed(1)} MB; ${stale.length} old parts removed`);
}

/** Problems with the written data set, or [] when its manifest and every part match what the source gives now. */
export function checkWritten(dataset: Dataset, built: Built, dataDir: string): string[] {
  const folder = path.join(dataDir, "split", dataset.name);
  const written = existsSync(path.join(folder, "manifest.json")) ? readManifest(folder, dataset.name) : null;
  if (!written) return [`data/split/${dataset.name}/manifest.json is missing: run npm run split-data`];
  if (!sameJson({ ...written, builtAt: "" }, { ...built.manifest, builtAt: "" })) return [`data/split/${dataset.name} is out of date with ${dataset.source}: run npm run split-data`];
  return manifestFiles(written).filter((file) => !existsSync(path.join(folder, file)) || !readFileSync(path.join(folder, file)).equals(built.files.get(file)!))
    .map((file) => `data/split/${dataset.name}/${file} is missing or changed`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), check = args.includes("--check");
  const dirAt = args.indexOf("--dir"), dataDir = path.resolve(dirAt >= 0 ? args[dirAt + 1] : path.join(root, "data"));
  const names = args.filter((arg, i) => !arg.startsWith("--") && args[i - 1] !== "--dir");
  const unknown = names.filter((name) => !DATASETS.some((d) => d.name === name));
  if (unknown.length) throw new Error(`Unknown data set(s): ${unknown.join(", ")}; known: ${DATASETS.map((d) => d.name).join(", ")}`);
  const problems: string[] = [];
  for (const dataset of DATASETS.filter((d) => !names.length || names.includes(d.name))) {
    const built = buildFromSource(dataset);
    if (check) problems.push(...checkWritten(dataset, built, dataDir));
    else write(dataset, built, dataDir);
  }
  if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
  if (check) console.log("split data: current");
}
