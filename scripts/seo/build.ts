// The search-engine files of a release, written into its site folder by the release prepare step
// (scripts/prepare-testimonies-release.ts) or by hand:  bun scripts/seo/build.ts <site folder>
//   sitemap.xml + sitemaps/<n>.xml   every public page (scripts/seo/pages.ts)
//   <page>.html                      a ready-made copy of each main page captured by scripts/seo/capture.ts: the release's
//                                    own index.html with that page's title, description and official address, and the
//                                    page's text and links inside #root (replaced by the app as soon as it starts)
//   home.html + _redirects           the home page's copy; index.html itself stays the plain shell, because Cloudflare
//                                    serves it for every address without a file of its own
// Cloudflare refuses a release over 20,000 files, so copies stop at FILE_BUDGET and the step says how many were left out.
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { isUnnamed, pageHead, SITE_ORIGIN } from "../../src/lib/page-head.ts";
import type { Block, Capture } from "./capture.ts";
import { sitePages } from "./pages.ts";

const FILE_BUDGET = 19500;
const SITEMAP_SIZE = 40000;
const CAPTURES = path.resolve(import.meta.dirname, "../../content/seo/pages");
const HIDDEN = "position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);border:0";

const escape = (text: string) => text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function replaceOnce(html: string, pattern: RegExp, replacement: string, what: string): string {
  const matches = html.match(new RegExp(pattern.source, "g"))?.length ?? 0;
  if (matches !== 1) throw new Error(`seo build: expected one ${what} in index.html, found ${matches}; was the page shell changed?`);
  return html.replace(pattern, () => replacement);
}

function body(capture: Capture): string {
  const out: string[] = [];
  let list = false;
  for (const block of capture.blocks as Block[]) {
    if (block.tag === "li" && !list) { out.push("<ul>"); list = true; }
    if (block.tag !== "li" && list) { out.push("</ul>"); list = false; }
    out.push(`<${block.tag}>${escape(block.text)}</${block.tag}>`);
  }
  if (list) out.push("</ul>");
  const links = capture.links.map((link) => `<li><a href="${escape(link.path)}">${escape(link.text)}</a></li>`).join("");
  return `<div data-ready-made style="${HIDDEN}"><main>${out.join("")}</main><nav aria-label="Pages"><ul>${links}</ul></nav></div>`;
}

function readyMade(shell: string, capture: Capture): string {
  const head = pageHead(capture.path, { ...capture, subheading: capture.blocks.find((block) => block.tag === "h2")?.text });
  const title = isUnnamed(capture.title) ? head.title : capture.title;
  let html = shell;
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`, "title");
  html = replaceOnce(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escape(head.description)}" />`, "description");
  for (const [attribute, value] of [["property=\"og:title\"", title], ["name=\"twitter:title\"", title], ["property=\"og:description\"", head.description], ["name=\"twitter:description\"", head.description], ["property=\"og:url\"", head.canonical]]) {
    html = replaceOnce(html, new RegExp(`<meta ${attribute} content="[^"]*" />`), `<meta ${attribute} content="${escape(value)}" />`, attribute);
  }
  html = replaceOnce(html, /<\/head>/, `  <link rel="canonical" href="${escape(head.canonical)}" />\n  </head>`, "</head>");
  return replaceOnce(html, /<div id="root"><\/div>/, `<div id="root">${body(capture)}</div>`, "#root");
}

function countFiles(directory: string): number {
  return readdirSync(directory, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile()).length;
}

export async function buildSeo(site: string) {
  // Safe to run again on the same folder: the files a run wrote are listed beside the site folder and replaced.
  const record = path.join(site, "..", "seo-files.txt");
  if (existsSync(record)) {
    for (const file of readFileSync(record, "utf8").split("\n").filter(Boolean)) if (existsSync(path.join(site, file))) unlinkSync(path.join(site, file));
  }
  const shell = readFileSync(path.join(site, "index.html"), "utf8");
  const wrote: string[] = [];
  const captures = new Map<string, Capture>();
  for (const name of existsSync(CAPTURES) ? readdirSync(CAPTURES) : []) {
    const capture = JSON.parse(readFileSync(path.join(CAPTURES, name), "utf8")) as Capture;
    captures.set(capture.path, capture);
  }
  // A page the inventory does not list is published only once a capture has seen it on the live site.
  const pages = (await sitePages()).filter((page) => page.template !== "hub" || captures.has(page.path));

  const chunks: string[][] = [];
  for (let i = 0; i < pages.length; i += SITEMAP_SIZE) chunks.push(pages.slice(i, i + SITEMAP_SIZE).map((page) => SITE_ORIGIN + page.path));
  mkdirSync(path.join(site, "sitemaps"), { recursive: true });
  wrote.push("sitemap.xml", ...chunks.map((_, i) => `sitemaps/${i + 1}.xml`));
  chunks.forEach((urls, i) => writeFileSync(path.join(site, "sitemaps", `${i + 1}.xml`), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `<url><loc>${escape(url)}</loc></url>`).join("\n")}\n</urlset>\n`, "utf8"));
  writeFileSync(path.join(site, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${chunks.map((_, i) => `<sitemap><loc>${SITE_ORIGIN}/sitemaps/${i + 1}.xml</loc></sitemap>`).join("\n")}\n</sitemapindex>\n`, "utf8");

  let files = countFiles(site);
  let written = 0;
  const leftOut: string[] = [];
  for (const page of pages.filter((p) => p.prerender)) {
    const capture = captures.get(page.path);
    if (!capture) continue;
    const file = page.path === "/" ? path.join(site, "home.html") : path.join(site, ...page.path.slice(1).split("/")) + ".html";
    if (existsSync(file) || existsSync(path.join(file.slice(0, -5), "index.html"))) { leftOut.push(`${page.path} (a real file is there)`); continue; }
    if (files >= FILE_BUDGET) { leftOut.push(`${page.path} (file budget)`); continue; }
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, readyMade(shell, capture), "utf8");
    wrote.push(path.relative(site, file).split(path.sep).join("/"));
    files++;
    written++;
  }
  const redirects = path.join(site, "_redirects");
  const rewrite = "/ /home 200\n";
  if (captures.has("/") && !(existsSync(redirects) && readFileSync(redirects, "utf8").includes(rewrite))) appendFileSync(redirects, rewrite, "utf8");
  writeFileSync(record, wrote.join("\n") + "\n", "utf8");
  const missing = pages.filter((p) => p.prerender && !captures.has(p.path)).length;
  console.log(`SEO: sitemap of ${pages.length.toLocaleString("en-US")} pages in ${chunks.length} files; ${written} ready-made pages; ${missing} main pages not captured yet (bun scripts/seo/capture.ts)`);
  if (leftOut.length) console.warn(`SEO: ${leftOut.length} ready-made pages left out:\n  ${leftOut.slice(0, 20).join("\n  ")}`);
  return { pages: pages.length, written, leftOut: leftOut.length };
}

if (import.meta.main) {
  const site = process.argv[2];
  if (!site || !existsSync(path.join(site, "index.html"))) throw new Error(`seo build: give the release's site folder (with index.html); got ${site ?? "nothing"}`);
  await buildSeo(path.resolve(site));
}
