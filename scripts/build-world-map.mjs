// Pre-draws the testimonies world map once from the downloaded world-atlas data (1:50m land and country
// borders) on a Natural Earth projection, written as SVG paths in src/data/world-map.json. The page projects
// each testimony's latitude/longitude with the same scale and translate, so dots land on this drawing.
//   node scripts/build-world-map.mjs
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { readFileSync, writeFileSync } from "node:fs";
import { feature, mesh } from "topojson-client";

const WIDTH = 1600;
const read = (name) => JSON.parse(readFileSync(new URL(`../node_modules/world-atlas/${name}`, import.meta.url), "utf8"));
const landTopology = read("land-50m.json");
const countryTopology = read("countries-50m.json");
const sphere = { type: "Sphere" };
const unit = geoNaturalEarth1().fitWidth(WIDTH, sphere);
const [[, top], [, bottom]] = geoPath(unit).bounds(sphere);
const HEIGHT = Math.ceil(bottom - top);
const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], sphere);

// Drop points closer than MIN_STEP px to the last kept one; the map stays crisp at the viewer's zoom limit.
const MIN_STEP = 1.2;
function draw(object) {
  let d = "", last = null;
  const context = {
    moveTo(x, y) { last = [x, y]; d += `M${x.toFixed(1)},${y.toFixed(1)}`; },
    lineTo(x, y) { if (last && Math.hypot(x - last[0], y - last[1]) < MIN_STEP) return; last = [x, y]; d += `L${x.toFixed(1)},${y.toFixed(1)}`; },
    closePath() { d += "Z"; },
    arc() {},
  };
  geoPath(projection, context)(object);
  if (!d) throw new Error("build-world-map: a path came out empty; check the world-atlas files in node_modules");
  return d;
}

const out = {
  width: WIDTH, height: HEIGHT, scale: projection.scale(), translate: projection.translate(),
  sphere: draw(sphere),
  land: draw(feature(landTopology, landTopology.objects.land)),
  borders: draw(mesh(countryTopology, countryTopology.objects.countries, (a, b) => a !== b)),
};
writeFileSync(new URL("../src/data/world-map.json", import.meta.url), JSON.stringify(out));
console.log(`world map ${WIDTH}x${HEIGHT}: ${(JSON.stringify(out).length / 1024).toFixed(0)} KB`);
