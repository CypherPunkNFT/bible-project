import { defineConfig, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream";
import zlib from "node:zlib";
import { testimonyApiPlugin } from "./scripts/testimony-vite";
import { studyContentPlugin } from "./scripts/content/vite";

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
  server: { host: "127.0.0.1", port: 8930, strictPort: true },
  preview: { host: "127.0.0.1", port: 8931, strictPort: true },
  plugins: [studyContentPlugin(), react(), dataPlugin, testimonyApiPlugin()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          motion: ["framer-motion"],
          d3: ["d3-geo", "d3-zoom", "d3-selection", "d3-transition", "d3-scale", "d3-shape", "d3-hierarchy", "topojson-client"],
        },
      },
    },
  },
});
