import { cp, mkdir, mkdtemp, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { verifyBuiltContent } from "./content/compile.ts";

// Produces a fresh deployable directory. Never creates a cloud resource or deploys it.
const databaseId = process.env.TESTIMONY_D1_ID;
const siteUrl = new URL(process.env.PUBLIC_SITE_URL ?? "https://bible-project-4af.pages.dev");
if (siteUrl.protocol !== "https:" || siteUrl.username || siteUrl.password || /^(localhost|127\.|\[::1\])/.test(siteUrl.hostname)) throw new Error("PUBLIC_SITE_URL must be the HTTPS website origin.");
if (databaseId && (!/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(databaseId) || databaseId.startsWith("00000000-"))) throw new Error("TESTIMONY_D1_ID must be the real Cloudflare database ID.");
await stat("dist/index.html"); await stat("data/catalog.json");
const apologeticsContentHash = verifyBuiltContent();
await mkdir(".release", { recursive: true });
const directory = await mkdtemp(path.resolve(".release/testimonies-"));
const site = path.join(directory, "site");
await cp("dist", site, { recursive: true });
// dereference: follow links/junctions (a clean release worktree links data/ in), never ship a link.
await cp("data", path.join(site, "data"), { recursive: true, dereference: true });
await cp("migrations", path.join(directory, "migrations"), { recursive: true });
const compiler = spawnSync(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "pages", "functions", "build", "--outdir", path.join(site, "_worker.js")], { stdio: "inherit" });
if (compiler.status !== 0) throw new Error("Pages Function compilation failed.");
await cp("public/_headers", path.join(site, "_headers"));
await cp("public/_routes.json", path.join(site, "_routes.json"));
// The atlas map (STREET_ATLAS.md): its manifest, the current version's 24 MiB pieces, label fonts and icons.
// Lives on F: via the AtlasTiles junction; ATLAS_TILES_DIR overrides (e.g. when preparing from a clean worktree).
const atlas = process.env.ATLAS_TILES_DIR ?? path.resolve(import.meta.dirname, "../../AtlasTiles/site");
const atlasManifest = JSON.parse(await readFile(path.join(atlas, "bible-atlas.json"), "utf8")) as { version: string; chunks: number };
for (const part of ["bible-atlas.json", atlasManifest.version, "fonts", "sprites"]) await cp(path.join(atlas, part), path.join(site, "atlas-tiles", part), { recursive: true, dereference: true });
// The meaning-search pack (MEANING_SEARCH.md): its manifest and the current version's files, built by scripts/build-meaning-pack.py.
const meaning = process.env.MEANING_PACK_DIR ?? path.resolve(import.meta.dirname, "../../MeaningPack/site");
const meaningManifest = JSON.parse(await readFile(path.join(meaning, "meaning.json"), "utf8")) as { version: string };
for (const part of ["meaning.json", meaningManifest.version]) await cp(path.join(meaning, part), path.join(site, "search-model", part), { recursive: true, dereference: true });
const files = await readdir(site, { recursive: true, withFileTypes: true });
if (files.some((entry) => entry.isSymbolicLink())) throw new Error("The release contains a link instead of files; copy with dereference.");
if (files.filter((entry) => entry.isFile()).length > 20000) throw new Error("The release exceeds the project's 20,000-file limit.");
for (const entry of files.filter((entry) => entry.isFile())) {
  const file = path.join(entry.parentPath, entry.name);
  if ((await stat(file)).size > 25 * 1024 * 1024) throw new Error(`Cloudflare Pages refuses files over 25 MiB: ${file}`);
}
if (databaseId) {
  const config = { name: "bible-project", pages_build_output_dir: "./site", compatibility_date: "2026-10-04", compatibility_flags: ["nodejs_compat"], vars: { PUBLIC_SITE_URL: siteUrl.origin }, d1_databases: [{ binding: "DB", database_name: "bible-testimonies", database_id: databaseId, migrations_dir: "./migrations" }] };
  await writeFile(path.join(directory, "wrangler.jsonc"), JSON.stringify(config, null, 2) + "\n");
}
await writeFile(path.join(directory, "release.json"), JSON.stringify({ siteUrl: siteUrl.origin, databaseConfigured: Boolean(databaseId), apologeticsContentHash, files: files.filter((entry) => entry.isFile()).length, routes: JSON.parse(await readFile("public/_routes.json", "utf8")) }, null, 2) + "\n");
console.log("Release prepared at " + directory);
console.log(databaseId ? "Database configured. Apply migrations and deploy this directory using the README launch steps." : "No cloud database is configured. Set TESTIMONY_D1_ID and prepare again before deployment; this package is for local verification only.");
