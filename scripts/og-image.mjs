// Photographs the link-preview designs (src/dev/og/) at exactly 1200 × 630, 1×.
//   node scripts/og-image.mjs --preview          -> every design, into .local/og-preview/ (to compare; never published)
//   node scripts/og-image.mjs <design> <name.png> -> that one design, into public/<name.png> (a NEW name each time:
//                                                    apps remember previews by address)
// Compiles the designs first (src/dev/og/vite.og.config.ts, into .local/og-dist) and serves them on a private port.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, ".local/og-dist");
const [first, second] = process.argv.slice(2);
const preview = first === "--preview";
if (!preview && !(first && second && /^[a-z0-9-]+\.png$/.test(second))) {
  console.error("usage: node scripts/og-image.mjs --preview | <design id> <new-file-name.png>");
  process.exit(1);
}
if (!preview && existsSync(path.join(root, "public", second))) {
  console.error(`public/${second} already exists: use a new name, because apps keep showing the old picture for an old address`);
  process.exit(1);
}

execFileSync(process.execPath, [path.join(root, "node_modules/vite/bin/vite.js"), "build", "-c", "src/dev/og/vite.og.config.ts", "--logLevel", "warn"], { cwd: root, stdio: "inherit" });
copyFileSync(path.join(root, "public/favicon.svg"), path.join(dist, "favicon.svg"));

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff" };
const server = http.createServer((request, response) => {
  const file = path.join(dist, decodeURIComponent(new URL(request.url, "http://x").pathname));
  if (!file.startsWith(dist) || !existsSync(file)) { response.writeHead(404).end(); return; }
  response.writeHead(200, { "Content-Type": types[path.extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}/src/dev/og/og.html`;

const { chromium } = await import("@playwright/test");
const browser = await chromium.launch({ channel: "msedge" });
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 }, deviceScaleFactor: 1 });
  const ids = preview ? await (async () => { await page.goto(base); return page.$$eval(".og-picker a", (links) => links.map((a) => new URL(a.href).searchParams.get("design"))); })() : [first];
  const outDir = preview ? path.join(root, ".local/og-preview") : path.join(root, "public");
  mkdirSync(outDir, { recursive: true });
  for (const id of ids) {
    await page.goto(`${base}?design=${id}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const card = page.locator(`[data-og="${id}"]`);
    if (!(await card.count())) throw new Error(`no design called "${id}"`);
    const box = await card.boundingBox();
    if (Math.round(box.width) !== 1200 || Math.round(box.height) !== 630) throw new Error(`${id} is ${box.width} × ${box.height}, not 1200 × 630`);
    const file = path.join(outDir, preview ? `${id}.png` : second);
    await card.screenshot({ path: file, scale: "css" });
    console.log(`${id}: ${path.relative(root, file)}`);
  }
} finally {
  await browser.close();
  server.close();
}
