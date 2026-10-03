// Pre-draws the Atlas's land outline once: the detailed (1:10m) world land clipped to the area holding every
// place on the map (data/places.json, so run scripts/build-data.py first) plus a margin for the edge fade,
// projected and written as one SVG path in src/data/atlas-map.json.
//   node scripts/build-map.mjs
import { geoArea, geoBounds, geoMercator, geoPath } from "d3-geo";
import { readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";

const WIDTH = 1000;
// Degrees added around the outermost places (Tarshish, India, Sheba, Ashkenaz) so they sit inside the fade.
// Extra Atlantic on the west so Tarshish (Spain) can be flown to the middle of the view; a little more
// room on the other sides for the same reason (India, Sheba, Ashkenaz).
const MARGIN = { west: 11, east: 6, south: 4, north: 4 };
const places = JSON.parse(readFileSync(new URL("../data/places.json", import.meta.url), "utf8"));
if (!Array.isArray(places) || places.length === 0) throw new Error("build-map: data/places.json is empty; run scripts/build-data.py first");
const WEST = Math.floor(Math.min(...places.map((p) => p.lon)) - MARGIN.west);
const EAST = Math.ceil(Math.max(...places.map((p) => p.lon)) + MARGIN.east);
const SOUTH = Math.floor(Math.min(...places.map((p) => p.lat)) - MARGIN.south);
const NORTH = Math.ceil(Math.max(...places.map((p) => p.lat)) + MARGIN.north);
// The map is exactly the area: its height follows the area's Mercator proportions.
const unit = geoMercator();
const [x0, y0] = unit([WEST, NORTH]);
const [x1, y1] = unit([EAST, SOUTH]);
const HEIGHT = Math.round((WIDTH * (y1 - y0)) / (x1 - x0));

const topology = JSON.parse(readFileSync(new URL("../node_modules/world-atlas/land-10m.json", import.meta.url), "utf8"));
const world = feature(topology, topology.objects.land);
// Keep only polygons that touch the frame, and turn inside-out ones the right way round: the 1:10m file
// winds Afro-Eurasia so that d3-geo reads it as "everything but the continent", which once clipped
// paints the whole frame and hides the sea.
const polygons = world.features
  .flatMap((f) => (f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates]))
  .map((coordinates) => (geoArea({ type: "Polygon", coordinates }) > 2 * Math.PI ? coordinates.map((ring) => [...ring].reverse()) : coordinates))
  .filter((coordinates) => {
    const [[west, south], [east, north]] = geoBounds({ type: "Polygon", coordinates });
    const crossesAntimeridian = west > east; // e.g. Asia, which runs past 180 degrees into Chukotka
    const overlapsLongitude = crossesAntimeridian || (east >= WEST - 2 && west <= EAST + 2);
    return overlapsLongitude && north >= SOUTH - 2 && south <= NORTH + 2;
  });
const land = { type: "MultiPolygon", coordinates: polygons };
console.log(`land polygons kept: ${polygons.length}`);
const frame = {
  type: "Feature",
  geometry: { type: "Polygon", coordinates: [[[WEST, SOUTH], [WEST, NORTH], [EAST, NORTH], [EAST, SOUTH], [WEST, SOUTH]]] },
};
// Clockwise ring: d3-geo treats an anticlockwise one as "the whole globe except this box".
const projection = geoMercator().fitSize([WIDTH, HEIGHT], frame).clipExtent([[-20, -20], [WIDTH + 20, HEIGHT + 20]]);
// Drop coastline points closer than MIN_STEP px to the last kept one (rings still close properly:
// lineEnd/ring closure is handled by the path context). Zoomed-in the map stays crisp enough.
const MIN_STEP = 0.6;
let last = null;
const decimating = (context) => ({
  moveTo(x, y) {
    last = [x, y];
    context.moveTo(x, y);
  },
  lineTo(x, y) {
    if (last && Math.hypot(x - last[0], y - last[1]) < MIN_STEP) return;
    last = [x, y];
    context.lineTo(x, y);
  },
  closePath() {
    context.closePath();
  },
  arc() {},
});
let d = "";
const writer = {
  moveTo: (x, y) => (d += `M${x.toFixed(1)},${y.toFixed(1)}`),
  lineTo: (x, y) => (d += `L${x.toFixed(1)},${y.toFixed(1)}`),
  closePath: () => (d += "Z"),
  arc() {},
};
geoPath(projection, decimating(writer))(land);
if (!d) throw new Error("build-map: land path came out empty; check the world-atlas file and the frame");
const out = { width: WIDTH, height: HEIGHT, bounds: { west: WEST, east: EAST, south: SOUTH, north: NORTH }, scale: projection.scale(), translate: projection.translate(), land: d };
writeFileSync(new URL("../src/data/atlas-map.json", import.meta.url), JSON.stringify(out));
console.log(`atlas-map.json: lon ${WEST}..${EAST}, lat ${SOUTH}..${NORTH}, ${WIDTH}x${HEIGHT}, ${(d.length / 1024).toFixed(0)} KB of path`);
