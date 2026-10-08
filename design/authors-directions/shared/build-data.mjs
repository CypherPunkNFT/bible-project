// Builds authors-data.js for the four Authors mock-ups from the library catalogue (content/library) and lives.json.
// Run from Website/: node design/authors-directions/shared/build-data.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { geoMercator, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, "../../..");
const library = path.join(site, "content/library");
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

const lives = readJson(path.join(site, "content/teachers/lives.json")); // the site's own copy (fact-checked 2026-10-08)
const ids = Object.keys(lives.people);

// Names and traditions from the author registry and its extensions.
const registry = new Map();
for (const file of ["authors.json", ...fs.readdirSync(path.join(library, "registry-extensions")).map((f) => `registry-extensions/${f}`)]) {
  for (const author of readJson(path.join(library, file)).authors ?? []) registry.set(author.id, author);
}
for (const id of ids) if (!registry.has(id)) throw new Error(`lives.json names ${id}, which is not in the author registry`);

// Bible books (KJV numbering) from the site's own stats: code, name, section, verses per chapter.
const books = readJson(path.join(site, "data/stats.json")).books.filter((b) => b.section !== "apocrypha")
  .map((b) => ({ code: b.code, name: b.name, section: b.section, chapters: b.chapters.map((c) => c[0]) }));
if (books.length !== 66) throw new Error(`expected 66 books in data/stats.json, found ${books.length}`);

// Where each work can be read: work → edition → asset address (the original source page or file).
const editionWork = new Map();
for (const file of fs.readdirSync(path.join(library, "catalog/editions"))) {
  const edition = readJson(path.join(library, "catalog/editions", file));
  editionWork.set(edition.id, edition.workId);
}
const workUrl = new Map();
for (const file of fs.readdirSync(path.join(library, "catalog/assets"))) {
  const asset = readJson(path.join(library, "catalog/assets", file));
  const workId = editionWork.get(asset.editionId);
  const url = asset.finalUrl ?? asset.canonicalUrl;
  if (workId && url && !workUrl.has(workId)) workUrl.set(workId, url);
}

// Every catalogued work by one of our people.
const published = new Set(readJson(path.join(library, "publication.json")).workIds);
const NOTABLE_GENRES = ["systematic-theology", "treatise", "commentary", "collected-works", "autobiography", "catechism", "letter", "devotional", "biography", "lecture"];
const people = Object.fromEntries(ids.map((id) => [id, { genres: {}, works: 0, notable: [], books: Array(66).fill(0), sermons: [], passages: [], titleUrls: new Map(), titles: new Set() }]));
const normal = (title) => title.toLowerCase().replace(/^(the|a|an) /, "").replace(/[^a-z0-9]+/g, " ").trim();
const chapterIndex = {}; // "book:chapter" → { authorId: count }
let worksRead = 0;
for (const file of fs.readdirSync(path.join(library, "catalog/works"))) {
  const work = readJson(path.join(library, "catalog/works", file));
  worksRead++;
  const creator = work.creators?.find((c) => people[c.authorId]);
  if (!creator) continue;
  const person = people[creator.authorId];
  person.works++;
  person.titles.add(normal(work.title));
  if (workUrl.has(work.id) && !person.titleUrls.has(normal(work.title))) person.titleUrls.set(normal(work.title), workUrl.get(work.id));
  person.genres[work.genre] = (person.genres[work.genre] ?? 0) + 1;
  const main = (work.passages ?? []).filter((p) => p.role === "main-text" && p.start);
  for (const passage of main) {
    const book = Math.floor(passage.start / 1e6), chapter = Math.floor(passage.start / 1e3) % 1000;
    if (book < 1 || book > 66) continue;
    person.books[book - 1]++;
    const key = `${book}:${chapter}`;
    chapterIndex[key] ??= {};
    chapterIndex[key][creator.authorId] = (chapterIndex[key][creator.authorId] ?? 0) + 1;
  }
  // Where to read it: its own file, else the volume it is part of, else the source the catalogue cites for it.
  const parent = work.related?.find((r) => r.relation === "is-part-of")?.targetId;
  const url = workUrl.get(work.id) ?? workUrl.get(parent) ?? work.evidence?.find((e) => /^https?:/.test(e.url))?.url ?? null;
  const delivered = work.dates?.find((d) => d.event === "delivery" && d.value)?.value ?? null;
  if (work.genre === "sermon" && main.length) person.sermons.push({ t: work.title, r: main[0].reference, v: main[0].start, d: delivered, u: url });
  // Every work with a main Bible text, any genre, with where to read it (for the Teachers through the Bible section).
  if (main.length) person.passages.push({ t: work.title, g: work.genre, r: main[0].reference, v: main[0].start, d: delivered, u: url });
  const rank = published.has(work.id) ? -10 : NOTABLE_GENRES.indexOf(work.genre); // published first; -1 = not a notable genre
  if (rank !== -1) person.notable.push({ t: work.title, g: work.genre, rank, s: work.reading?.summary ?? null });
}

for (const [id, person] of Object.entries(people)) {
  person.notable.sort((a, b) => a.rank - b.rank || a.t.length - b.t.length);
  const seen = new Set();
  person.notable = person.notable.filter((w) => !seen.has(w.t) && seen.add(w.t)).slice(0, 8).map(({ rank, ...w }) => w);
  person.passages.sort((a, b) => a.v - b.v);
  person.sermons.sort((a, b) => (a.d ?? "9").localeCompare(b.d ?? "9") || a.v - b.v);
  // Spurgeon keeps every dated sermon (for the calendar); everyone else keeps a sample.
  if (id !== "author-charles-spurgeon") person.sermons = person.sermons.slice(0, 60);
}

// Map views: land outlines projected once here, with every place projected into each view.
const atlas = (name) => readJson(path.join(site, "node_modules/world-atlas", name));
const land50 = feature(atlas("land-50m.json"), atlas("land-50m.json").objects.land);
const land110 = feature(atlas("land-110m.json"), atlas("land-110m.json").objects.land);
const bbox = (west, south, east, north) => ({ type: "MultiPoint", coordinates: [[west, south], [east, south], [east, north], [west, north]] }); // points: no ring winding to get wrong
const VIEWS = {
  world: { size: [1000, 520], projection: geoNaturalEarth1(), fit: { type: "Sphere" }, land: land110 },
  atlantic: { size: [1000, 560], projection: geoMercator(), fit: bbox(-112, 26, 32, 60), land: land50 },
  europe: { size: [1000, 680], projection: geoMercator(), fit: bbox(-9, 45.2, 18, 58.6), land: land50 },
  america: { size: [1000, 640], projection: geoMercator(), fit: bbox(-95, 32, -68, 46), land: land50 },
};
const round = (n) => Math.round(n * 10) / 10;
const views = {};
for (const [name, view] of Object.entries(VIEWS)) {
  const [width, height] = view.size;
  view.projection.fitSize([width, height], view.fit);
  if (name !== "world") view.projection.clipExtent([[-20, -20], [width + 20, height + 20]]);
  const draw = geoPath(view.projection).digits(1);
  const places = {};
  for (const id of ids) {
    lives.people[id].places.forEach(([place, lat, lon], i) => {
      const [x, y] = view.projection([lon, lat]);
      if (x >= 0 && x <= width && y >= 0 && y <= height) places[`${id}#${i}`] = [round(x), round(y)];
    });
  }
  views[name] = { width, height, land: draw(view.land), places };
}

const out = {
  about: "Built by design/authors-directions/shared/build-data.mjs from content/library (catalogue counts, titles, Bible passages, Spurgeon's delivery dates) and content/teachers/lives.json (life years, places and links, fact-checked 2026-10-08).",
  books,
  people: ids.map((id) => {
    const r = registry.get(id), l = lives.people[id], p = people[id];
    return { id, name: r.name, traditions: r.traditions, ...l, works: p.works, genres: p.genres, notable: p.notable,
      known: l.known.map(([title, year]) => {
        const match = [...p.titles].find((x) => x.includes(normal(title)) || normal(title).includes(x) && x.length > 8);
        return { t: title, y: year, inLibrary: Boolean(match), u: match ? p.titleUrls.get(match) ?? null : null };
      }),
      passages: p.passages, books: p.books, sermons: p.sermons };
  }).sort((a, b) => a.born - b.born),
  links: lives.links.map(([from, to, note]) => ({ from, to, note })),
  chapters: chapterIndex,
  views,
};
const text = `// Generated by build-data.mjs; do not edit.\nwindow.AUTHORS = ${JSON.stringify(out)};\n`;
fs.writeFileSync(path.join(here, "authors-data.js"), text);
const preached = Object.keys(chapterIndex).length;
console.log(`read ${worksRead} works; ${out.people.length} people; ${out.people.reduce((n, p) => n + p.works, 0)} of their works; ${preached} chapters with a main-text sermon; ${(text.length / 1024).toFixed(0)} KB`);
