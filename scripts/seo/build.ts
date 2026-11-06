// The search-engine files of a release, written into its site folder by the release prepare step
// (scripts/prepare-testimonies-release.ts) or by hand:  bun scripts/seo/build.ts <site folder>
//   sitemap.xml + sitemaps/<n>.xml   every public page (scripts/seo/pages.ts)
//   <page>.html                      a ready-made copy of each main page captured by scripts/seo/capture.ts: the release's
//                                    own index.html with that page's title, description and official address, and the
//                                    page's text and links inside #root (replaced by the app as soon as it starts)
//   home.html + _redirects           the home page's copy; index.html itself stays the plain shell, because Cloudflare
//                                    serves it for every address without a file of its own
//   <folder>.html, <folder>/<page>.html   once the owner releases the language addresses (src/lib/language-addresses.ts):
//                                    the main pages in each language (language-copies.ts), at most 99 files, and the
//                                    English copies and the sitemap name them; until then none of this is written
// Cloudflare Workers refuses a release over 100,000 files, so copies stop at FILE_BUDGET and the step says how many were
// left out; the language copies (at most 99) come on top, still under the limit.
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { addressLanguages, isAddressedPage, LANGUAGE_ADDRESSES_RELEASED, languageAddress } from "../../src/lib/language-addresses.ts";
import { SITE_ORIGIN } from "../../src/lib/page-head.ts";
import { writeLanguageCopies } from "./language-copies.ts";
import { sitePages, type SitePage } from "./pages.ts";
import { escape, readyMade, type Capture } from "./shell.ts";

export { readyMade };

const FILE_BUDGET = 99500;
const SITEMAP_SIZE = 40000;
const WEBSITE = path.resolve(import.meta.dirname, "../..");
const CAPTURES = path.join(WEBSITE, "content/seo/pages");

export const readyMadeFile = (site: string, pagePath: string) => pagePath === "/" ? path.join(site, "home.html") : path.join(site, ...pagePath.slice(1).split("/")) + ".html";

function countFiles(directory: string): number {
  return readdirSync(directory, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile()).length;
}

/** sitemap.xml and its parts, listing every page and, once released, each main page's language addresses. */
function writeSitemaps(site: string, pages: SitePage[], addresses: boolean): string[] {
  const urls = pages.map((page) => SITE_ORIGIN + page.path);
  if (addresses) for (const page of pages.filter((p) => isAddressedPage(p.path))) for (const language of addressLanguages()) urls.push(SITE_ORIGIN + languageAddress(page.path, language.folder!));
  const chunks: string[][] = [];
  for (let i = 0; i < urls.length; i += SITEMAP_SIZE) chunks.push(urls.slice(i, i + SITEMAP_SIZE));
  mkdirSync(path.join(site, "sitemaps"), { recursive: true });
  chunks.forEach((part, i) => writeFileSync(path.join(site, "sitemaps", `${i + 1}.xml`), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${part.map((url) => `<url><loc>${escape(url)}</loc></url>`).join("\n")}\n</urlset>\n`, "utf8"));
  writeFileSync(path.join(site, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${chunks.map((_, i) => `<sitemap><loc>${SITE_ORIGIN}/sitemaps/${i + 1}.xml</loc></sitemap>`).join("\n")}\n</sitemapindex>\n`, "utf8");
  return ["sitemap.xml", ...chunks.map((_, i) => `sitemaps/${i + 1}.xml`)];
}

/** The English copies, as many as the file budget allows. */
function writeEnglishCopies(site: string, shell: string, pages: SitePage[], captures: Map<string, Capture>, addresses: boolean) {
  let files = countFiles(site);
  const wrote: string[] = [];
  const leftOut: string[] = [];
  for (const page of pages.filter((p) => p.prerender)) {
    const capture = captures.get(page.path);
    if (!capture) continue;
    const file = readyMadeFile(site, page.path);
    if (existsSync(file) || existsSync(path.join(file.slice(0, -5), "index.html"))) { leftOut.push(`${page.path} (a real file is there)`); continue; }
    if (files >= FILE_BUDGET) { leftOut.push(`${page.path} (file budget)`); continue; }
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, readyMade(shell, capture, addresses), "utf8");
    wrote.push(path.relative(site, file).split(path.sep).join("/"));
    files++;
  }
  return { wrote, leftOut };
}

function readCaptures(): Map<string, Capture> {
  const captures = new Map<string, Capture>();
  for (const name of existsSync(CAPTURES) ? readdirSync(CAPTURES) : []) {
    const capture = JSON.parse(readFileSync(path.join(CAPTURES, name), "utf8")) as Capture;
    captures.set(capture.path, capture);
  }
  return captures;
}

/** `addresses`: whether the language addresses go out (the owner's switch, src/lib/language-addresses.ts). Off, the
 * release's search-engine files are exactly as before them. */
export async function buildSeo(site: string, { addresses = LANGUAGE_ADDRESSES_RELEASED }: { addresses?: boolean } = {}) {
  // Safe to run again on the same folder: the files a run wrote are listed beside the site folder and replaced.
  const record = path.join(site, "..", "seo-files.txt");
  if (existsSync(record)) {
    for (const file of readFileSync(record, "utf8").split("\n").filter(Boolean)) if (existsSync(path.join(site, file))) unlinkSync(path.join(site, file));
  }
  const shell = readFileSync(path.join(site, "index.html"), "utf8");
  const captures = readCaptures();
  // A page the inventory does not list is published only once a capture has seen it on the live site.
  const pages = (await sitePages()).filter((page) => page.template !== "hub" || captures.has(page.path));
  const sitemaps = writeSitemaps(site, pages, addresses);
  const english = writeEnglishCopies(site, shell, pages, captures, addresses);
  // Every language version a page names must exist: a missing capture or a file in the way stops the release.
  const languages = addresses ? writeLanguageCopies(site, WEBSITE, true).written : [];
  const redirects = path.join(site, "_redirects");
  const rewrite = "/ /home 200\n";
  if (captures.has("/") && !(existsSync(redirects) && readFileSync(redirects, "utf8").includes(rewrite))) appendFileSync(redirects, rewrite, "utf8");
  writeFileSync(record, [...sitemaps, ...english.wrote, ...languages].join("\n") + "\n", "utf8");
  const missing = pages.filter((p) => p.prerender && !captures.has(p.path)).length;
  console.log(`SEO: sitemap of ${pages.length.toLocaleString("en-US")} pages in ${sitemaps.length - 1} files; ${english.wrote.length} ready-made pages; ${addresses ? `${languages.length} language copies` : "language addresses not released"}; ${missing} main pages not captured yet (bun scripts/seo/capture.ts)`);
  if (english.leftOut.length) console.warn(`SEO: ${english.leftOut.length} ready-made pages left out:\n  ${english.leftOut.slice(0, 20).join("\n  ")}`);
  return { pages: pages.length, written: english.wrote.length, languageCopies: languages.length, leftOut: english.leftOut.length };
}

if (import.meta.main) {
  const site = process.argv[2];
  if (!site || !existsSync(path.join(site, "index.html"))) throw new Error(`seo build: give the release's site folder (with index.html); got ${site ?? "nothing"}`);
  await buildSeo(path.resolve(site));
}
