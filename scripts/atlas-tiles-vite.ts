import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream";
import type { Connect, Plugin } from "vite";

// Bulk data served straight from disk, never copied into dist/ (Cloudflare Pages refuses files over 25 MiB; the release
// step copies the pieces in). Byte ranges are supported. Two folders:
// - /atlas-tiles/: the atlas map (24 MiB pieces), fonts and icons from ../AtlasTiles/site (a junction to F:). STREET_ATLAS.md.
// - /search-model/: the meaning-search pack (model, engine, fingerprints) from ../MeaningPack/site. MEANING_SEARCH.md.

interface DataDir { prefix: string; dir: string; types: Record<string, string>; missing: string }

const ATLAS: DataDir = {
  prefix: "/atlas-tiles/",
  dir: path.resolve(process.env.ATLAS_TILES_DIR ?? path.resolve(__dirname, "../../AtlasTiles/site")),
  types: { ".pmtiles": "application/octet-stream", ".pbf": "application/x-protobuf", ".json": "application/json; charset=utf-8", ".png": "image/png", ".bin": "application/octet-stream" },
  missing: "is F: connected and the atlas built? see AtlasTiles/README.md",
};
const MEANING: DataDir = {
  prefix: "/search-model/",
  dir: path.resolve(process.env.MEANING_PACK_DIR ?? path.resolve(__dirname, "../../MeaningPack/site")),
  types: { ".json": "application/json; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".wasm": "application/wasm", ".onnx": "application/octet-stream", ".i8": "application/octet-stream", ".part": "application/octet-stream" },
  missing: "meaning pack not built? run scripts/build-meaning-pack.py",
};

/** Content type by extension; numbered pieces ("x.onnx_data.part001") count as ".part". */
const typeOf = (data: DataDir, file: string) => data.types[/\.part\d{3}$/.test(file) ? ".part" : path.extname(file)];

function fail(response: import("node:http").ServerResponse, status: number, message: string) {
  response.statusCode = status;
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.end(message);
}

/** "bytes=start-end" -> inclusive [start, end] within the file, or null when unsatisfiable. */
function parseRange(header: string, size: number): [number, number] | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (!match[1] && !match[2])) return null;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  return start <= end && start < size ? [start, end] : null;
}

function serveDir(data: DataDir): Connect.NextHandleFunction {
  return (request, response, next) => {
    const url = request.url ?? "";
    if (!url.startsWith(data.prefix)) return next();
    let relative: string;
    try {
      relative = decodeURIComponent(url.slice(data.prefix.length).split("?")[0]);
    } catch {
      return fail(response, 404, `not found: ${url} (malformed address)`);
    }
    const file = path.resolve(data.dir, relative);
    if (!file.startsWith(data.dir + path.sep) || !typeOf(data, file)) return fail(response, 404, `not found: ${url}`);
    let stat: fs.Stats;
    try {
      stat = fs.statSync(file);
    } catch {
      // Data missing (F: unplugged, not built yet): a plain 404 the page reports, never index.html.
      return fail(response, 404, `not found: ${url} (${data.missing})`);
    }
    response.setHeader("Content-Type", typeOf(data, file));
    response.setHeader("Accept-Ranges", "bytes");
    response.setHeader("Cache-Control", "public, max-age=3600");
    response.setHeader("ETag", `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`);
    let start = 0;
    let end = stat.size - 1;
    if (request.headers.range) {
      const range = parseRange(request.headers.range, stat.size);
      if (!range) {
        response.setHeader("Content-Range", `bytes */${stat.size}`);
        return fail(response, 416, `range not satisfiable: ${request.headers.range} (file is ${stat.size} bytes)`);
      }
      [start, end] = range;
      response.statusCode = 206;
      response.setHeader("Content-Range", `bytes ${start}-${end}/${stat.size}`);
    }
    response.setHeader("Content-Length", end - start + 1);
    if (request.method === "HEAD") return response.end();
    pipeline(fs.createReadStream(file, { start, end }), response, (error) => {
      if (!error) return;
      console.error(`${data.prefix}: could not send ${file} bytes ${start}-${end}`, error);
      if (!response.headersSent) fail(response, 503, `${data.prefix} unavailable`);
      else response.destroy(); // never a truncated 200/206
    });
  };
}

/** Serves the atlas map and the meaning-search pack from disk in dev and preview. */
export function atlasTilesPlugin(): Plugin {
  return {
    name: "atlas-tiles",
    configureServer(server) {
      server.middlewares.use(serveDir(ATLAS));
      server.middlewares.use(serveDir(MEANING));
    },
    configurePreviewServer(server) {
      server.middlewares.use(serveDir(ATLAS));
      server.middlewares.use(serveDir(MEANING));
    },
  };
}
