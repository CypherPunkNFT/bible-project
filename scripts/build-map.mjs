// Pre-draws the Atlas's land outline once: the detailed (1:10m) world land clipped to the biblical world,
// projected and written as one SVG path in src/data/atlas-map.json. The page then ships ~250 KB.
//   node scripts/build-map.mjs
import { geoArea, geoBounds, geoMercator, geoPath } from "d3-geo";
import { readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";

const WIDTH = 1000;
const HEIGHT = 760;
// Rome to Persia, Ethiopia to the Black Sea. Clockwise ring: d3-geo treats an anticlockwise one as
// "the whole globe except this box" and would fit the entire world.
const WEST = 9;
const EAST = 58;
const SOUTH = 12;
const NORTH = 45;

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
const out = { width: WIDTH, height: HEIGHT, scale: projection.scale(), translate: projection.translate(), land: d };
writeFileSync(new URL("../src/data/atlas-map.json", import.meta.url), JSON.stringify(out));
console.log(`atlas-map.json: ${(d.length / 1024).toFixed(0)} KB of path, scale ${projection.scale().toFixed(1)}`);
