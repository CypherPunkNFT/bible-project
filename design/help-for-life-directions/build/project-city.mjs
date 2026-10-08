// Places Jacksonville's city hall on the site's USA map (src/data/resources/us-states.json) with the same d3 Albers USA
// projection the live page uses, and prints the point for build-data.py.   node project-city.mjs <Website dir>
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";
const site = process.argv[2];
if (!site) throw new Error("project-city: pass the Website folder");
const require = createRequire(path.join(site, "package.json"));
const { geoAlbersUsa } = await import(pathToFileURL(require.resolve("d3-geo")).href);
const states = JSON.parse(readFileSync(path.join(site, "src/data/resources/us-states.json"), "utf8"));
const life = JSON.parse(readFileSync(path.join(site, "src/data/resources/life.json"), "utf8"));
const city = life.cities.find((c) => c.id === "jacksonville-fl");
const at = geoAlbersUsa().scale(states.scale).translate(states.translate)([city.lon, city.lat]);
console.log(JSON.stringify({ x: +at[0].toFixed(1), y: +at[1].toFixed(1) }));
