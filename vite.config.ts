import { defineConfig, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from "node:fs";
import path from "node:path";

// The CypherPunk NFT site's toolchain. Local only: dev on 8930, the always-on preview
// (scripts/start-preview.ps1) on 8931; browser checks start their own preview on 8932.

const DATA_DIR = path.resolve(__dirname, "data");
const TYPES: Record<string, string> = { ".json": "application/json; charset=utf-8", ".tsv": "text/tab-separated-values; charset=utf-8" };

// The generated Bible data (~250 MB, scripts/build-data.py) is served straight from data/ instead of
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
    response.setHeader("Content-Type", TYPES[path.extname(file)]);
    response.setHeader("Cache-Control", "public, max-age=3600");
    fs.createReadStream(file).pipe(response);
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
  plugins: [react(), dataPlugin],
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
