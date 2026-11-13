import { cp, mkdir, mkdtemp, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { build } from "esbuild";
import { existsSync } from "node:fs";
import path from "node:path";
import { verifyBuiltContent } from "./content/compile.ts";
import { addressLanguages, LANGUAGE_ADDRESSES_RELEASED } from "../src/lib/language-addresses.ts";
import {preparePopulationHosting} from './prepare-population-hosting.mjs';
import {pruneReleaseAssets} from './prune-release-assets.mjs';
import { splitReleaseFiles } from "./release-splits.mjs";
import { packPersonFiles } from "./pack-person-files.ts";
import { assertTranslatedFilesUnderLimit, packLanguageFiles, splitQuestionBanks } from "./pack-language-files.ts";
import { packReaderData } from "./pack-reader-data.mjs";
import { assertPublishedBibles } from "./published-bibles.mjs";
import { LIST_FOLDER, phraseFolders, preparePhraseLists } from "./phrase-lists.mjs";
import { assertOnlyReleasedTranslations, assertTranslationsComplete, packTranslatedPeople, unreleasedTranslationEntries } from "./release-translations.ts";
import { assertFullCheckPassed } from "./full-check-gate.mjs";
import { assertPreReleaseCheckPassed } from "./prerelease-gate.mjs";
import { releasedFolders } from "../src/lib/site-languages.ts";

// Produces a fresh deployable directory. Never creates a cloud resource or deploys it.
const started = Date.now();
const stage = (name: string) => console.log(`[${Math.round((Date.now() - started) / 1000)}s] ${name}`);
const databaseId = process.env.TESTIMONY_D1_ID;
const siteUrl = new URL(process.env.PUBLIC_SITE_URL ?? "https://bible-project-4af.pages.dev");
if (siteUrl.protocol !== "https:" || siteUrl.username || siteUrl.password || /^(localhost|127\.|\[::1\])/.test(siteUrl.hostname)) throw new Error("PUBLIC_SITE_URL must be the HTTPS website origin.");
if (databaseId && (!/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(databaseId) || databaseId.startsWith("00000000-"))) throw new Error("TESTIMONY_D1_ID must be the real Cloudflare database ID.");
// BUILT_SITE: a finished build when dist/ could not be swapped (the preview server holds it open).
const built = process.env.BUILT_SITE ?? "dist";
await stat(path.join(built, "index.html")); await stat("data/catalog.json"); await stat("data/topics/chapters/GEN.json"); // chapters: scripts/build-chapter-topics.py
// The phone app's Bible downloads (data/bibles/v1, App/scripts/publish-bibles.py): every version with a whole file.
const publishedBibles = assertPublishedBibles(path.resolve("data"));
console.log(`Bible downloads: ${publishedBibles.versions} versions, ${(publishedBibles.bytes / 1e6).toFixed(1)} MB`);
// The translation pre-release check (scripts/prerelease-gate.mjs): no English left unregistered, the English build check
// and the quick check pass. Then the full check must have read exactly this build and data and judge it clean.
assertPreReleaseCheckPassed();
stage("Translation pre-release check passed");
const fullCheck = assertFullCheckPassed(built, { data: path.resolve("data"), languages: releasedFolders() });
stage(fullCheck.passed === false ? "Translation full check FAILED (warn-only, release goes on)" : "Translation full check passed");
const apologeticsContentHash = verifyBuiltContent();
await mkdir(".release", { recursive: true });
// Each copy is ~5.7 GB and nothing removes them: 62 had built up by 2026-10-21. Say so; deleting is the owner's call.
const oldCopies = (await readdir(".release")).filter((name) => /^testimonies-[A-Za-z0-9]{6}$/.test(name));
if (oldCopies.length >= 3) console.warn(`Warning: ${oldCopies.length} earlier release copies in .release/ (about ${Math.round(oldCopies.length * 5.7)} GB). Ask the owner before deleting them.`);
const directory = await mkdtemp(path.resolve(".release/testimonies-"));
const site = path.join(directory, "site");
// data_acquisition: the local desk's files (scripts/data-intake-vite.ts), never published.
const localDesk = path.resolve(built, "data_acquisition");
// The preview's copies of the main pages at their language addresses (es.html, es/…: scripts/seo/language-copies.ts)
// stay behind; the search-engine step below makes them for this release, and only once the owner has released them.
const languageCopies = addressLanguages().flatMap((language) => [path.resolve(built, language.folder!), path.resolve(built, `${language.folder}.html`)]);
await cp(built, site, { recursive: true, filter: (source) => ![localDesk, ...languageCopies].includes(path.resolve(source)) });
stage("Build copied");
await preparePopulationHosting(path.join(site,'content/scholar-population'),{omitOriginals:true});
stage("Population hosting");
// The scholars index and the source directory ship split, as build:portable does (scripts/release-splits.mjs; was a
// hand step after prepare until 2026-11-12).
console.log("Release splits:", splitReleaseFiles(site));
stage("Scholars index and source directory split");
console.log('Release build assets:',await pruneReleaseAssets(site));
stage("Code files pruned");
// dereference: follow links/junctions (a clean release worktree links data/ in), never ship a link.
// data/graph (scripts/build-graph.py) feeds only the local connections mock-up; it stays out until the owner approves it.
const graphData = path.resolve("data", "graph");
// data/i18n (content/translation/apply.py): the translated copies, published 2026-11-02; refused unless complete.
console.log("Translations:", await assertTranslationsComplete(path.resolve("data")));
// data/text and data/xref (42,000 files) are not copied: the reader packs below read them where they are and write only the groups.
const packedData = [path.resolve("data", "text"), path.resolve("data", "xref")];
// Languages not marked released in src/lib/site-languages.ts, and anything else in data/i18n, stay on this computer.
const unreleasedTranslations = await unreleasedTranslationEntries(path.resolve("data"));
// The small phrase lists (scripts/phrase-lists.mjs) are made for the code they serve, so the release makes its own below.
const phraseLists = phraseFolders(path.resolve("data", "i18n")).map((folder) => path.resolve("data", "i18n", folder, LIST_FOLDER));
if (unreleasedTranslations.length) console.log("Translations left out (not released):", unreleasedTranslations.map((entry) => path.basename(entry)).join(", "));
await cp("data", path.join(site, "data"), { recursive: true, dereference: true, filter: (source) => ![graphData, ...packedData, ...unreleasedTranslations, ...phraseLists].includes(path.resolve(source)) });
stage("Data copied");
// One file per person would push the release past 20,000 files; the release copy gets packs instead.
console.log("Person packs:", await packPersonFiles(site));
console.log("Translated person packs:", await packTranslatedPeople(site));
console.log("Translations in the release:", await assertOnlyReleasedTranslations(site));
stage("Person packs");
// The question bank in parts and each language's content files in packs (about 100 files a language, not 850), and no
// translated file over 25 MiB (translation system job 29). After the people packs, before the phrase lists and content stamp.
console.log("Question bank parts:", await splitQuestionBanks(site, releasedFolders()));
console.log("Language packs:", await packLanguageFiles(site, releasedFolders()));
console.log("Largest translated file:", await assertTranslatedFilesUnderLimit(site, releasedFolders()));
stage("Language packs");
// Each language's phrase list split for this release's own code, and the pages stamped with a hash of the lists, so a
// browser keeps them until they change. Before the search-engine copies, which are made from index.html.
const phrases = preparePhraseLists(site);
console.log(`Phrase lists: for ${phrases.build}, ${Object.keys(phrases.folders).join(", ")}; ${phrases.coreKeys} core phrases, ${phrases.groups} parts each; stamp ${phrases.stamp} in ${phrases.stampedPages} page(s)`);
if (!phrases.stampedPages) throw new Error("Phrase lists: no page carries the /*phrase-stamp*/ marker; was index.html's language script changed?");
stage("Phrase lists");
// After the person packs, so the content stamp covers them. Only for a front end that reads the grouped layout.
const bundles = (await readdir(path.join(site, "assets"))).filter((name) => name.endsWith(".js"));
if (!(await Promise.all(bundles.map((name) => readFile(path.join(site, "assets", name), "utf8")))).some((code) => code.includes("xrefChunk"))) throw new Error("This build cannot read grouped chapter files (no xrefChunk in its scripts); rebuild before preparing a release.");
console.log("Reader packs:", await packReaderData(site, path.resolve("data")));
stage("Reader packs");
await cp("migrations", path.join(directory, "migrations"), { recursive: true });
// The Worker's code sits beside the site folder, so it is never served as a file.
const worker = path.join(directory, "worker");
const compiler = spawnSync(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "pages", "functions", "build", "--outdir", path.join(worker, "functions")], { stdio: "inherit" });
if (compiler.status !== 0) throw new Error("Pages Function compilation failed.");
for (const file of ["site-worker.mjs", "byte-ranges.mjs"]) await cp(path.join("server", file), path.join(worker, file));
// The live quiz's room (docs/features/live-quiz/design.md 6.3): its Durable Object and the game code it imports from
// src/lib/live-quiz/, bundled into one file beside site-worker.mjs, which re-exports it.
await build({ entryPoints: ["server/live-quiz/room.ts"], bundle: true, format: "esm", platform: "neutral", external: ["cloudflare:workers"], outfile: path.join(worker, "live-quiz-room.mjs"), logLevel: "warning" });
stage("Worker compiled");
await cp("public/_headers", path.join(site, "_headers"));
// The atlas map (STREET_ATLAS.md): its manifest, the current version's 24 MiB pieces, label fonts and icons.
// Lives on F: via the AtlasTiles junction; ATLAS_TILES_DIR overrides (e.g. when preparing from a clean worktree).
const atlas = process.env.ATLAS_TILES_DIR ?? path.resolve(import.meta.dirname, "../../AtlasTiles/site");
const atlasManifest = JSON.parse(await readFile(path.join(atlas, "bible-atlas.json"), "utf8")) as { version: string; chunks: number };
for (const part of ["bible-atlas.json", atlasManifest.version, "fonts", "sprites"]) await cp(path.join(atlas, part), path.join(site, "atlas-tiles", part), { recursive: true, dereference: true });
stage("Atlas copied");
// The meaning-search pack (MEANING_SEARCH.md): its manifest and the current version's files, built by scripts/build-meaning-pack.py.
const meaning = process.env.MEANING_PACK_DIR ?? path.resolve(import.meta.dirname, "../../MeaningPack/site");
const meaningManifest = JSON.parse(await readFile(path.join(meaning, "meaning.json"), "utf8")) as { version: string };
for (const part of ["meaning.json", meaningManifest.version]) await cp(path.join(meaning, part), path.join(site, "search-model", part), { recursive: true, dereference: true });
stage("Meaning search copied");
// Search engines (scripts/seo/build.ts): the sitemap, and ready-made copies of the main pages. Last, so it counts every
// other file against the 20,000 limit. Runs under bun because the page inventory it reads does.
const seo = spawnSync("bun", ["scripts/seo/build.ts", JSON.stringify(site)], { stdio: "inherit", shell: true });
if (seo.status !== 0) throw new Error("The search-engine step failed (bun scripts/seo/build.ts).");
const strayCopies = addressLanguages().flatMap((language) => [language.folder!, `${language.folder}.html`]).filter((name) => existsSync(path.join(site, name)));
if (!LANGUAGE_ADDRESSES_RELEASED && strayCopies.length) throw new Error(`The language addresses are not released (src/lib/language-addresses.ts), but the release holds ${strayCopies.join(", ")}.`);
stage("Search-engine pages built");
const files = await readdir(site, { recursive: true, withFileTypes: true });
if (files.some((entry) => entry.isSymbolicLink())) throw new Error("The release contains a link instead of files; copy with dereference.");
if (files.filter((entry) => entry.isFile()).length > 100000) throw new Error("The release exceeds Cloudflare Workers' 100,000-file limit.");
for (const entry of files.filter((entry) => entry.isFile())) {
  const file = path.join(entry.parentPath, entry.name);
  if ((await stat(file)).size > 25 * 1024 * 1024) throw new Error(`Cloudflare Workers refuses files over 25 MiB: ${file}`);
}
stage("Files checked");
const routes = JSON.parse(await readFile("public/_routes.json", "utf8")) as { include: string[] };
if (databaseId) {
  const config = {
    name: "bible-project", main: "./worker/site-worker.mjs", compatibility_date: "2026-10-04", compatibility_flags: ["nodejs_compat"],
    // The live address is a route, not a Worker custom domain: bibleguide.io keeps its DNS record, which a custom domain would refuse.
    ...(siteUrl.hostname === "bibleguide.io" ? { workers_dev: false, preview_urls: false, routes: [{ pattern: "bibleguide.io/*", zone_name: "bibleguide.io" }] } : { workers_dev: true }),
    assets: { directory: "./site", binding: "ASSETS", not_found_handling: "single-page-application", html_handling: "auto-trailing-slash", run_worker_first: [...routes.include, "/atlas-tiles/*", "/circles/*"] },
    vars: { PUBLIC_SITE_URL: siteUrl.origin },
    d1_databases: [{ binding: "DB", database_name: "bible-testimonies", database_id: databaseId, migrations_dir: "./migrations" }],
    // The live quiz's rooms, one Durable Object per game code (worker/live-quiz-room.mjs).
    durable_objects: { bindings: [{ name: "LIVE_QUIZ", class_name: "LiveQuizRoom" }] },
    migrations: [{ tag: "live-quiz-v1", new_sqlite_classes: ["LiveQuizRoom"] }],
  };
  await writeFile(path.join(directory, "wrangler.jsonc"), JSON.stringify(config, null, 2) + "\n");
}
await writeFile(path.join(directory, "release.json"), JSON.stringify({ siteUrl: siteUrl.origin, databaseConfigured: Boolean(databaseId), apologeticsContentHash, fullCheck, files: files.filter((entry) => entry.isFile()).length, routes }, null, 2) + "\n");
console.log("Release prepared at " + directory);
if (fullCheck.passed === false) console.warn("\nWARNING (repeated): the translation full check did NOT pass. " + fullCheck.warning + "\n");
stage("Finished");
console.log(databaseId ? "Database configured. Apply migrations and deploy this directory using the README launch steps." : "No cloud database is configured. Set TESTIMONY_D1_ID and prepare again before deployment; this package is for local verification only.");
