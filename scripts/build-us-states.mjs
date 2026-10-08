// Pre-draws the USA map for /resources/life once, from Natural Earth's 1:50m admin-1 states and provinces (public
// domain, held at ../sources/natural-earth/), on d3's Albers USA projection (Alaska and Hawaii inset). Writes SVG paths
// plus the projection's scale and translate to src/data/resources/us-states.json; the page projects each city's
// latitude/longitude with the same numbers, so its point lands on this drawing.
//   node scripts/build-us-states.mjs
import { geoAlbersUsa, geoArea, geoPath } from "d3-geo";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const SOURCE = new URL("../../sources/natural-earth/ne_50m_admin_1_states_provinces_lakes.geojson", import.meta.url);
const SHA256 = "b92c3f709b691240f6320e5cd7fade78cedfa3b91ecff14cecd3de0616c764b9";
const WIDTH = 975, HEIGHT = 610, MIN_STEP = 0.6;

const raw = readFileSync(SOURCE);
const sum = createHash("sha256").update(raw).digest("hex");
if (sum !== SHA256) throw new Error(`build-us-states: ${SOURCE.pathname} has sha256 ${sum}, expected ${SHA256}`);
const states = JSON.parse(raw.toString("utf8")).features
  .filter((f) => f.properties.iso_a2 === "US")
  .map(rewind);
if (states.length !== 51) throw new Error(`build-us-states: expected 50 states and DC, found ${states.length}`);

// d3-geo wants each polygon's outer ring clockwise; a ring wound the other way covers the rest of the globe instead.
function rewind(feature) {
  const fix = (polygon) => (geoArea({ type: "Polygon", coordinates: polygon }) > 2 * Math.PI ? polygon.map((ring) => [...ring].reverse()) : polygon);
  const g = feature.geometry;
  const geometry = g.type === "Polygon" ? { type: "Polygon", coordinates: fix(g.coordinates) } : { type: "MultiPolygon", coordinates: g.coordinates.map(fix) };
  return { ...feature, geometry };
}

const projection = geoAlbersUsa().fitSize([WIDTH, HEIGHT], { type: "FeatureCollection", features: states });
function draw(object) {
  let d = "", last = null;
  const context = {
    moveTo(x, y) { last = [x, y]; d += `M${x.toFixed(1)},${y.toFixed(1)}`; },
    lineTo(x, y) { if (last && Math.hypot(x - last[0], y - last[1]) < MIN_STEP) return; last = [x, y]; d += `L${x.toFixed(1)},${y.toFixed(1)}`; },
    closePath() { d += "Z"; },
    arc() {},
  };
  geoPath(projection, context)(object);
  if (!d) throw new Error(`build-us-states: ${object.properties?.name ?? "a shape"} came out empty`);
  return d;
}

const out = {
  source: "Natural Earth 1:50m admin-1 states and provinces (lakes), v5.1.2, public domain",
  width: WIDTH, height: HEIGHT, scale: projection.scale(), translate: projection.translate(),
  states: states.map((f) => ({ id: f.properties.postal, name: f.properties.name, d: draw(f) })).sort((a, b) => a.id.localeCompare(b.id)),
};
writeFileSync(new URL("../src/data/resources/us-states.json", import.meta.url), JSON.stringify(out));
console.log(`us states ${WIDTH}x${HEIGHT}: ${out.states.length} states, ${(JSON.stringify(out).length / 1024).toFixed(0)} KB`);
