// The public build, served the way the live site serves it, for browser checks that must not run against the local
// preview: on ports 8930/8931 the local library answers work records and shelves itself (scripts/local_library.py
// keeps only a work's first language), which hid the crash on 3,769 works whose language is a list.
//
// Builds the site with the project's own config into e2e/.output/public-build/ (never dist/: the always-on preview
// serves that), without copying the 5 GB public/ folder, then serves it on 127.0.0.1:8935. A file is looked up in
// the build first, then in public/ (read only), then /data/ in data/; a missing file with an extension is a real 404
// and an address without one gets the app's index.html, as on Cloudflare Pages.
//   node e2e/serve-public-build.mjs            build, then serve
//   node e2e/serve-public-build.mjs --no-build serve the last build
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { pipeline } from "node:stream";
import { fileURLToPath } from "node:url";

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(SITE, "e2e", ".output", "public-build");
const PORT = 8935, HOST = "127.0.0.1";
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".woff2": "font/woff2", ".woff": "font/woff",
  ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml", ".wasm": "application/wasm",
  ".pmtiles": "application/octet-stream", ".bin": "application/octet-stream", ".zip": "application/zip",
  ".pdf": "application/pdf", ".mp3": "audio/mpeg", ".csv": "text/csv; charset=utf-8", ".tsv": "text/tab-separated-values; charset=utf-8",
};

if (!process.argv.includes("--no-build")) {
  const { build } = await import("vite");
  // outDir is given, so the config's swap-in step (which replaces dist/) stays off.
  await build({ root: SITE, configFile: path.join(SITE, "vite.config.ts"), logLevel: "warn", build: { outDir: OUT, emptyOutDir: true, copyPublicDir: false } });
}
if (!fs.existsSync(path.join(OUT, "index.html"))) throw new Error(`serve-public-build: no build in ${OUT}; run without --no-build`);

/** The file under root for this address, or null; never anything outside root. */
function inside(root, pathname) {
  const file = path.resolve(root, "." + pathname);
  const relative = path.relative(root, file);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return null;
  try { return fs.statSync(file).isFile() ? file : null; } catch { return null; }
}
function send(response, status, text) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(text);
}

http.createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") return send(response, 405, "GET and HEAD only");
  if (request.headers.host !== `${HOST}:${PORT}` && request.headers.host !== `localhost:${PORT}`) return send(response, 421, "wrong host");
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url ?? "/", `http://${HOST}`).pathname); } catch { return send(response, 400, "bad address"); }
  if (/[\\:\0]/.test(pathname) || pathname.split("/").includes("..")) return send(response, 400, "bad address");
  const roots = pathname.startsWith("/data/") ? [[path.join(SITE, "data"), pathname.slice("/data".length)]] : [[OUT, pathname], [path.join(SITE, "public"), pathname]];
  let file = null;
  for (const [root, relative] of roots) if ((file = inside(root, relative))) break;
  if (!file) {
    if (path.extname(pathname)) return send(response, 404, `not found: ${pathname}`);
    file = path.join(OUT, "index.html");
  }
  response.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream", "Content-Length": fs.statSync(file).size, "Cache-Control": "no-cache" });
  if (request.method === "HEAD") return response.end();
  pipeline(fs.createReadStream(file), response, error => { if (error && error.code !== "ERR_STREAM_PREMATURE_CLOSE") console.error(`serve-public-build: could not send ${file}`, error); });
}).listen(PORT, HOST, () => console.log(`public build on http://${HOST}:${PORT}`));
