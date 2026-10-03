// Downloads the Atlas's satellite pictures ONCE: NASA Blue Marble Next Generation (public domain, ~500 m per
// pixel), cut by NASA's GIBS image service and already in the site's web-Mercator projection.
//   - region: the whole map area (every place + margin), as a light preview and an overview
//   - core:   Italy to Persia, Yemen to the Black Sea, at close to native detail (loaded only when zoomed in)
// Raw responses are kept, never edited, in ../sources/nasa-bluemarble/; the page uses copies in public/atlas/
// and src/data/atlas-imagery.json says where each one sits. The site never calls NASA at run time.
//   node scripts/fetch-imagery.mjs        (run scripts/build-map.mjs first: it defines the map area)
import { geoMercator } from "d3-geo";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const map = JSON.parse(readFileSync(new URL("../src/data/atlas-map.json", import.meta.url), "utf8"));
const projection = geoMercator().scale(map.scale).translate(map.translate);
const [regionWest, regionNorth] = projection.invert([0, 0]);
const [regionEast, regionSouth] = projection.invert([map.width, map.height]);
const region = { west: regionWest, east: regionEast, south: regionSouth, north: regionNorth };
const core = { west: 8, east: 58, south: 13, north: 46 };

const LAYERS = [
  { file: "bluemarble-region-preview.jpg", bounds: region, width: 1600, role: "preview" },
  { file: "bluemarble-region.jpg", bounds: region, width: 8000, role: "overview" },
  { file: "bluemarble-core.jpg", bounds: core, width: 10000, role: "detail" },
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

const sourceDir = new URL("../../sources/nasa-bluemarble/", import.meta.url);
const publicDir = new URL("../public/atlas/", import.meta.url);
mkdirSync(sourceDir, { recursive: true });
mkdirSync(publicDir, { recursive: true });
const manifest = [];
const requests = [];
for (const layer of LAYERS) {
  const url = requestUrl(layer);
  const response = await fetch(url);
  const type = response.headers.get("content-type") ?? "";
  if (!response.ok || !type.startsWith("image/jpeg")) {
    throw new Error(`fetch-imagery: GIBS answered ${response.status} ${type} for ${layer.file}: ${(await response.text()).slice(0, 300)}`);
  }
  const image = Buffer.from(await response.arrayBuffer());
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
