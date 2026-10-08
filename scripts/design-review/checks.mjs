// Design review machine checks: the owner reviews LOOKS on samples; this checks BEHAVIOUR on every page of every type
// (design/review/instances.json from the inventory), at phone 400 and desktop 1440: the page opens, no hover-line jumps,
// no sideways scroll on a phone, no console errors or failed requests, no focus outline, no empty sections, no dead
// internal links. Run: bun run review:checks   (ONLY=<template[/variant]>, FRESH=1 to start over, WORKERS=<n>)
// Resumable: every page's result is appended to design/review/check-progress.jsonl as it finishes, so a stopped run
// (or the always-on preview restarting while another chat rebuilds) carries on where it was. Writes
// content/design-review/checks.json every 100 pages and at the end.
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BASE, launch, newContext, open, pool } from "./browser.mjs";
import { linkChecker } from "./link-check.mjs";
import { CHECKS, empty, focus, jumps, links, scroll } from "./page-checks.mjs";

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PROGRESS = path.join(SITE, "design", "review", "check-progress.jsonl");
const RESULT = path.join(SITE, "content", "design-review", "checks.json");
const WORKERS = Number(process.env.WORKERS ?? 6);
const ONLY = process.env.ONLY ?? "";
const MAX_LISTED = 50;

const { variants, valid } = JSON.parse(readFileSync(path.join(SITE, "design", "review", "instances.json"), "utf8"));
const checkLink = linkChecker(valid);
// REVIEW_COMMIT: the commit the site at BASE was built from (a clean worktree), when it is not this folder's HEAD.
const commit = process.env.REVIEW_COMMIT ?? execFileSync("git", ["rev-parse", "--short=8", "HEAD"], { cwd: SITE, encoding: "utf8" }).trim();
const selected = Object.entries(variants).filter(([key]) => !ONLY || ONLY.split(",").some((o) => key === o || key.startsWith(o + "/")));
const urls = [...new Set(selected.flatMap(([, v]) => v.urls))];
// FRESH=1 starts over; with ONLY it forgets only those page types' results (after changing them), keeping the rest.
if (process.env.FRESH && existsSync(PROGRESS)) {
  if (!ONLY) rmSync(PROGRESS);
  else {
    const redo = new Set(urls);
    const kept = readFileSync(PROGRESS, "utf8").split("\n").filter((line) => line.trim() && !redo.has(JSON.parse(line).url));
    writeFileSync(PROGRESS, kept.join("\n") + "\n", "utf8");
  }
}

const done = new Map(); // "url width" -> failures
let startedAt = new Date().toISOString();
if (existsSync(PROGRESS)) {
  for (const line of readFileSync(PROGRESS, "utf8").split("\n")) {
    if (!line.trim()) continue;
    const row = JSON.parse(line);
    if (row.startedAt) { startedAt = row.startedAt; continue; }
    done.set(`${row.url} ${row.width}`, row.failures);
  }
} else appendFileSync(PROGRESS, JSON.stringify({ startedAt, commit }) + "\n");

const work = [400, 1440].flatMap((width) => urls.map((url) => ({ url, width }))).filter((w) => !done.has(`${w.url} ${w.width}`));
console.log(`${urls.length.toLocaleString("en-US")} pages × 2 widths; ${work.length.toLocaleString("en-US")} still to check, ${WORKERS} at a time, on ${BASE}`);

function summarise(finished) {
  const results = Object.entries(variants).map(([key, v]) => {
    const [template, variant] = key.split("/");
    const failed = {}, failures = [];
    let checked = 0;
    for (const url of v.urls) {
      const rows = [400, 1440].map((width) => [width, done.get(`${url} ${width}`)]).filter(([, f]) => f);
      if (rows.length < 2) continue;
      checked++;
      const seen = new Set();
      for (const [width, list] of rows) for (const f of list) {
        if (!seen.has(f.check)) { failed[f.check] = (failed[f.check] ?? 0) + 1; seen.add(f.check); }
        if (failures.length < MAX_LISTED) failures.push({ url, width, check: f.check, detail: f.detail });
      }
    }
    return { template, variant, instances: v.instances, checked, coverage: v.coverage, failed, failures };
  });
  writeFileSync(RESULT, JSON.stringify({ schema: 1, commit, startedAt, finishedAt: finished ? new Date().toISOString() : null, base: BASE, checks: CHECKS, results }, null, 1) + "\n", "utf8");
}

/** A link to a file (a download such as a study's text), not a page: it must exist on the server. Checked once each. */
const isFile = (link) => /\.[a-z0-9]{2,5}$/i.test(new URL(link, "http://site").pathname);
const files = new Map();
function fileExists(context, link) {
  if (!files.has(link)) files.set(link, context.request.head(BASE + link).then((r) => r.ok() && !(r.headers()["content-type"] ?? "").includes("text/html")).catch(() => false));
  return files.get(link);
}

const browser = await launch();
const contexts = { 400: await newContext(browser, { width: 400, theme: "light" }), 1440: await newContext(browser, { width: 1440, theme: "light" }) };
let count = 0;

await pool(work, WORKERS, async ({ url, width }) => {
  const page = await contexts[width].newPage();
  const errors = [];
  const origin = new URL(BASE).origin;
  page.on("pageerror", (error) => errors.push(`script error: ${error.message.slice(0, 160)}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console error: ${message.text().slice(0, 160)}`); });
  page.on("requestfailed", (request) => {
    const reason = request.failure()?.errorText ?? "";
    if (!/ERR_ABORTED|NS_BINDING_ABORTED/.test(reason)) errors.push(`request failed: ${request.url().replace(origin, "")} (${reason})`);
  });
  page.on("response", (response) => { if (response.url().startsWith(origin) && response.status() >= 400) errors.push(`${response.status()} for ${response.url().replace(origin, "")}`); });
  const failures = [];
  try {
    await open(page, url, { quick: true });
    const add = (check, list) => list.forEach((detail) => failures.push({ check, detail }));
    add("jumps", await page.evaluate(jumps));
    if (width < 600) add("scroll", await page.evaluate(scroll));
    await page.keyboard.press("Tab"); // focus is now "visible", as for a keyboard user
    add("focus", await page.evaluate(focus));
    add("empty", await page.evaluate(empty));
    if (width < 600) {
      const found = await page.evaluate(links);
      const broken = found.filter((link) => !isFile(link)).map((link) => [link, checkLink(link)]).filter(([, why]) => why);
      for (const link of found.filter(isFile)) if (!(await fileExists(contexts[width], link))) broken.push([link, "the file is missing"]);
      add("links", broken.slice(0, 6).map(([link, why]) => `${link}: ${why}`));
    }
    add("errors", [...new Set(errors)].slice(0, 5));
  } catch (error) {
    failures.push({ check: "loads", detail: String(error.message ?? error).slice(0, 200) });
  } finally {
    await page.close().catch(() => null);
  }
  done.set(`${url} ${width}`, failures);
  appendFileSync(PROGRESS, JSON.stringify({ url, width, failures }) + "\n");
  if (++count % 100 === 0) { summarise(false); console.log(`${count.toLocaleString("en-US")} of ${work.length.toLocaleString("en-US")}`); }
});
await browser.close();
summarise(true);

const bad = [...done.values()].filter((f) => f.length).length;
console.log(`finished: ${done.size.toLocaleString("en-US")} page views checked, ${bad.toLocaleString("en-US")} with a problem; ${path.relative(SITE, RESULT)}`);
