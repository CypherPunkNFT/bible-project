// Reads what each main page shows, the way a visitor's browser does, and saves it for the release step to write as a
// ready-made copy for search engines that do not run the page's code (scripts/seo/build.ts). Run it on the LIVE site
// (the default), so the copies match what is published:
//   node --experimental-strip-types scripts/seo/capture.ts [--base <origin>] [--only <path prefix>] [--fresh]
// Resumable: a page already captured is skipped unless --fresh. Writes content/seo/pages/<page>.json (in git).
import { mkdirSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "playwright";
import { sitePages } from "./pages.ts";

export interface Block { tag: "h1" | "h2" | "h3" | "h4" | "p" | "li"; text: string }
export interface Capture {
  path: string; capturedAt: string; base: string;
  title: string; heading: string; paragraph: string;
  blocks: Block[]; links: { path: string; text: string }[];
}

const args = process.argv.slice(2);
const option = (name: string) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const base = (option("--base") ?? "https://bibleguide.io").replace(/\/+$/, "");
const only = option("--only");
const fresh = args.includes("--fresh");
const OUT = path.resolve(import.meta.dirname, "../../content/seo/pages");
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
    title: document.title,
    heading: flat(main?.querySelector("h1")?.innerText ?? ""),
    paragraph: [...(main?.querySelectorAll("p") ?? [])].map((p) => flat(p.innerText)).find((t) => t.length >= 60) ?? "",
    blocks, links: [...links].map(([linkPath, text]) => ({ path: linkPath, text })),
  };
}

async function capture(page: Page, pagePath: string): Promise<Capture | string> {
  await page.goto(base + pagePath, { waitUntil: "load", timeout: 60000 });
  // Lazy pages show a loading screen first; wait for real text, then a moment for late sections.
  await page.waitForFunction(() => (document.getElementById("main")?.innerText.trim().length ?? 0) > 40 && !document.querySelector("[data-page-loading]"), null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  const shown = await page.evaluate(readPage);
  if (shown.heading === NOT_FOUND_HEADING) return "page not found";
  if (shown.finalPath !== pagePath) return `goes to ${shown.finalPath}`;
  if (shown.blocks.length < 2) return `only ${shown.blocks.length} block of text`;
  return { path: pagePath, capturedAt: new Date().toISOString(), base, title: shown.title, heading: shown.heading, paragraph: shown.paragraph, blocks: shown.blocks as Block[], links: shown.links };
}

if (import.meta.main) {
  mkdirSync(OUT, { recursive: true });
  const all = (await sitePages()).filter((p) => p.prerender && (!only || p.path.startsWith(only)));
  const todo = all.filter((p) => fresh || !existsSync(captureFile(p.path)));
  console.log(`${all.length} pages to have; ${todo.length} to capture from ${base}; ${readdirSync(OUT).length} files already in content/seo/pages`);
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  const skipped: string[] = [];
  let done = 0;
  const queue = [...todo];
  await Promise.all(Array.from({ length: WORKERS }, async () => {
    const page = await context.newPage();
    for (let item = queue.shift(); item; item = queue.shift()) {
      try {
        const result = await capture(page, item.path);
        if (typeof result === "string") skipped.push(`${item.path}: ${result}`);
        else writeFileSync(captureFile(item.path), JSON.stringify(result, null, 1) + "\n", "utf8");
      } catch (error) {
        skipped.push(`${item.path}: ${String(error).split("\n")[0]}`);
      }
      if (++done % 50 === 0) console.log(`  ${done}/${todo.length}`);
    }
  }));
  await browser.close();
  console.log(`captured ${todo.length - skipped.length}, skipped ${skipped.length}`);
  for (const line of skipped) console.log("  skipped " + line);
}
