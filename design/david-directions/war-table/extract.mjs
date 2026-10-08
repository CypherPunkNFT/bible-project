// Builds data/david.json for the "War table" mock-up. Every fact comes from the site's own reviewed files:
//   src/data/people-pages/rulers-united-kingdom.json (David's reign page data and the group's citations)
//   data/study/people/david-rut-4-17.json (his story), data/places.json (lon/lat, confidence), data/text/kjv (verses),
//   data/catalog.json (book names), node_modules/world-atlas land-10m (the Atlas's land outline, as the Moses road used),
//   and AtlasTiles/build/bible-atlas-ancient.pmtiles (OpenStreetMap lakes and rivers via Protomaps, ODbL, the street
//   atlas's own build) for the water on the table.
// The turns below only choose and order those facts; the text shown is copied, never written here.
//   node design/david-directions/war-table/extract.mjs        (from Website/)
import { readFileSync, readdirSync, writeFileSync, openSync, readSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, "..", "..", "..");
const read = (p) => JSON.parse(readFileSync(join(SITE, p), "utf8"));
const mod = (p) => import(pathToFileURL(join(SITE, "node_modules", p)).href);
const fail = (msg) => { throw new Error(`war-table extract: ${msg}`); };

const group = read("src/data/people-pages/rulers-united-kingdom.json");
const D = group.rulers.find((r) => r.id === "david-rut-4-17") ?? fail("David (david-rut-4-17) not found in rulers-united-kingdom.json");
const person = read("data/study/people/david-rut-4-17.json");
const places = read("data/places.json");
const catalog = read("data/catalog.json");
const placeById = new Map(places.map((p) => [p.id, p]));

// ── Books and verses ──
const books = {};
for (const b of catalog.books) books[b.num] = { code: b.code, name: b.name };
const bookCache = new Map();
function chapters(num) {
  if (bookCache.has(num)) return bookCache.get(num);
  const code = books[num]?.code ?? fail(`no book number ${num} in data/catalog.json`);
  const dir = join(SITE, "data/text/kjv", code);
  const out = {};
  for (const f of readdirSync(dir)) Object.assign(out, JSON.parse(readFileSync(join(dir, f), "utf8")));
  bookCache.set(num, out);
  return out;
}
const verses = {};
function verse(id) {
  if (verses[id]) return verses[id];
  const b = Math.floor(id / 1e6), c = Math.floor((id % 1e6) / 1e3), v = id % 1e3;
  const ch = chapters(b)[String(c)] ?? fail(`chapter ${c} missing in ${books[b].code}`);
  const row = ch.v.find((x) => Number(x.n) === v) ?? fail(`verse ${books[b].code} ${c}:${v} missing`);
  const text = row.r.map((r) => (typeof r === "string" ? r : Array.isArray(r) ? r[0] : "")).join("").replace(/¶/g, "").replace(/\s+/g, " ").trim();
  if (!text) fail(`verse ${id} came out empty`);
  verses[id] = text;
  return text;
}
// A span [a, b] in one chapter, as one passage of text.
function passage([a, b = a]) {
  const out = [];
  for (let id = a; id <= b; id++) out.push(verse(id));
  return out.join(" ");
}

// ── Places ──
const usedPlaces = new Set();
function place(id) {
  const p = placeById.get(id) ?? fail(`place ${id} not in data/places.json`);
  usedPlaces.add(id);
  return p;
}

// ── The map: projection, land, water ──
const BOUNDS = { west: 33.3, east: 38.0, south: 29.9, north: 35.6 };
const WIDTH = 1000;
const { geoArea, geoBounds, geoMercator, geoPath } = await mod("d3-geo/src/index.js");
const { feature } = await mod("topojson-client/src/index.js");
const unit = geoMercator();
const [ux0, uy0] = unit([BOUNDS.west, BOUNDS.north]);
const [ux1, uy1] = unit([BOUNDS.east, BOUNDS.south]);
const HEIGHT = Math.round((WIDTH * (uy1 - uy0)) / (ux1 - ux0));
const frame = { type: "Feature", geometry: { type: "Polygon", coordinates: [[[BOUNDS.west, BOUNDS.south], [BOUNDS.west, BOUNDS.north], [BOUNDS.east, BOUNDS.north], [BOUNDS.east, BOUNDS.south], [BOUNDS.west, BOUNDS.south]]] } };
const projection = geoMercator().fitSize([WIDTH, HEIGHT], frame).clipExtent([[0, 0], [WIDTH, HEIGHT]]);
const xy = (lon, lat) => projection([lon, lat]).map((v) => Math.round(v * 10) / 10);

// Rings as flat [x0, y0, x1, y1, ...] arrays, dropping points closer than MIN_STEP board pixels.
function ringCollector(minStep) {
  const rings = [];
  let cur = null, last = null;
  const ctx = {
    moveTo(x, y) { cur = [+x.toFixed(1), +y.toFixed(1)]; rings.push(cur); last = [x, y]; },
    lineTo(x, y) { if (last && Math.hypot(x - last[0], y - last[1]) < minStep) return; cur.push(+x.toFixed(1), +y.toFixed(1)); last = [x, y]; },
    closePath() {}, arc() {},
  };
  return { ctx, rings };
}
const topology = read("node_modules/world-atlas/land-10m.json");
const world = feature(topology, topology.objects.land);
const polygons = world.features
  .flatMap((f) => (f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates]))
  .map((c) => (geoArea({ type: "Polygon", coordinates: c }) > 2 * Math.PI ? c.map((ring) => [...ring].reverse()) : c))
  .filter((c) => {
    const [[w, s], [e, n]] = geoBounds({ type: "Polygon", coordinates: c });
    const anti = w > e;
    return (anti || (e >= BOUNDS.west - 2 && w <= BOUNDS.east + 2)) && n >= BOUNDS.south - 2 && s <= BOUNDS.north + 2;
  });
const landC = ringCollector(0.3);
geoPath(projection, landC.ctx)({ type: "MultiPolygon", coordinates: polygons });
const land = landC.rings.filter((r) => r.length >= 8);
if (!land.length) fail("land came out empty");

// Lakes and rivers from the street atlas's own OpenStreetMap tiles (zoom 9).
const PM = join(SITE, "..", "AtlasTiles", "build", "bible-atlas-ancient.pmtiles");
if (!existsSync(PM)) fail(`${PM} not found (AtlasTiles is a junction to the F: data drive)`);
const { PMTiles } = await mod("pmtiles/dist/esm/index.js");
const { VectorTile } = await mod("@mapbox/vector-tile/index.js");
const { PbfReader } = await mod("pbf/index.js");
const fd = openSync(PM, "r");
const pm = new PMTiles({ getKey: () => PM, getBytes: async (o, l) => { const b = Buffer.alloc(l); readSync(fd, b, 0, l, o); return { data: b.buffer.slice(b.byteOffset, b.byteOffset + l) }; } });
// Rivers drawn on the table: the named rivers of the region (English names as OpenStreetMap gives them).
const RIVERS = /^(River Jordan|Orontes|Litani River|Zarqa River|Nahal Yarmukh|Yarmuk River|Hasbani River|Barada River|Wadi Mujib|Wadi al Hasa|Nahal Kishon|Nahal Yarkon|Nahal Sorek|Nahal HaBsor|Nahal Shikma|Nahr El Kabir|Nahr ez Zahrani)$/;
const Z = 9, N = 2 ** Z;
const tileX = (lon) => Math.floor(((lon + 180) / 360) * N);
const tileY = (lat) => Math.floor(((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * N);
const lakes = [], rivers = [];
const riverNames = new Set();
for (let x = tileX(BOUNDS.west); x <= tileX(BOUNDS.east); x++) {
  for (let y = tileY(BOUNDS.north); y <= tileY(BOUNDS.south); y++) {
    const t = await pm.getZxy(Z, x, y);
    if (!t) continue;
    const layer = new VectorTile(new PbfReader(new Uint8Array(t.data))).layers.water;
    if (!layer) continue;
    for (let i = 0; i < layer.length; i++) {
      const f = layer.feature(i), kind = f.properties.kind, en = f.properties["name:en"] ?? "";
      const toLonLat = (p) => [((x + p.x / layer.extent) / N) * 360 - 180, (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + p.y / layer.extent)) / N))) * 180) / Math.PI];
      if (f.type === 3 && (kind === "lake" || kind === "water")) {
        for (const ring of f.loadGeometry()) {
          const pts = ring.map((p) => projection(toLonLat(p)));
          let area = 0;
          for (let k = 0; k < pts.length; k++) { const [a, b] = pts[k], [c, d] = pts[(k + 1) % pts.length]; area += a * d - c * b; }
          if (Math.abs(area / 2) < 6) continue; // fishponds and reservoirs drop out
          const flat = [];
          let last = null;
          for (const [px, py] of pts) { if (last && Math.hypot(px - last[0], py - last[1]) < 0.35) continue; flat.push(+px.toFixed(1), +py.toFixed(1)); last = [px, py]; }
          if (flat.length >= 6) lakes.push(flat);
        }
      } else if (f.type === 2 && kind === "river" && RIVERS.test(en)) {
        riverNames.add(en);
        for (const line of f.loadGeometry()) {
          const flat = [];
          let last = null;
          for (const p of line) { const [px, py] = projection(toLonLat(p)); if (last && Math.hypot(px - last[0], py - last[1]) < 0.6) continue; flat.push(+px.toFixed(1), +py.toFixed(1)); last = [px, py]; }
          if (flat.length >= 4) rivers.push(flat);
        }
      }
    }
  }
}

// Landmark mountains, drawn as peaks (positions from data/places.json; heights are not to scale).
const PEAKS = ["a341fe8", "ac54760", "a3e21c6", "acd63ee", "acf57c5", "a772880", "aa5cc66", "a30e967", "a366989", "ac2c4c5", "aa8275b", "a9ef72b", "ae981db", "aac759d"];
const peaks = PEAKS.map((id) => { const p = place(id); return { id, name: p.name, type: p.type, confidence: p.confidence, xy: xy(p.lon, p.lat) }; });

// ── Claims ──
const ACC = D.accession, EV = D.events, NAT = D.nation, WS = D.worldStage, PR = D.prophets, TA = D.twoAccounts, VN = D.verdictNotes;
const evClaim = (i) => ({ ...EV[i].claim, label: EV[i].label, kind: EV[i].kind, event: i });
const from = (src, c) => ({ ...c, src });

// ── The turns of the campaign ──
// roles: david, enemy, ally, prophet, ark, rival, house (Saul's house). Moves join places in the order the text
// tells them; Scripture names the places, not the roads.
const PHASES = [
  { id: "rise", name: "Before the throne", books: "1 Samuel 16–30" },
  { id: "hebron", name: "Hebron", books: "2 Samuel 1–5" },
  { id: "jerusalem", name: "Jerusalem and the wars", books: "2 Samuel 5–12" },
  { id: "sword", name: "The sword in his house", books: "2 Samuel 13–20" },
  { id: "last", name: "The last years", books: "2 Samuel 21–24 · 1 Kings 1–2 · 1 Chronicles 22–29" },
];
const T = [
  { phase: "rise", title: "Anointed in Bethlehem", icon: "oil", anointing: 1, year: "Before the reign", verse: 9016013,
    claims: [from("Anointing", ACC[0])], prophets: [0], notSaid: [1],
    pieces: [{ place: "a112427", role: "david", label: "David", icon: "oil" }, { place: "a112427", role: "prophet", label: "Samuel", icon: "scroll", offset: [1, -1] }] },
  { phase: "rise", title: "The valley of Elah", icon: "sling", year: "Before the reign", verse: 9017050,
    claims: [from("His story", person.story.paragraphs[1])], notSaid: [1], differ: [4], questions: ["david-goliath"],
    pieces: [{ place: "ab183f8", role: "david", label: "David", icon: "sling", verse: 9017002 }, { place: "aafd7c4", role: "enemy", label: "Philistines", icon: "swords", verse: 9017001 }],
    moves: [{ path: ["a112427", "ab183f8"], kind: "march" }] },
  { phase: "rise", title: "The cave of Adullam", icon: "cave", year: "Before the reign", verse: 9022001,
    claims: [from("His story", person.story.paragraphs[2])], prophets: [1],
    pieces: [{ place: "af82614", role: "david", label: "David and about 400 men", icon: "users" }],
    moves: [{ path: ["ab183f8", "af82614"], kind: "flight" }] },
  { phase: "rise", title: "Ziklag, from Achish of Gath", icon: "gift", year: "Before the reign", verse: 9027006,
    claims: [from("Alliances", NAT.alliances[4]), from("World stage · Amalek", WS[7].claim)],
    pieces: [{ place: "a18873f", role: "ally", label: "Achish, king of Gath", icon: "crown" }, { place: "a0ed7ff", role: "david", label: "David", icon: "tent" }],
    moves: [{ path: ["a18873f", "a0ed7ff"], kind: "gift" }] },
  { phase: "hebron", title: "King over Judah at Hebron", icon: "oil", anointing: 2, year: "Reign year 1", yearN: 1, verse: 10002004,
    claims: [evClaim(0), from("Anointing", ACC[1])], differ: [11], hebron: true,
    pieces: [{ place: "a85151a", role: "david", label: "David, king of Judah", icon: "crown" }],
    moves: [{ path: ["a0ed7ff", "a85151a"], kind: "march" }] },
  { phase: "hebron", title: "War with the house of Saul", icon: "swords", year: "In the Hebron years", verse: 10003001,
    claims: [evClaim(1)],
    pieces: [{ place: "aede336", role: "david", label: "Joab", icon: "swords", verse: 10002013 }, { place: "aede336", role: "house", label: "Abner", icon: "shield", offset: [1.2, -0.6] }],
    moves: [{ path: ["a85151a", "aede336"], kind: "march" }] },
  { phase: "hebron", title: "King over all Israel", icon: "oil", anointing: 3, year: "Reign year 8", yearN: 8, verse: 10005003,
    claims: [evClaim(2), from("Anointing", ACC[2]), from("Anointing", ACC[3]), from("The three anointings", ACC[4])], extraVerses: [10005004], differ: [11],
    pieces: [{ place: "a85151a", role: "david", label: "David, king over Israel", icon: "crown" }] },
  { phase: "jerusalem", title: "Jerusalem taken", icon: "castle", year: "Year not given", verse: 10005007,
    claims: [evClaim(3), evClaim(5)], questions: ["david-hiram"],
    pieces: [{ place: "a15257a", role: "david", label: "The city of David", icon: "castle" }, { place: "a160272", role: "ally", label: "Hiram of Tyre", icon: "tree" }],
    moves: [{ path: ["a85151a", "a15257a"], kind: "march" }, { path: ["a160272", "a15257a"], kind: "gift", label: "cedar trees, carpenters and masons" }] },
  { phase: "jerusalem", title: "The valley of Rephaim", icon: "swords", year: "Year not given", verse: 10005020,
    claims: [evClaim(4)],
    pieces: [{ place: "a7559e6", role: "enemy", label: "Philistines", icon: "swords", verse: 10005018 }, { place: "a6bf059", role: "david", label: "David at Baal-perazim", icon: "crown" }],
    moves: [{ path: ["a2d3ca1", "aed6538"], kind: "pursuit", label: "from Geba until thou come to Gazer", verse: 10005025 }] },
  { phase: "jerusalem", title: "The ark comes up to Jerusalem", icon: "ark", year: "Year not given", verse: 10006015,
    claims: [evClaim(6), evClaim(7), from("Worship", NAT.worship[0])], differ: [9],
    pieces: [{ place: "a84f426", role: "ark", label: "The ark in the city of David", icon: "ark" }],
    moves: [{ path: ["a66f19c", "a84f426"], kind: "procession", label: "the ark", halt: "Uzzah struck down: the ark stays three months with Obed-edom" }] },
  { phase: "jerusalem", title: "Nathan's promise of a house", icon: "scroll", year: "Year not given", verse: 10007013,
    claims: [evClaim(8), from("Building", NAT.building[2])], prophets: [2],
    pieces: [{ place: "a15257a", role: "prophet", label: "Nathan", icon: "scroll" }] },
  { phase: "jerusalem", title: "The wars of 2 Samuel 8", icon: "swords", year: "Year not given", verse: 10008014,
    claims: [evClaim(9), evClaim(10), evClaim(11), evClaim(12), from("World stage · Aram", WS[1].claim), from("World stage · Moab and Edom", WS[4].claim)], differ: [5, 7, 8],
    pieces: [
      { place: "a0a52ec", role: "enemy", label: "Philistines (Metheg-ammah)", icon: "swords", verse: 10008001 },
      { place: "aa0b1d6", role: "enemy", label: "Moab", icon: "swords" },
      { place: "a4aa78a", role: "enemy", label: "Hadadezer of Zobah", icon: "swords" },
      { place: "a69c1d4", role: "enemy", label: "Syrians of Damascus", icon: "swords" },
      { place: "a2735ff", role: "enemy", label: "Edom", icon: "swords" },
      { place: "ac62cbc", role: "ally", label: "Toi of Hamath", icon: "gift" }],
    moves: [
      { path: ["a15257a", "a0a52ec"], kind: "march" }, { path: ["a15257a", "aa0b1d6"], kind: "march" },
      { path: ["a15257a", "a4aa78a"], kind: "march" }, { path: ["a69c1d4", "a4aa78a"], kind: "enemy", label: "came to succour Hadadezer", verse: 10008005 },
      { path: ["a15257a", "a2735ff"], kind: "march" }, { path: ["ac62cbc", "a15257a"], kind: "gift", label: "vessels of silver, gold and brass" }],
    offboard: [{ place: "a62dec4", label: "To the river Euphrates", note: "“as he went to recover his border at the river Euphrates” (2 Samuel 8:3). The Atlas's point for the Euphrates lies far to the east, off this table.", verse: 10008003 }] },
  { phase: "jerusalem", title: "Kindness to Mephibosheth", icon: "heart", year: "Year not given", verse: 10009007,
    claims: [evClaim(13)],
    pieces: [{ place: "a15257a", role: "david", label: "The king's table", icon: "crown" }] },
  { phase: "jerusalem", title: "Ammon and the Syrians", icon: "swords", year: "Year not given", verse: 10010019,
    claims: [evClaim(14), from("World stage · Ammon", WS[3].claim)], differ: [6],
    pieces: [{ place: "ae067b5", role: "enemy", label: "Hanun of Ammon", icon: "swords" }, { place: "aeb09c0", role: "enemy", label: "Syrians at Helam", icon: "swords", verse: 10010017 }],
    moves: [{ path: ["a15257a", "ae067b5"], kind: "march", label: "Joab and Abishai" }, { path: ["a4aa78a", "aeb09c0"], kind: "enemy", label: "Hadarezer's Syrians" }, { path: ["a15257a", "aeb09c0"], kind: "march", label: "David over Jordan" }],
    offboard: [{ place: "a62dec4", label: "Syrians “beyond the river”", note: "Hadarezer “brought out the Syrians that were beyond the river” (2 Samuel 10:16). The Euphrates lies off this table.", verse: 10010016 }] },
  { phase: "jerusalem", title: "Bathsheba and Uriah", icon: "eye", year: "Year not given", verse: 10012007, sin: true,
    claims: [evClaim(15), evClaim(16), evClaim(17), from("The verdict", VN[0]), from("The verdict", VN[1])], prophets: [2], differ: [12],
    pieces: [{ place: "a15257a", role: "david", label: "David in Jerusalem", icon: "crown", verse: 10011001 }, { place: "a15257a", role: "prophet", label: "Nathan", icon: "scroll", offset: [1.2, 0.6] }, { place: "ae067b5", role: "david", label: "Joab besieging Rabbah", icon: "swords" }] },
  { phase: "jerusalem", title: "Rabbah taken", icon: "crown", year: "Year not given", verse: 10012030,
    claims: [evClaim(18)],
    pieces: [{ place: "ae067b5", role: "david", label: "Rabbah, the royal city", icon: "crown" }],
    moves: [{ path: ["a15257a", "ae067b5"], kind: "march" }] },
  { phase: "sword", title: "Amnon, Tamar and Absalom", icon: "drop", year: "Year not given", verse: 10013038,
    claims: [evClaim(19), from("World stage · Geshur", WS[6].claim)],
    pieces: [{ place: "af6c325", role: "rival", label: "Absalom in Geshur", icon: "user" }],
    moves: [{ path: ["a15257a", "af6c325"], kind: "flight", role: "rival", label: "Absalom flees" }] },
  { phase: "sword", title: "Absalom's revolt at Hebron", icon: "flag", year: "Year not given", verse: 10015010,
    claims: [evClaim(20)], questions: ["david-absalom-forty"], notSaid: [3],
    pieces: [{ place: "a85151a", role: "rival", label: "Absalom proclaimed king", icon: "flag" }, { place: "a15257a", role: "david", label: "David", icon: "crown" }] },
  { phase: "sword", title: "The flight over Kidron and Olivet", icon: "route", year: "Year not given", verse: 10015030,
    claims: [evClaim(21)], notSaid: [3],
    pieces: [{ place: "ae5bfe9", role: "david", label: "David at Mahanaim", icon: "tent", verse: 10017024 }, { place: "a15257a", role: "rival", label: "Absalom enters Jerusalem", icon: "flag", verse: 10016015 }],
    moves: [{ path: ["a15257a", "a553110", "ac2c4c5", "a9ed5a4", "ae686c9", "ae5bfe9"], kind: "flight", stops: [10015014, 10015023, 10015030, 10016005, 10017022, 10017024] }],
    waypoints: true, extraVerses: [10017027] },
  { phase: "sword", title: "The wood of Ephraim", icon: "tree", year: "Year not given", verse: 10018033,
    claims: [evClaim(22)],
    pieces: [{ place: "aa24ad4", role: "rival", label: "Absalom falls", icon: "flag", falls: true, verse: 10018006 }, { place: "ae5bfe9", role: "david", label: "David at Mahanaim", icon: "tent" }],
    moves: [{ path: ["ae5bfe9", "aa24ad4"], kind: "march", label: "David's men" }] },
  { phase: "sword", title: "Back over the Jordan, and Sheba", icon: "route", year: "Year not given", verse: 10020001,
    claims: [evClaim(23), evClaim(24), from("The people", NAT.people[3])],
    pieces: [{ place: "a15257a", role: "david", label: "David home", icon: "crown" }, { place: "abffcaa", role: "rival", label: "Sheba's end", icon: "flag", falls: true, verse: 10020015 }],
    moves: [{ path: ["ae5bfe9", "ae686c9", "ab94aea", "a15257a"], kind: "march", stops: [10017024, 10019015, 10019015, 10020003] }, { path: ["a15257a", "abffcaa"], kind: "pursuit", label: "Joab after Sheba" }] },
  { phase: "last", title: "Famine, and the giants of Gath", icon: "swords", year: "Year not given", verse: 10023001,
    claims: [evClaim(25), evClaim(26), evClaim(27)], differ: [4, 10],
    pieces: [{ place: "aede336", role: "ally", label: "The Gibeonites", icon: "users" }, { place: "aea4530", role: "enemy", label: "Battles at Gob", icon: "swords", verse: 10021018 }, { place: "a18873f", role: "enemy", label: "The giant of Gath", icon: "swords", verse: 10021020 }] },
  { phase: "last", title: "The census, nine months and twenty days", icon: "list", year: "Year not given", verse: 10024008,
    claims: [evClaim(28), evClaim(29), from("The verdict", VN[2])], differ: [0, 1, 2], questions: ["david-census"], prophets: [1],
    pieces: [{ place: "a15257a", role: "david", label: "Jerusalem", icon: "crown" }],
    moves: [{ path: ["a15257a", "ae686c9", "ae46f2e", "a095b6e", "ae73b90", "a513646", "a98e4d7", "a160272", "ad2f6c2", "a15257a"], kind: "circuit", label: "Joab's count", stops: [10024004, 10024005, 10024005, 10024005, 10024006, 10024006, 10024006, 10024007, 10024007, 10024008] }],
    waypoints: true },
  { phase: "last", title: "The threshingfloor of Araunah", icon: "flame", year: "Year not given", verse: 10024025,
    claims: [evClaim(30), from("Worship", NAT.worship[3])], differ: [3], prophets: [1],
    pieces: [{ place: "a15257a", role: "ark", label: "Altar on the threshingfloor", icon: "flame" }] },
  { phase: "last", title: "Preparing for the temple", icon: "temple", year: "Year not given", verse: 13022005, chroniclesOnly: true,
    claims: [evClaim(31), from("Building", NAT.building[3])],
    pieces: [{ place: "a15257a", role: "ark", label: "Stores for the house", icon: "temple" }] },
  { phase: "last", title: "Adonijah's bid; Solomon anointed", icon: "oil", year: "Year not given", verse: 11001039,
    claims: [evClaim(32)], differ: [13], prophets: [2],
    pieces: [{ place: "af9cfc9", role: "rival", label: "Adonijah's feast at En-rogel", icon: "flag", falls: true, verse: 11001009 }, { place: "a2a303c", role: "david", label: "Solomon anointed at Gihon", icon: "oil", verse: 11001038 }] },
  { phase: "last", title: "Charge and death", icon: "candle", year: "Reign year 40", yearN: 40, verse: 11002010,
    claims: [evClaim(33), from("Kings", D.records[1].death), from("Chronicles", D.records[2].death)], extraVerses: [11002011],
    pieces: [{ place: "a84f426", role: "david", label: "Buried in the city of David", icon: "candle" }] },
];

// Resolve every turn: places, verses, the claims' copies.
const turns = T.map((t, i) => {
  verse(t.verse);
  (t.extraVerses ?? []).forEach(verse);
  const pieces = t.pieces.map((p) => { place(p.place); if (p.verse) verse(p.verse); return p; });
  const moves = (t.moves ?? []).map((m) => { if (m.stops && m.stops.length !== m.path.length) fail(`turn ${i + 1}: ${m.stops.length} stop verses for ${m.path.length} places`); m.path.forEach(place); (m.stops ?? []).forEach(verse); if (m.verse) verse(m.verse); return m; });
  (t.offboard ?? []).forEach((o) => { place(o.place); verse(o.verse); });
  const events = t.claims.filter((c) => c.event !== undefined).map((c) => c.event);
  return { n: i + 1, ...t, pieces, moves, events };
});
// Every event of the reign is on some turn.
const covered = new Set(turns.flatMap((t) => t.events));
EV.forEach((e, i) => { if (!covered.has(i)) fail(`event ${i} (${e.label}) is on no turn`); });

// World stage powers, each standing at its city or land as the Atlas places it.
const POWER_PLACES = [["ac71e65", "a18873f"], ["a4aa78a", "a69c1d4"], ["ac62cbc"], ["ae067b5"], ["aa0b1d6", "a2735ff"], ["a160272"], ["af6c325"], ["ab95484"]];
const powers = WS.map((w, i) => ({ ...w, places: (POWER_PLACES[i] ?? fail(`no places for power ${w.power}`)).map((id) => (place(id), id)) }));

// All the places named on David's reign page.
D.places.forEach((p) => place(p.placeId));
D.events.forEach((e) => e.placeId && place(e.placeId));
place(D.capital.placeId);

// Every reference in the data gets its verse text (for the key-verse lines and the passage tips).
const atlas = {};
for (const id of usedPlaces) { const p = placeById.get(id); atlas[id] = { name: p.name, type: p.type, lon: p.lon, lat: p.lat, confidence: p.confidence, xy: xy(p.lon, p.lat) }; }
const usedBooks = {};
const noteBook = (id) => { const b = Math.floor(id / 1e6); usedBooks[b] = books[b]; };
JSON.stringify({ D, person, turns }, (k, v) => { if (typeof v === "number" && v > 1e6 && v < 7e7) noteBook(v); return v; });
for (const id of Object.keys(verses)) noteBook(Number(id));

const out = {
  about: "Extracted by design/david-directions/war-table/extract.mjs from src/data/people-pages/rulers-united-kingdom.json, data/study/people/david-rut-4-17.json, data/places.json, data/text/kjv, data/catalog.json, world-atlas land-10m and the street atlas's OpenStreetMap tiles. Do not edit by hand.",
  credit: {
    people: "People, families and references: TIPNR by STEP Bible (STEPBible.org, Tyndale House Cambridge), CC BY 4.0.",
    map: "Coastline: Natural Earth via world-atlas (public domain). Lakes and rivers: © OpenStreetMap contributors (ODbL), via the Protomaps build the Atlas street map uses. Places: the Atlas's own places (data/places.json), each with its confidence.",
  },
  person: { id: D.id, name: D.name, title: D.title, tagline: D.tagline, house: D.house, tribe: D.tribe, capital: D.capital, order: D.order, predecessor: D.predecessor, successor: D.successor, short: person.story.short },
  story: person.story.paragraphs,
  identifications: D.identifications, records: D.records, reign: D.reign, dates: D.dates, verdictTone: D.verdictTone, verdictNotes: D.verdictNotes,
  accession: D.accession, events: D.events, nation: D.nation, prophets: D.prophets, worldStage: D.worldStage, outside: D.outside,
  twoAccounts: D.twoAccounts, questions: D.questions, notSaid: D.notSaid, places: D.places, passages: D.passages, citations: group.citations,
  phases: PHASES, turns, powers,
  map: { w: WIDTH, h: HEIGHT, bounds: BOUNDS, scale: projection.scale(), translate: projection.translate(), land, lakes, rivers, peaks, riverNames: [...riverNames].sort() },
  atlas, books: usedBooks, verses,
};
writeFileSync(join(HERE, "data", "david.json"), JSON.stringify(out));
console.log(`david.json: ${turns.length} turns, ${Object.keys(atlas).length} places, ${Object.keys(verses).length} verses, land ${land.length} rings / ${land.reduce((s, r) => s + r.length / 2, 0)} pts, lakes ${lakes.length}, rivers ${rivers.length} (${[...riverNames].join(", ")}), ${(JSON.stringify(out).length / 1024).toFixed(0)} KB`);
