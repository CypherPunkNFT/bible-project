import { defineConfig, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream";
import zlib from "node:zlib";
import { testimonyApiPlugin } from "./scripts/testimony-vite";
import { studyContentPlugin } from "./scripts/content/vite";
import { atlasTilesPlugin } from "./scripts/atlas-tiles-vite";
import { designReviewPlugin } from "./scripts/design-review/vite-plugin";
import { localLibraryPlugin } from "./scripts/local-library-vite";
import { dataIntakePlugin } from "./scripts/data-intake-vite";
import { dataAnalysisPlugin } from "./scripts/data-analysis-vite";
import { dataQuestionsPlugin } from "./scripts/data-questions-vite";
import { dataGrantsPlugin } from "./scripts/data-grants-vite";

// The CypherPunk NFT site's toolchain. Local only: dev on 8930, the always-on preview
// (scripts/start-preview.ps1) on 8931; browser checks start their own preview on 8932.

const DATA_DIR = path.resolve(__dirname, "data");
const TYPES: Record<string, string> = { ".json": "application/json; charset=utf-8", ".tsv": "text/tab-separated-values; charset=utf-8" };

// The generated Bible data (~400 MB, scripts/build-data.py) is served straight from data/ instead of
// being copied into dist/ on every build. A missing file is a real 404 — never the app's index.html —
// so the reader can say "not in this version" instead of failing to parse HTML as JSON.
function serveData(): Connect.NextHandleFunction {
  return (request, response, next) => {
    const url = request.url ?? "";
    if (!url.startsWith("/data/")) return next();
    const relative = decodeURIComponent(url.slice("/data/".length).split("?")[0]);
    const file = path.resolve(DATA_DIR, relative);
    if (!file.startsWith(DATA_DIR + path.sep) || !TYPES[path.extname(file)] || !fs.existsSync(file)) {
      response.statusCode = 404;
      response.setHeader("Content-Type", "text/plain; charset=utf-8");
      response.end(`not found: /data/${relative}`);
      return;
    }
    let stat: fs.Stats;
    try {
      stat = fs.statSync(file);
    } catch (error) {
      console.error(`data: could not read ${file}`, error); // removed mid-rebuild
      response.statusCode = 503;
      response.end();
      return;
    }
    const etag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
    response.setHeader("Content-Type", TYPES[path.extname(file)]);
    response.setHeader("Cache-Control", "public, max-age=3600");
    response.setHeader("ETag", etag);
    response.setHeader("Last-Modified", stat.mtime.toUTCString());
    response.setHeader("Vary", "Accept-Encoding");
    // Unchanged since the browser's copy (the catalogue is fetched with no-cache): no body at all.
    if (request.headers["if-none-match"] === etag) {
      response.statusCode = 304;
      response.end();
      return;
    }
    if (request.method === "HEAD") {
      response.setHeader("Content-Length", stat.size);
      response.end();
      return;
    }
    // JSON shrinks about five times compressed; tiny files are not worth it.
    const gzip = stat.size >= 1024 && /\bgzip\b/.test(String(request.headers["accept-encoding"] ?? ""));
    if (gzip) response.setHeader("Content-Encoding", "gzip");
    // A file locked or removed mid-rebuild must fail this one request, never the always-on server. pipeline closes
    // every stream (the open file too) when the browser goes away.
    const done = (error: NodeJS.ErrnoException | null) => {
      if (!error) return;
      console.error(`data: could not send ${file}`, error);
      if (!response.headersSent) {
        response.removeHeader("Content-Encoding");
        response.statusCode = 503;
        response.end();
      } else {
        response.destroy(); // never a truncated 200
      }
    };
    if (gzip) pipeline(fs.createReadStream(file), zlib.createGzip(), response, done);
    else pipeline(fs.createReadStream(file), response, done);
  };
}

// Meaning search loads its own 14 MB ONNX Runtime engine from the meaning pack (src/lib/meaning/engine.ts). Bundling
// transformers.js would also copy onnxruntime-web's 27 MB default engine into dist/, unused and over Cloudflare Pages'
// 25 MiB per-file limit, so it is left out of the build.
const dropUnusedOrtEngine: Plugin = {
  name: "drop-unused-ort-engine",
  generateBundle(_options, bundle) {
    for (const name of Object.keys(bundle)) if (/ort-wasm[\w.-]*\.wasm$/.test(name)) delete bundle[name];
  },
};

// Every page sets text in these two fonts (load scan, 2026-10-20); preloading them starts the download with the page
// instead of after the stylesheet has been read, so text settles sooner on a first visit.
const PRELOAD_FONTS = [/^assets\/literata-latin-opsz-normal-[\w-]+\.woff2$/, /^assets\/archivo-latin-wght-normal-[\w-]+\.woff2$/];
const preloadPageFonts: Plugin = {
  name: "preload-page-fonts",
  transformIndexHtml(_html, context) {
    if (!context.bundle) return;
    const names = Object.keys(context.bundle);
    return PRELOAD_FONTS.map((pattern) => {
      const name = names.find((candidate) => pattern.test(candidate));
      if (!name) throw new Error(`Font preload: no built file matches ${pattern}; update PRELOAD_FONTS to the fonts the site now uses.`);
      return { tag: "link", attrs: { rel: "preload", href: `/${name}`, as: "font", type: "font/woff2", crossorigin: "" }, injectTo: "head" as const };
    });
  },
};

// Design mock-ups (design/<name>/index.html) on the local preview only, at /mockups/<name>/. They live in design/, which
// is never built or deployed, so a rebuild cannot wipe them the way a copy inside dist/ was wiped.
const DESIGN_DIR = path.resolve(__dirname, "design");
const MOCKUP_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".json": "application/json; charset=utf-8",
};
const mockupsPlugin: Plugin = {
  name: "design-mockups",
  configurePreviewServer(server) {
    server.middlewares.use((request, response, next) => {
      const url = (request.url ?? "").split("?")[0];
      if (!url.startsWith("/mockups/")) return next();
      let relative = decodeURIComponent(url.slice("/mockups/".length));
      if (relative === "" || relative.endsWith("/")) relative += "index.html";
      const file = path.resolve(DESIGN_DIR, relative);
      if (!file.startsWith(DESIGN_DIR + path.sep) || !MOCKUP_TYPES[path.extname(file)] || !fs.existsSync(file)) {
        response.statusCode = 404;
        response.setHeader("Content-Type", "text/plain; charset=utf-8");
        response.end(`no mock-up file: design/${relative}`);
        return;
      }
      response.setHeader("Content-Type", MOCKUP_TYPES[path.extname(file)]);
      response.setHeader("Cache-Control", "no-cache");
      pipeline(fs.createReadStream(file), response, (error) => {
        if (error) { console.error(`mockups: could not send ${file}`, error); response.destroy(); }
      });
    });
  },
};

// A build writes into its own folder and swaps it in for dist/ only once it is complete: the always-on preview serves
// dist/, and emptying it at the start of a build gave every page a 404 for the ~50 s the build took (owner, 2026-10-23).
// A build that keeps old files (emptyOutDir: false, build-portable.mjs --preserve-output) still writes into dist/.
const DIST = path.resolve(__dirname, "dist");
const STAGE = path.resolve(__dirname, `.dist-next-${process.pid}`), OLD = path.resolve(__dirname, `.dist-old-${process.pid}`);
const pause = (ms: number) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
/** Renames a folder, retrying while Windows holds it (the preview may be sending a file from it). */
function renameHeld(from: string, to: string) {
  for (let attempt = 1; ; attempt++) {
    try { fs.renameSync(from, to); return; } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (attempt >= 40 || !["EPERM", "EBUSY", "EACCES"].includes(code ?? "")) throw new Error(`swap-in build: could not rename ${from} to ${to} (${code}, attempt ${attempt})`, { cause: error });
      pause(250);
    }
  }
}
function swapIn() {
  if (!fs.existsSync(path.join(STAGE, "index.html"))) throw new Error(`swap-in build: ${STAGE} has no index.html; dist/ left as it was`);
  if (fs.existsSync(DIST)) renameHeld(DIST, OLD);
  try { renameHeld(STAGE, DIST); } catch (error) { renameHeld(OLD, DIST); throw error; }
  fs.rmSync(OLD, { recursive: true, force: true, maxRetries: 5 }); // the previous build: regenerated by any build
}
let staging = false, written = false;
const swapInBuild: Plugin = {
  name: "swap-in-build",
  apply: "build",
  config(config) {
    staging = config.build?.emptyOutDir !== false && !config.build?.outDir;
    return staging ? { build: { outDir: STAGE, emptyOutDir: true } } : undefined;
  },
  writeBundle() { written = true; },
  closeBundle() {
    if (!staging) return;
    if (written) swapIn();
    else fs.rmSync(STAGE, { recursive: true, force: true, maxRetries: 5 }); // the build failed: dist/ is untouched
  },
};

const dataPlugin: Plugin = {
  name: "bible-data",
  configureServer(server) {
    server.middlewares.use(serveData());
  },
  configurePreviewServer(server) {
    server.middlewares.use(serveData());
  },
};

export default defineConfig({
  // The scratch folders hold millions of snapshot files (.local alone 2.46M, 2026-10-21); watching them grew each dev
  // server to ~10 GB and it never served a page. Vite adds these to its own defaults (.git, node_modules). The
  // question sources' downloads (content/questions/sources/, 1.5 GB) are never read by the site, so not watched either.
  server: { host: "127.0.0.1", port: 8930, strictPort: true, watch: { ignored: ["**/.local/**", "**/.release/**", "**/.output/**", "**/.wrangler/**", "**/content/questions/sources/**"] } },
  preview: { host: "127.0.0.1", port: 8931, strictPort: true },
  plugins: [studyContentPlugin(), react(), dataAnalysisPlugin(__dirname), dataPlugin, mockupsPlugin, dataIntakePlugin(__dirname), dataQuestionsPlugin(__dirname), dataGrantsPlugin(__dirname), atlasTilesPlugin(), designReviewPlugin(), testimonyApiPlugin(), localLibraryPlugin(__dirname), dropUnusedOrtEngine, preloadPageFonts, swapInBuild],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    rollupOptions: {
      output: {
        // Shared pieces under 8 KB join a neighbouring file: a chapter page made ~10 requests of about 1 KB each.
        experimentalMinChunkSize: 8 * 1024,
        // Framer Motion is not grouped: as one file, the shell's reduced-motion setting pulled all 45 KB onto every page.
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          d3: ["d3-geo", "d3-zoom", "d3-selection", "d3-transition", "d3-scale", "d3-shape", "d3-hierarchy", "topojson-client"],
          // One icons file instead of dozens of tiny shared ones (2026-10-07: during a release the edge cached the
          // site's fallback page under three new icon-chunk names, and /assets/* is cached as immutable).
          icons: ["lucide-react"],
        },
      },
    },
  },
});
