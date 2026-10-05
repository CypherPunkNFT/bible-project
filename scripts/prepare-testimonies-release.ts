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
await cp("data", path.join(site, "data"), { recursive: true });
await cp("migrations", path.join(directory, "migrations"), { recursive: true });
const compiler = spawnSync(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "pages", "functions", "build", "--outdir", path.join(site, "_worker.js")], { stdio: "inherit" });
if (compiler.status !== 0) throw new Error("Pages Function compilation failed.");
await cp("public/_headers", path.join(site, "_headers"));
await cp("public/_routes.json", path.join(site, "_routes.json"));
const files = await readdir(site, { recursive: true, withFileTypes: true });
if (files.filter((entry) => entry.isFile()).length > 20000) throw new Error("The release exceeds the project's 20,000-file limit.");
if (databaseId) {
  const config = { name: "bible-project", pages_build_output_dir: "./site", compatibility_date: "2026-10-04", compatibility_flags: ["nodejs_compat"], vars: { PUBLIC_SITE_URL: siteUrl.origin }, d1_databases: [{ binding: "DB", database_name: "bible-testimonies", database_id: databaseId, migrations_dir: "./migrations" }] };
  await writeFile(path.join(directory, "wrangler.jsonc"), JSON.stringify(config, null, 2) + "\n");
}
await writeFile(path.join(directory, "release.json"), JSON.stringify({ siteUrl: siteUrl.origin, databaseConfigured: Boolean(databaseId), apologeticsContentHash, files: files.filter((entry) => entry.isFile()).length, routes: JSON.parse(await readFile("public/_routes.json", "utf8")) }, null, 2) + "\n");
console.log("Release prepared at " + directory);
console.log(databaseId ? "Database configured. Apply migrations and deploy this directory using the README launch steps." : "No cloud database is configured. Set TESTIMONY_D1_ID and prepare again before deployment; this package is for local verification only.");
