// Downloads the Atlas's satellite pictures ONCE: NASA Blue Marble Next Generation (public domain, ~500 m per
// pixel), cut by NASA's GIBS image service and already in the site's web-Mercator projection.
//   - region: the whole map area (every place + margin), as a light preview and an overview
//   - tiles:  Italy to Persia, Yemen to the Black Sea, at close to native detail, in 12 tiles the page loads
//             only when zoomed in and only where the view is
// Raw responses are kept, never edited, in <sources>/nasa-bluemarble/ (see scripts/bible/paths.py); the page uses copies in public/atlas/
// and src/data/atlas-imagery.json says where each one sits. The site never calls NASA at run time.
//   node scripts/fetch-imagery.mjs        (run scripts/build-map.mjs first: it defines the map area)
import { geoMercator } from "d3-geo";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const map = JSON.parse(readFileSync(new URL("../src/data/atlas-map.json", import.meta.url), "utf8"));
const projection = geoMercator().scale(map.scale).translate(map.translate);
const [regionWest, regionNorth] = projection.invert([0, 0]);
const [regionEast, regionSouth] = projection.invert([map.width, map.height]);
const region = { west: regionWest, east: regionEast, south: regionSouth, north: regionNorth };
const core = { west: 8, east: 58, south: 13, north: 46 };

// The close-up is a 4 x 3 grid of tiles (2,500 px each, ~10,000 px across the core) so the page loads and
// draws only the tiles on screen, instead of one 10,000 px picture (~310 MB once decoded).
const COLUMNS = 4;
const ROWS = 3;
const tiles = [];
for (let row = 0; row < ROWS; row++) {
  for (let column = 0; column < COLUMNS; column++) {
    const west = core.west + ((core.east - core.west) * column) / COLUMNS;
    const east = core.west + ((core.east - core.west) * (column + 1)) / COLUMNS;
    const north = core.north - ((core.north - core.south) * row) / ROWS;
    const south = core.north - ((core.north - core.south) * (row + 1)) / ROWS;
    tiles.push({ file: `bluemarble-tile-${row}-${column}.jpg`, bounds: { west, east, south, north }, width: 2500, role: "tile" });
  }
}

const LAYERS = [
  { file: "bluemarble-region-preview.jpg", bounds: region, width: 1500, role: "preview" },
  { file: "bluemarble-region.jpg", bounds: region, width: 5000, role: "overview" },
  ...tiles,
];

// EPSG:3857 metres (the same spherical Mercator d3 draws).
const R = 6378137;
const toX = (lon) => (R * lon * Math.PI) / 180;
const toY = (lat) => R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

function requestUrl({ bounds, width }) {
  const height = Math.round((width * (toY(bounds.north) - toY(bounds.south))) / (toX(bounds.east) - toX(bounds.west)));
  const bbox = [toX(bounds.west), toY(bounds.south), toX(bounds.east), toY(bounds.north)].map((v) => v.toFixed(2)).join(",");
  return (
    "https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0" +
    `&LAYERS=BlueMarble_NextGeneration&STYLES=&CRS=EPSG:3857&BBOX=${bbox}&WIDTH=${width}&HEIGHT=${height}&FORMAT=image/jpeg`
  );
}

/** NASA's service occasionally drops a connection; try each picture three times before giving up. */
async function fetchWithRetry(url, name, attempts = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url);
      const type = response.headers.get("content-type") ?? "";
      if (!response.ok || !type.startsWith("image/jpeg")) {
        throw new Error(`GIBS answered ${response.status} ${type}: ${(await response.text()).slice(0, 300)}`);
      }
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      if (attempt >= attempts) throw new Error(`fetch-imagery: ${name} failed after ${attempts} tries: ${error.message}`);
      console.warn(`fetch-imagery: ${name} try ${attempt} failed (${error.message}); retrying`);
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }
}

// Same rule as scripts/bible/paths.py: BIBLE_SOURCES, else sources/ inside the repository, else ../sources.
const site = new URL("../", import.meta.url);
const sourcesRoot = process.env.BIBLE_SOURCES
  ? pathToFileURL(`${process.env.BIBLE_SOURCES.replace(/[\\/]$/, "")}/`)
  : existsSync(new URL("sources/", site))
    ? new URL("sources/", site)
    : new URL("../sources/", site);
const sourceDir = new URL("nasa-bluemarble/", sourcesRoot);
const publicDir = new URL("../public/atlas/", import.meta.url);
mkdirSync(sourceDir, { recursive: true });
mkdirSync(publicDir, { recursive: true });
const manifest = [];
const requests = [];
for (const layer of LAYERS) {
  const url = requestUrl(layer);
  const image = await fetchWithRetry(url, layer.file);
  writeFileSync(new URL(layer.file, sourceDir), image);
  writeFileSync(new URL(layer.file, publicDir), image);
  // Where the picture sits in map units, so the page can place it.
  const [x0, y0] = projection([layer.bounds.west, layer.bounds.north]);
  const [x1, y1] = projection([layer.bounds.east, layer.bounds.south]);
  manifest.push({ file: `/atlas/${layer.file}`, role: layer.role, x: x0, y: y0, width: x1 - x0, height: y1 - y0 });
  requests.push(`${layer.file}\n${url}`);
  const hash = createHash("sha256").update(image).digest("hex").slice(0, 16);
  console.log(`${layer.file}: ${layer.width} px, ${(image.length / 1e6).toFixed(1)} MB, sha256 ${hash}`);
}
writeFileSync(new URL("../src/data/atlas-imagery.json", import.meta.url), JSON.stringify(manifest, null, 1));
writeFileSync(new URL("REQUEST.txt", sourceDir), `fetched ${new Date().toISOString()}\n\n${requests.join("\n\n")}\n`);
