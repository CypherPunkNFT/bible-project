import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream";
import type { Connect, Plugin } from "vite";

// The street-level atlas (/study/places/mockup2) reads a ~2.5 GB map file plus its label fonts and icons from
// ../AtlasTiles/site (a junction to F:, built by scripts/build-street-atlas.py). Like data/, it is served
// straight from disk and never copied into dist/ — Cloudflare Pages refuses files over 25 MB. The map
// library asks for byte ranges of the one file, so ranges are supported. Production: AtlasTiles/README.md.

const SITE_DIR = path.resolve(process.env.ATLAS_TILES_DIR ?? path.resolve(__dirname, "../../AtlasTiles/site"));
const PREFIX = "/atlas-tiles/";
const TYPES: Record<string, string> = {
  ".pmtiles": "application/octet-stream",
  ".pbf": "application/x-protobuf",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
};

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

function serveAtlasTiles(): Connect.NextHandleFunction {
  return (request, response, next) => {
    const url = request.url ?? "";
    if (!url.startsWith(PREFIX)) return next();
    let relative: string;
    try {
      relative = decodeURIComponent(url.slice(PREFIX.length).split("?")[0]);
    } catch {
      return fail(response, 404, `not found: ${url} (malformed address)`);
    }
    const file = path.resolve(SITE_DIR, relative);
    if (!file.startsWith(SITE_DIR + path.sep) || !TYPES[path.extname(file)]) return fail(response, 404, `not found: ${url}`);
    let stat: fs.Stats;
    try {
      stat = fs.statSync(file);
    } catch {
      // F: unplugged or the map not built yet: a plain 404 the page reports, never index.html.
      return fail(response, 404, `not found: ${url} (is F: connected and the atlas built? see AtlasTiles/README.md)`);
    }
    response.setHeader("Content-Type", TYPES[path.extname(file)]);
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
      console.error(`atlas-tiles: could not send ${file} bytes ${start}-${end}`, error);
      if (!response.headersSent) fail(response, 503, "atlas tiles unavailable");
      else response.destroy(); // never a truncated 200/206
    });
  };
}

export function atlasTilesPlugin(): Plugin {
  return {
    name: "atlas-tiles",
    configureServer(server) {
      server.middlewares.use(serveAtlasTiles());
    },
    configurePreviewServer(server) {
      server.middlewares.use(serveAtlasTiles());
    },
  };
}
