// Builds scholars-data.js for the Scholars mock-ups from scholars.json (hand-entered) plus two things computed here:
// where the site's own content mentions each scholar (files per site area), and map positions in three views.
// Run from Website/: node design/scholars-directions/shared/build-scholars.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { geoMercator, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, "../../..");
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const input = readJson(path.join(site, "content/teachers/scholars.json")); // the site's own copy (fact-checked 2026-10-08)

// Site areas and the content folders that feed them. Only text the visitor can read is searched.
const AREAS = [
  ["Letters study", ["src/data/letters"]],
  ["Apologetics", ["content/apologetics", "src/generated/apologetics.ts"]],
  ["Topics", ["data/topics"]],
  ["People pages", ["src/data/people-pages", "content/people"]],
  ["Rulers", ["src/data/who-ruled"]],
];
const filesUnder = (target) => {
  const full = path.join(site, target);
  if (!fs.existsSync(full)) throw new Error(`build-scholars: expected site content at ${target}, found nothing`);
  if (fs.statSync(full).isFile()) return [full];
  return fs.readdirSync(full, { recursive: true }).map((f) => path.join(full, f)).filter((f) => fs.statSync(f).isFile() && /\.(json|ts|md|txt)$/.test(f));
};
const areaTexts = AREAS.map(([area, targets]) => [area, targets.flatMap(filesUnder).map((f) => fs.readFileSync(f, "utf8"))]);

const mentions = (pattern) => {
  const re = new RegExp(`\\b(?:${pattern})`, "");
  const out = {};
  for (const [area, texts] of areaTexts) {
    const n = texts.filter((t) => re.test(t)).length;
    if (n) out[area] = n;
  }
  return out;
};

// Map views: land outlines projected once, with every scholar's place and every find projected into each view.
const atlas = (name) => readJson(path.join(site, "node_modules/world-atlas", name));
const land50 = feature(atlas("land-50m.json"), atlas("land-50m.json").objects.land);
const land110 = feature(atlas("land-110m.json"), atlas("land-110m.json").objects.land);
const box = (west, south, east, north) => ({ type: "MultiPoint", coordinates: [[west, south], [east, south], [east, north], [west, north]] });
const VIEWS = {
  world: { size: [1000, 520], projection: geoNaturalEarth1(), fit: { type: "Sphere" }, land: land110 },
  med: { size: [1000, 620], projection: geoMercator(), fit: box(-11, 24, 50, 58), land: land50 },
  holyland: { size: [600, 900], projection: geoMercator(), fit: box(32.6, 27.9, 37.2, 33.5), land: land50 },
};
// The world outline has no inland water, so the two seas of the Holy Land are added as simplified hand-drawn outlines
// (clockwise, as d3 expects), drawn into the land path as holes: draw it with fill-rule: evenodd to show them as water.
const LAKES = [
  ["Dead Sea", [[35.40, 31.05], [35.38, 31.20], [35.39, 31.35], [35.42, 31.50], [35.45, 31.65], [35.47, 31.77], [35.53, 31.77], [35.56, 31.74], [35.59, 31.60], [35.58, 31.40], [35.56, 31.27], [35.52, 31.17], [35.47, 31.05]]],
  ["Sea of Galilee", [[35.55, 32.90], [35.60, 32.88], [35.64, 32.82], [35.645, 32.75], [35.60, 32.70], [35.56, 32.72], [35.53, 32.77], [35.52, 32.84]]],
].map(([name, ring]) => ({ type: "Feature", properties: { name }, geometry: { type: "Polygon", coordinates: [[...ring, ring[0]]] } }));
const round = (n) => Math.round(n * 10) / 10;
const views = {};
for (const [name, view] of Object.entries(VIEWS)) {
  const [width, height] = view.size;
  view.projection.fitSize([width, height], view.fit);
  if (name !== "world") view.projection.clipExtent([[-20, -20], [width + 20, height + 20]]);
  const inside = ([lat, lon]) => { const [x, y] = view.projection([lon, lat]); return x >= 0 && x <= width && y >= 0 && y <= height ? [round(x), round(y)] : null; };
  const points = {};
  for (const s of input.scholars) { const p = inside([s.place[1], s.place[2]]); if (p) points[s.id] = p; }
  for (const f of input.finds) { const p = inside([f.where[1], f.where[2]]); if (p) points[`find:${f.id}`] = p; }
  const draw = geoPath(view.projection).digits(name === "holyland" ? 2 : 1);
  const lakes = name === "world" ? "" : LAKES.map((lake) => draw(lake) ?? "").join("");
  views[name] = { width, height, land: draw(view.land) + lakes, points };
}

const ids = new Set(input.scholars.map((s) => s.id));
for (const f of input.finds) for (const id of f.by) if (!ids.has(id)) throw new Error(`find ${f.id} names unknown scholar ${id}`);
for (const [id] of input.chain.steps) if (!ids.has(id)) throw new Error(`chain step names unknown scholar ${id}`);

// Era by the year of their first listed work (when they did what they are known for), so Erasmus (born 1466, Greek New
// Testament 1516) sits with the Reformation, not the Middle Ages.
const eraOf = (year) => (year < 500 ? "ancient" : year < 1500 ? "medieval" : year < 1800 ? "early-modern" : "modern");
const out = {
  about: "Built by build-scholars.mjs from content/teachers/scholars.json (fact-checked 2026-10-08) and the site's own content (mentions).",
  faiths: input.faiths,
  fields: input.fields,
  eras: { ancient: "The ancient world (to 500)", medieval: "The Middle Ages (500–1500)", "early-modern": "Reformation to Enlightenment (1500–1800)", modern: "The modern age (1800 on)" },
  scholars: input.scholars.map(({ match, site: use, ...s }) => ({ ...s, era: eraOf(s.works[0]?.[1] ?? s.born + 30), site: use ? { status: use[0], note: use[1] } : null, mentions: mentions(match) }))
    .sort((a, b) => a.born - b.born),
  finds: input.finds,
  chain: input.chain,
  views,
};
const text = `// Generated by build-scholars.mjs; do not edit.\nwindow.SCHOLARS = ${JSON.stringify(out)};\n`;
fs.writeFileSync(path.join(here, "scholars-data.js"), text);
const used = out.scholars.filter((s) => s.site?.status === "in-use").length, held = out.scholars.filter((s) => s.site?.status === "held").length;
console.log(`${out.scholars.length} scholars (${used} in use on the site, ${held} in the library), ${out.finds.length} finds; ${(text.length / 1024).toFixed(0)} KB`);
for (const s of out.scholars) console.log(`  ${s.short.padEnd(16)} ${JSON.stringify(s.mentions)}`);
