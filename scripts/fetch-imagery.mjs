// Downloads the Atlas's satellite picture ONCE: NASA Blue Marble Next Generation (public domain, ~500 m per
// pixel), cut by NASA's GIBS image service to exactly the map's square, already in the site's web-Mercator
// projection. The raw response is kept, never edited, in ../sources/nasa-bluemarble/; the page uses copies
// in public/atlas/. No runtime dependency: the site never calls NASA.
//   node scripts/fetch-imagery.mjs [width]        (default 10000 px; a 2000 px preview is always made too)
import { geoMercator } from "d3-geo";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const map = JSON.parse(readFileSync(new URL("../src/data/atlas-map.json", import.meta.url), "utf8"));
const projection = geoMercator().scale(map.scale).translate(map.translate);
const [west, north] = projection.invert([0, 0]);
const [east, south] = projection.invert([map.width, map.height]);

// EPSG:3857 metres for the corners of the map's square (the same spherical Mercator d3 draws).
const R = 6378137;
const toX = (lon) => (R * lon * Math.PI) / 180;
const toY = (lat) => R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const bbox = [toX(west), toY(south), toX(east), toY(north)].map((v) => v.toFixed(2)).join(",");

const LAYER = "BlueMarble_NextGeneration";
const url = (width) =>
  "https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0" +
  `&LAYERS=${LAYER}&STYLES=&CRS=EPSG:3857&BBOX=${bbox}&WIDTH=${width}&HEIGHT=${Math.round((width * map.height) / map.width)}` +
  "&FORMAT=image/jpeg";

async function fetchImage(width) {
  const response = await fetch(url(width));
  const type = response.headers.get("content-type") ?? "";
  if (!response.ok || !type.startsWith("image/jpeg")) {
    throw new Error(`fetch-imagery: GIBS answered ${response.status} ${type} for width ${width}: ${(await response.text()).slice(0, 300)}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

const width = Number(process.argv[2] ?? 10000);
const sourceDir = new URL("../../sources/nasa-bluemarble/", import.meta.url);
const publicDir = new URL("../public/atlas/", import.meta.url);
mkdirSync(sourceDir, { recursive: true });
mkdirSync(publicDir, { recursive: true });
console.log(`square: lon ${west.toFixed(3)}..${east.toFixed(3)}, lat ${south.toFixed(3)}..${north.toFixed(3)}`);
for (const [name, size] of [["bluemarble-preview.jpg", 2000], ["bluemarble.jpg", width]]) {
  const image = await fetchImage(size);
  writeFileSync(new URL(name, sourceDir), image);
  writeFileSync(new URL(name, publicDir), image);
  console.log(`${name}: ${size} px wide, ${(image.length / 1e6).toFixed(1)} MB, sha256 ${createHash("sha256").update(image).digest("hex").slice(0, 16)}`);
}
writeFileSync(new URL("REQUEST.txt", sourceDir), `${url(width)}\nlayer ${LAYER}, fetched ${new Date().toISOString()}\n`);
