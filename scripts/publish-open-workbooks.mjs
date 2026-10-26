// Puts the downloaded open workbooks on the site: copies each held file (Research/Resources/OpenWorkbooks/files/)
// into public/learning/open/<id>/, prints each Project Gutenberg book from its HTML to one PDF with a credit page in
// front, and writes src/data/resources/open-workbooks.json, the list the learning page's doors read.
// A file over Cloudflare Pages' 25 MiB limit is not copied; the page links to the maker's own copy instead.
//
//   node scripts/publish-open-workbooks.mjs
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const SITE = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOME = join(SITE, "../Research/Resources/OpenWorkbooks");
const HELD = join(HOME, "files");
const OUT = join(SITE, "public/learning/open");
const DATA = join(SITE, "src/data/resources/open-workbooks.json");
const COUNT = join(SITE, "src/data/resources/open-workbooks-count.json");
const MAX_BYTES = 25 * 1024 * 1024;

const table = JSON.parse(readFileSync(join(HOME, "open-workbooks.json"), "utf8"));
const rows = table.filter((r) => r.status === "downloaded");
// Approved titles that are web pages or picture libraries rather than files: shown with a link to the maker's own pages.
const linked = table.filter((r) => r.status === "approved" && r.linkOnly);
const escape = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const label = (name) => name.replace(/\.[a-z0-9]+$/i, "").replace(/^\d+_/, "").replace(/_English(_CB)?$/, "").replace(/[_-]+/g, " ").trim();

function findHtml(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) { const found = findHtml(full); if (found) return found; }
    else if (/\.html?$/i.test(entry.name)) return full;
  }
  return null;
}

/** One Gutenberg book, printed from its own HTML, with a page in front saying where it is from. */
async function printGutenberg(browser, row, zip, target) {
  const work = join(tmpdir(), `open-workbook-${row.id}`);
  rmSync(work, { recursive: true, force: true });
  execFileSync("unzip", ["-oq", zip, "-d", work]);
  const html = findHtml(work);
  if (!html) throw new Error(`${row.id}: no HTML file inside ${zip}`);
  const page = await browser.newPage();
  await page.goto(pathToFileURL(html).href, { waitUntil: "load" });
  await page.evaluate(({ title, by, credit }) => {
    const front = document.createElement("section");
    front.style.cssText = "page-break-after:always;font-family:Georgia,serif;text-align:center;padding-top:30vh";
    front.innerHTML = `<h1 style="font-size:28pt;margin:0 0 12pt;text-align:center">${title}</h1><p style="font-size:14pt;margin:0 0 48pt;text-align:center;text-indent:0">${by}</p><p style="font-size:10pt;color:#444;max-width:30em;margin:0 auto;text-align:center;text-indent:0">${credit}</p>`;
    document.body.prepend(front);
  }, { title: escape(row.title), by: escape(row.author), credit: escape(`${row.rights.creditLine} Printed to PDF from the Project Gutenberg edition, whose licence follows the text. Shared free by Bible Guide (bibleguide.io).`) });
  await page.pdf({ path: target, format: "Letter", margin: { top: "0.8in", bottom: "0.8in", left: "0.9in", right: "0.9in" }, printBackground: true });
  await page.close();
  rmSync(work, { recursive: true, force: true });
}

/** The SOURCES.md section for these files, rewritten between its markers (added at the top the first time). */
function registerSources(held) {
  const path = join(SITE, "SOURCES.md"), start = "<!-- open-workbooks:start -->", end = "<!-- open-workbooks:end -->";
  const cell = (s) => String(s ?? "").replace(/\|/g, "/").replace(/\s+/g, " ").trim();
  const sum = (files) => createHash("sha256").update(files.map((f) => `${f.name} ${f.sha256}`).sort().join("\n")).digest("hex").slice(0, 16);
  const body = [start, `## Open workbooks — registered ${new Date().toISOString().slice(0, 10)} (local preview only; nothing published)`, "",
    "Free study materials made by other people whose own terms let anyone share them, handed out on the learning page's doors with their makers' credit. The table, with the exact wording that allows sharing, is `Research/Resources/OpenWorkbooks/open-workbooks.json`; files are held in `Research/Resources/OpenWorkbooks/files/` (manifest.json there has every file's URL, size and SHA-256), fetched by `scripts/fetch-open-workbooks.py` and placed by `scripts/publish-open-workbooks.mjs`. Checksum: the first 16 hex of a SHA-256 over that title's sorted `name sha256` lines.", "",
    "| Title | By | Licence | Files / bytes | Checksum |", "|---|---|---|---|---|",
    ...held.map((r) => `| [${cell(r.title)}](${r.sourcePage}) | ${cell(r.author || r.publisher)} | ${cell(r.rights.licence)} | ${r.files.length} / ${r.files.reduce((n, f) => n + f.bytes, 0).toLocaleString("en-US")} | ${sum(r.files)} |`),
    "", end].join("\n");
  const text = readFileSync(path, "utf8");
  const at = text.indexOf(start), to = text.indexOf(end);
  writeFileSync(path, at >= 0 && to > at ? text.slice(0, at) + body + text.slice(to + end.length) : `${body}\n\n${text}`, "utf8");
}

const browser = await chromium.launch({ channel: "msedge" });
const list = [], notHosted = [];
try {
  for (const row of rows) {
    const dir = join(OUT, row.id);
    mkdirSync(dir, { recursive: true });
    const files = [];
    for (const f of row.files) {
      const held = join(HELD, row.id, f.name);
      if (!existsSync(held)) throw new Error(`${row.id}: ${f.name} is in the table but not in ${HELD}`);
      if (/-h\.zip$/.test(f.name)) {
        const pdf = `${row.id}.pdf`;
        if (!existsSync(join(dir, pdf))) await printGutenberg(browser, row, held, join(dir, pdf));
        files.push({ href: `/learning/open/${row.id}/${pdf}`, label: "PDF", bytes: statSync(join(dir, pdf)).size, kind: "pdf" });
        continue;
      }
      const kind = f.name.split(".").pop().toLowerCase();
      if (f.bytes > MAX_BYTES) { notHosted.push(`${row.id}/${f.name} (${(f.bytes / 1e6).toFixed(0)} MB)`); files.push({ href: f.url, label: label(f.name), bytes: f.bytes, kind, external: true }); continue; }
      copyFileSync(held, join(dir, f.name));
      files.push({ href: `/learning/open/${row.id}/${f.name}`, label: kind === "epub" ? "EPUB e-book" : label(f.name), bytes: f.bytes, kind });
    }
    files.sort((a, b) => Number(b.kind === "pdf") - Number(a.kind === "pdf")); // the printable PDF first, an e-book after it
    const { title, author, publisher, doors, ages, kind, subjects, description, pages, sessions, sourcePage, series } = row;
    const { basis, licence, licenceUrl, creditLine, conditions } = row.rights;
    list.push({ id: row.id, title, author, publisher, doors, ages, kind, subjects, description, pages, sessions, series, sourcePage, rights: { basis, licence, licenceUrl, creditLine, conditions }, files });
    console.log(`${row.id}: ${files.length} file(s)`);
  }
  for (const row of linked) {
    const { id, title, author, publisher, doors, ages, kind, subjects, description, pages, sessions, series, sourcePage } = row;
    const { basis, licence, licenceUrl, creditLine, conditions } = row.rights;
    list.push({ id, title, author, publisher, doors, ages, kind, subjects, description, pages, sessions, series, sourcePage, rights: { basis, licence, licenceUrl, creditLine, conditions }, files: [], linkOnly: row.linkOnly });
  }
} finally {
  await browser.close();
}
writeFileSync(DATA, JSON.stringify(list, null, 1) + "\n", "utf8");
// The Resources front page counts the shelf from this small file, so it never loads the whole list above.
writeFileSync(COUNT, JSON.stringify({ titles: list.filter((w) => w.files.length > 0).length }) + "\n", "utf8");
registerSources(rows);
console.log(`\n${list.length} titles written to src/data/resources/open-workbooks.json`);
if (notHosted.length) console.log(`${notHosted.length} file(s) over 25 MiB, linked to the maker's copy instead:\n  ${notHosted.join("\n  ")}`);
