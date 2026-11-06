// Reads what each main page shows, the way a visitor's browser does, and saves it for the release step to write as a
// ready-made copy for search engines that do not run the page's code (scripts/seo/build.ts). Run it on the LIVE site
// (the default), so the copies match what is published:
//   node --experimental-strip-types scripts/seo/capture.ts [--base <origin>] [--only <path prefix>] [--fresh]
// Resumable: a page already captured is skipped unless --fresh. Writes content/seo/pages/<page>.json (in git).
// In a language (translation system, stage 5 job 18): the main pages with a language address (src/lib/language-addresses.ts),
// each opened at that address, into content/seo/languages/<folder>/ for language-copies.ts. Until the addresses are released
// they work only on this computer's preview, so capture from there, with no build running:
//   bun scripts/seo/capture.ts --base http://127.0.0.1:8931 --language es [--fresh]
import { mkdirSync, readdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "playwright";
import { addressLanguages, ADDRESSED_PAGES, languageAddress } from "../../src/lib/language-addresses.ts";
import { languageCaptureFile } from "./language-copies.ts";
import { sitePages } from "./pages.ts";

// What a capture holds (shell.ts, so the site's tests can read it without this browser script).
export type { Block, Capture } from "./shell.ts";
import type { Block, Capture } from "./shell.ts";

const args = process.argv.slice(2);
const option = (name: string) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const base = (option("--base") ?? "https://bibleguide.io").replace(/\/+$/, "");
const only = option("--only");
const fresh = args.includes("--fresh");
const WEBSITE = path.resolve(import.meta.dirname, "../..");
const OUT = path.join(WEBSITE, "content/seo/pages");
const folder = option("--language");
const language = folder === undefined ? undefined : addressLanguages().find((entry) => entry.folder === folder);
if (folder !== undefined && !language) throw new Error(`capture: --language must be one of ${addressLanguages().map((entry) => entry.folder).join(", ")}; got ${folder}`);
const WORKERS = 4;
const NOT_FOUND_HEADING = "Nothing is written here.";

export const captureFile = (pagePath: string) => path.join(OUT, (pagePath === "/" ? "index" : pagePath.slice(1).replaceAll("/", "__")) + ".json");

// Runs inside the page: the text a reader sees, in order, and every link to another page of the site.
function readPage() {
  const root = document.getElementById("root")!;
  const BLOCKS = "h1,h2,h3,h4,p,li,blockquote,figcaption,dt,dd,td,th";
  const visible = (el: Element) => !el.closest("svg,script,style,[aria-hidden='true'],[hidden]") && (el as HTMLElement).checkVisibility?.() !== false;
  const flat = (text: string) => text.replace(/\s+/g, " ").trim();
  const blocks: { tag: string; text: string }[] = [];
  let size = 0;
  for (const el of root.querySelectorAll(BLOCKS)) {
    if (el.querySelector(BLOCKS) || !visible(el)) continue;
    const text = flat((el as HTMLElement).innerText ?? "");
    if (text.length < 2 || blocks.at(-1)?.text === text) continue;
    const name = el.tagName.toLowerCase();
    blocks.push({ tag: /^h[1-4]$/.test(name) ? name : name === "li" ? "li" : "p", text });
    size += text.length;
    if (blocks.length >= 600 || size >= 60000) break;
  }
  const links = new Map<string, string>();
  for (const a of root.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !visible(a)) continue;
    const linkPath = url.pathname.replace(/\/+$/, "") || "/";
    const text = flat(a.innerText || a.getAttribute("aria-label") || a.title || "");
    if (text && !links.has(linkPath) && links.size < 400) links.set(linkPath, text.slice(0, 160));
  }
  const main = document.getElementById("main");
  return {
    finalPath: location.pathname.replace(/\/+$/, "") || "/",
    lang: document.documentElement.lang,
    description: document.head.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
    build: document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/"]')?.src.split("/assets/")[1] ?? "",
    title: document.title,
    heading: flat(main?.querySelector("h1")?.innerText ?? ""),
    paragraph: [...(main?.querySelectorAll("p") ?? [])].map((p) => flat(p.innerText)).find((t) => t.length >= 60) ?? "",
    blocks, links: [...links].map(([linkPath, text]) => ({ path: linkPath, text })),
  };
}

/** A page as a reader sees it; in a language (`code`, `folder`), opened at its language address, which the app drops. */
export async function capture(page: Page, pagePath: string, inLanguage?: { code: string; folder: string }): Promise<Capture | string> {
  await page.goto(base + (inLanguage ? languageAddress(pagePath, inLanguage.folder) : pagePath), { waitUntil: "load", timeout: 60000 });
  // Lazy pages show a loading screen first, and a translated page stays hidden until its words have loaded (its text
  // reads as empty until then); wait for real text, then a moment for late sections and words.
  await page.waitForFunction(() => (document.getElementById("main")?.innerText.trim().length ?? 0) > 40 && !document.querySelector("[data-page-loading]") && !document.documentElement.dataset.languageLoading, null, { timeout: 30000 });
  await page.waitForTimeout(inLanguage ? 3000 : 1500);
  const shown = await page.evaluate(readPage);
  if (shown.heading === NOT_FOUND_HEADING) return "page not found";
  if (shown.finalPath !== pagePath) return `goes to ${shown.finalPath}`;
  if (shown.blocks.length < 2) return `only ${shown.blocks.length} block of text`;
  if (inLanguage && shown.lang !== inLanguage.code) return `shown in "${shown.lang}", not ${inLanguage.code}`;
  const read = { path: pagePath, capturedAt: new Date().toISOString(), base, title: shown.title, heading: shown.heading, paragraph: shown.paragraph, blocks: shown.blocks as Block[], links: shown.links, description: shown.description };
  return inLanguage ? { ...read, language: inLanguage.code, build: shown.build } : read;
}

/** A language capture that still reads as English (its words had not loaded): title and heading both the English ones. */
function stillEnglish(read: Capture): boolean {
  const english = captureFile(read.path);
  if (!existsSync(english)) return false;
  const original = JSON.parse(readFileSync(english, "utf8")) as Capture;
  return read.title === original.title && read.heading === original.heading;
}

const fileFor = (pagePath: string) => (language ? languageCaptureFile(WEBSITE, language.folder!, pagePath) : captureFile(pagePath));
const building = () => existsSync(path.join(WEBSITE, ".dist-lock"));

if (import.meta.main) {
  const out = path.dirname(fileFor("/"));
  mkdirSync(out, { recursive: true });
  const inventory = language ? ADDRESSED_PAGES.map((pagePath) => ({ path: pagePath })) : (await sitePages()).filter((p) => p.prerender);
  const all = inventory.filter((p) => !only || p.path.startsWith(only));
  const todo = all.filter((p) => fresh || !existsSync(fileFor(p.path)));
  console.log(`${all.length} pages to have; ${todo.length} to capture from ${base}${language ? ` in ${language.code}` : ""}; ${readdirSync(out).length} files already in ${path.relative(WEBSITE, out)}`);
  if (language && building()) throw new Error("capture: a build is updating dist/ (.dist-lock); capture once it has finished");
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  const skipped: string[] = [];
  let done = 0;
  const queue = [...todo];
  await Promise.all(Array.from({ length: WORKERS }, async () => {
    const page = await context.newPage();
    for (let item = queue.shift(); item; item = queue.shift()) {
      try {
        const result = await capture(page, item.path, language ? { code: language.code, folder: language.folder! } : undefined);
        if (typeof result === "string") skipped.push(`${item.path}: ${result}`);
        else if (language && stillEnglish(result)) skipped.push(`${item.path}: still reads in English`);
        else writeFileSync(fileFor(item.path), JSON.stringify(result, null, 1) + "\n", "utf8");
      } catch (error) {
        skipped.push(`${item.path}: ${String(error).split("\n")[0]}`);
      }
      if (++done % 50 === 0) console.log(`  ${done}/${todo.length}`);
    }
  }));
  await browser.close();
  if (language && building()) console.warn("capture: a build started while capturing; check the captures' build names agree, or capture again with --fresh");
  console.log(`captured ${todo.length - skipped.length}, skipped ${skipped.length}`);
  for (const line of skipped) console.log("  skipped " + line);
}
