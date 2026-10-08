// Extracts David's REAL data for the "Life helix" mock-up into data/david.json.
// Run: node design/david-directions/helix/extract.mjs   (from Website/)
// Every text in the output is copied from the site's reviewed files or the KJV text files. The only things decided
// here are presentation: which crystal colour (kind) an event gets, and where an undated event sits on the helix
// (in the order the text tells it, evenly spaced between the moments Scripture dates). Fails loudly if anything is
// missing.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(HERE, "../../..") + "/";
const OUT = HERE + "/data/david.json";
const json = (p) => JSON.parse(readFileSync(SITE + p, "utf8"));
const fail = (msg) => { throw new Error(`extract: ${msg}`); };

const group = json("src/data/people-pages/rulers-united-kingdom.json");
const ruler = group.rulers.find((r) => r.id === "david-rut-4-17") ?? fail("David missing from rulers-united-kingdom.json");
const person = json("data/study/people/david-rut-4-17.json");
const places = json("data/places.json");
const catalog = json("data/catalog.json");

// ── KJV text ──────────────────────────────────────────────────────────────
const books = Object.fromEntries(catalog.books.map((b) => [b.num, { code: b.code, name: b.name }]));
const chapterCache = new Map();
function chapter(num, ch) {
  const code = books[num]?.code ?? fail(`no book ${num}`);
  if (!chapterCache.has(code)) {
    const all = {};
    for (const f of readdirSync(`${SITE}data/text/kjv/${code}`)) Object.assign(all, JSON.parse(readFileSync(`${SITE}data/text/kjv/${code}/${f}`, "utf8")));
    chapterCache.set(code, all);
  }
  return chapterCache.get(code)[String(ch)] ?? fail(`KJV ${code} ${ch} not found`);
}
const parts = (id) => ({ book: Math.floor(id / 1e6), ch: Math.floor((id % 1e6) / 1e3), v: id % 1e3 });
function verseText(id) {
  const { book, ch, v } = parts(id);
  const found = chapter(book, ch).v.find((x) => x.n === String(v)) ?? fail(`KJV verse ${id} not found`);
  return found.r.map((t) => (typeof t === "string" ? t : Array.isArray(t) ? t[0] : "")).join("").replace(/¶/g, "").replace(/\s+/g, " ").trim();
}
const kjv = (id) => ({ ref: [id, id], text: verseText(id) });
const inSpan = (id, [a, b]) => id >= a && id <= b;
// Every verse id inside a span, within one chapter run (spans here never cross books).
function* versesIn([a, b]) {
  let id = a;
  while (id <= b) {
    const { book, ch, v } = parts(id);
    const has = chapter(book, ch).v.some((x) => x.n === String(v));
    if (has) { yield id; id += 1; } else { id = book * 1e6 + (ch + 1) * 1e3 + 1; }
  }
}
// The key verse of a claim: the verse that holds its first quotation, else the first verse of its first span.
const norm = (t) => t.toLowerCase().replace(/[’‘]/g, "'");
function keyVerse(claim, at) {
  const spans = claim.refs ?? [];
  if (!spans.length) return null;
  if (at) { if (!spans.some((s) => inSpan(at, s))) fail(`key verse ${at} is outside the claim's refs`); return kjv(at); }
  const quoted = [...claim.text.matchAll(/[“"]([^”"]{6,})[”"]/g)].map((m) => m[1].replace(/[,.;:!?]+$/, "").trim());
  for (const q of quoted) {
    const probe = norm(q.split(/\s+/).slice(0, 5).join(" "));
    for (const span of spans) for (const id of versesIn(span)) if (norm(verseText(id)).includes(probe)) return kjv(id);
  }
  return kjv(spans[0][0]);
}

// ── Places ─────────────────────────────────────────────────────────────────
const placeById = (id) => places.find((p) => p.id === id) ?? fail(`place ${id} not in places.json`);
const JERUSALEM = placeById("a15257a");
const toRad = (d) => (d * Math.PI) / 180;
function fromJerusalem(p) {
  const R = 6371, dLat = toRad(p.lat - JERUSALEM.lat), dLon = toRad(p.lon - JERUSALEM.lon);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(JERUSALEM.lat)) * Math.cos(toRad(p.lat)) * Math.sin(dLon / 2) ** 2;
  const km = Math.round(2 * R * Math.asin(Math.sqrt(a)));
  const y = Math.sin(dLon) * Math.cos(toRad(p.lat)), x = Math.cos(toRad(JERUSALEM.lat)) * Math.sin(toRad(p.lat)) - Math.sin(toRad(JERUSALEM.lat)) * Math.cos(toRad(p.lat)) * Math.cos(dLon);
  const deg = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  const dirs = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
  return { km, bearing: Math.round(deg), dir: dirs[Math.round(deg / 45) % 8] };
}
// How far from Jerusalem, in words, only where a point distance means something: a located settlement, hill or
// spring. Regions and rivers say what they are; low-confidence sites say so.
function whereText(p, pl) {
  if (p.placeId === JERUSALEM.id) return "The capital";
  if (pl.type === "region") return "A region";
  if (pl.type === "river") return "A river";
  if ((pl.confidence ?? 0) < 0.4) return "Site uncertain in the Atlas";
  const f = fromJerusalem(pl);
  if (f.km < 2) return "At Jerusalem in the Atlas";
  return `${f.km} km ${f.dir} of Jerusalem`;
}
const placeOf = (placeId) => {
  if (!placeId) return null;
  const p = placeById(placeId);
  const listed = ruler.places.find((x) => x.placeId === placeId);
  return { placeId, name: listed?.name ?? p.name, note: listed?.note ?? null, lon: p.lon, lat: p.lat };
};

// ── Story sentences (site-written paragraphs), selected by their own opening words ──
const para = (i) => person.story.paragraphs[i] ?? fail(`story paragraph ${i} missing`);
function storyClaim(i, opening, refs) {
  const p = para(i);
  const sentences = p.text.match(/[^.!?]+(?:[.!?]+["”]?|$)\s*/g).map((s) => s.trim());
  const text = sentences.find((s) => s.startsWith(opening)) ?? fail(`story ${i}: no sentence starting "${opening}"`);
  for (const r of refs) if (!p.refs.some((x) => x[0] === r[0] && x[1] === r[1])) fail(`story ${i}: ref ${r} not in the paragraph's refs`);
  return { text, layer: "story", refs };
}

// ── Crystal kinds (this mock-up's grouping; the data's own kind is kept beside it) ──
const KIND_OF_EVENT = {
  "King over Judah at Hebron": "anointing", "War with the house of Saul": "battle", "King over all Israel": "anointing",
  "Jerusalem taken": "battle", "Philistines beaten in the valley of Rephaim": "battle", "Hiram's embassy": "building",
  "Uzzah struck down": "worship", "The ark comes to Jerusalem": "worship", "Nathan's promise of a house": "word",
  "Philistines and Moab subdued": "battle", "Zobah and Damascus": "battle", "Toi of Hamath sends gifts": "court",
  "Garrisons in Edom": "battle", "Kindness to Mephibosheth": "family", "Ammon and the Syrians": "battle",
  "Bathsheba and Uriah": "sin", "“Thou art the man”": "sin", "Solomon born": "family", "Rabbah taken": "battle",
  "Amnon, Tamar and Absalom": "family", "Absalom's revolt": "battle", "Flight over the mount of Olives": "family",
  "The wood of Ephraim": "battle", "Return, and Judah and Israel quarrel": "court", "Sheba son of Bichri": "battle",
  "Famine and the Gibeonites": "sin", "Philistine giants": "battle", "The song and last words": "worship",
  "The census": "sin", "The plague": "sin", "Altar on Araunah's threshingfloor": "worship",
  "Preparing for the temple": "building", "Adonijah's bid; Solomon anointed": "anointing", "Charge and death": "family",
};
for (const e of ruler.events) if (!KIND_OF_EVENT[e.label]) fail(`no crystal kind chosen for event "${e.label}"`);
if (Object.keys(KIND_OF_EVENT).length !== ruler.events.length) fail("KIND_OF_EVENT names an event the data does not have");

// ── Before the throne: moments from the person's story and the ruler file, in the order the text tells them ──
const accession = ruler.accession;
const pick = (list, test, where) => list.find(test) ?? fail(`not found in ${where}`);
const before = [
  { id: "jesse", label: "Son of Jesse", kind: "family", source: "story", claim: storyClaim(0, "David was the son of Jesse", [[8004013, 8004017]]), placeId: "a112427", at: 8004017 },
  { id: "anointed-samuel", label: "Anointed by Samuel at Bethlehem", kind: "anointing", source: "accession", claim: accession[0], placeId: "a112427", anointing: 1 },
  { id: "court", label: "Harp player at Saul's court", kind: "court", source: "story", claim: storyClaim(1, "He came to Saul's court", [[9016021, 9016023]]) },
  { id: "goliath", label: "Goliath", kind: "battle", source: "story", claim: storyClaim(1, "Sent to bring food", [[9017017, 9017018], [9017045, 9017050]]) },
  { id: "jonathan", label: "Covenant with Jonathan", kind: "family", source: "story", claim: storyClaim(1, "Saul's son Jonathan", [[9018001, 9018003]]) },
  { id: "michal", label: "Michal and the window", kind: "family", source: "story", claim: storyClaim(1, "David married Saul's daughter Michal", [[9018027, 9018027], [9019011, 9019012]]), at: 9019012 },
  { id: "adullam", label: "The cave of Adullam", kind: "family", source: "story", claim: storyClaim(2, "At the cave of Adullam", [[9022001, 9022004]]), placeId: "af82614" },
  { id: "spared-saul", label: "“The LORD's anointed” spared", kind: "anointing", source: "story", claim: storyClaim(2, "Twice he had Saul", [[9024004, 9024007], [9026009, 9026011]]) },
  { id: "abigail", label: "Abigail and Ahinoam", kind: "family", source: "story", claim: storyClaim(2, "He married Abigail", [[9025039, 9025044]]) },
  { id: "ziklag", label: "Ziklag, from Achish", kind: "court", source: "nation.alliances", claim: pick(ruler.nation.alliances, (c) => c.text.startsWith("Before he reigned he had served Achish"), "nation.alliances"), placeId: "a0ed7ff" },
  { id: "amalek", label: "Ziklag's spoil recovered", kind: "battle", source: "worldStage", claim: pick(ruler.worldStage, (w) => w.power === "Amalek", "worldStage").claim, placeId: "a0ed7ff" },
  { id: "lament", label: "“How are the mighty fallen!”", kind: "worship", source: "story", claim: storyClaim(2, "When Saul and Jonathan died", [[10001017, 10001019]]) },
];

// Key verses chosen by hand where the first verse of the span is only scene-setting (each must lie inside the refs).
const KEY_VERSE = { "Uzzah struck down": 10006007, "Flight over the mount of Olives": 10015030, "King over all Israel": 10005003 };

// ── Positions on the helix (years of his life, 0–70: "thirty years old … reigned forty years", 2 Sam 5:4) ──
const ACCESSION = 30, ALL_ISRAEL = 37.5, DEATH = 70;
const spread = (n, a, b) => Array.from({ length: n }, (_, i) => (n === 1 ? (a + b) / 2 : a + (i * (b - a)) / (n - 1)));
const ev = (label) => ruler.events.findIndex((e) => e.label === label);
const iJudah = ev("King over Judah at Hebron"), iIsrael = ev("King over all Israel"), iDeath = ev("Charge and death");
if ([iJudah, iIsrael, iDeath].includes(-1)) fail("dated anchor events missing");
const hebron = ruler.events.slice(iJudah + 1, iIsrael), jerusalem = ruler.events.slice(iIsrael + 1, iDeath);
const yearOf = new Map();
spread(before.length, 1, 28.6).forEach((y, i) => yearOf.set(before[i].id, y));
yearOf.set(ruler.events[iJudah].label, ACCESSION);
spread(hebron.length, ACCESSION + 1.6, ALL_ISRAEL - 1.6).forEach((y, i) => yearOf.set(hebron[i].label, y));
yearOf.set(ruler.events[iIsrael].label, ALL_ISRAEL);
spread(jerusalem.length, ALL_ISRAEL + 1.1, DEATH - 1.1).forEach((y, i) => yearOf.set(jerusalem[i].label, y));
yearOf.set(ruler.events[iDeath].label, DEATH);

// ── Chronicles: what the second account tells, leaves out, or tells alone ──
const leavesOut = pick(ruler.twoAccounts, (t) => t.topic === "What Chronicles leaves out", "twoAccounts");
const omitted = leavesOut.first.refs;
const isChr = (s) => Math.floor(s[0] / 1e6) === 13;
const rungSource = ruler.twoAccounts.filter((t) => t !== leavesOut);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const reignCrystals = ruler.events.map((e) => {
  const refs = e.claim.refs ?? [];
  const samuelRefs = refs.filter((s) => !isChr(s));
  const first = samuelRefs[0]?.[0];
  let chronicles = "unknown";
  if (!samuelRefs.length) chronicles = "only";
  else if (refs.some(isChr)) chronicles = "told";
  else if (e.label === "Rabbah taken") chronicles = "told"; // leavesOut.second: Chronicles "tells the city's fall" (1 Chr 20:1–4)
  else if (omitted.some((s) => inSpan(first, s))) chronicles = "left-out";
  const year = yearOf.get(e.label);
  const dated = e.year ? { reignYear: e.year, age: year } : null;
  return {
    id: slug(e.label), label: e.label, kind: KIND_OF_EVENT[e.label], dataKind: e.kind, source: "events", claim: e.claim,
    year, dated, segment: year < ALL_ISRAEL ? "hebron" : "jerusalem", strand: chronicles === "only" ? "chr" : "sk", chronicles,
    place: placeOf(e.placeId), verse: keyVerse(e.claim, KEY_VERSE[e.label]),
    anointing: e.label === "King over Judah at Hebron" ? 2 : e.label === "King over all Israel" ? 3 : undefined,
  };
});
if (!reignCrystals.find((c) => c.label === "Rabbah taken")) fail("Rabbah event missing");
if (!leavesOut.second.text.includes("tells the city's fall")) fail("leavesOut.second no longer says Chronicles tells Rabbah's fall");

const beforeCrystals = before.map((b) => ({
  id: b.id, label: b.label, kind: b.kind, dataKind: null, source: b.source, claim: b.claim, year: yearOf.get(b.id), dated: null,
  segment: "before", strand: "sk", chronicles: "none", place: placeOf(b.placeId), verse: keyVerse(b.claim, b.at), anointing: b.anointing,
}));
const crystals = [...beforeCrystals, ...reignCrystals];
const ids = new Set();
for (const c of crystals) { if (ids.has(c.id)) fail(`duplicate crystal id ${c.id}`); ids.add(c.id); if (c.year == null) fail(`no year for ${c.label}`); }

// Rungs: each place where the two accounts differ, joined to the Samuel–Kings crystal whose verses hold it
// (or the last crystal before it in the text).
const skCrystals = reignCrystals.filter((c) => c.strand === "sk");
const firstOf = (c) => c.claim.refs.filter((s) => !isChr(s))[0][0];
const rungs = rungSource.map((t) => {
  const at = t.first.refs[0][0];
  const holder = skCrystals.find((c) => c.claim.refs.some((s) => !isChr(s) && inSpan(at, s)))
    ?? [...skCrystals].filter((c) => firstOf(c) <= at).pop() ?? fail(`no crystal for rung "${t.topic}"`);
  return { id: "rung-" + slug(t.topic), topic: t.topic, first: t.first, second: t.second, crystalId: holder.id, year: holder.year };
});
// Rungs on the same crystal are fanned out a little in height so each can be clicked.
const byCrystal = new Map();
for (const r of rungs) byCrystal.set(r.crystalId, [...(byCrystal.get(r.crystalId) ?? []), r]);
for (const list of byCrystal.values()) list.forEach((r, i) => { r.year = +(r.year + (i - (list.length - 1) / 2) * 0.55 + (list.length === 1 ? 0 : 0)).toFixed(2); });

// Stretches of the Chronicles strand where Chronicles is silent (from leavesOut), as year ranges on the helix.
const gaps = [];
let run = null;
const reignSorted = [...reignCrystals].filter((c) => c.segment === "jerusalem").sort((a, b) => a.year - b.year);
for (const c of reignSorted) {
  if (c.chronicles === "left-out") { run = run ?? { from: c.year, to: c.year, labels: [] }; run.to = c.year; run.labels.push(c.label); }
  else if (run) { gaps.push(run); run = null; }
}
if (run) gaps.push(run);
const step = (DEATH - 1.1 - (ALL_ISRAEL + 1.1)) / (jerusalem.length - 1);
for (const g of gaps) { g.from = +(g.from - step * 0.5).toFixed(2); g.to = +(g.to + step * 0.5).toFixed(2); }

// ── Every passage: the person's verses grouped by chapter ──
const chapters = [];
for (const id of person.refs) {
  const { book, ch } = parts(id);
  const last = chapters[chapters.length - 1];
  if (last && last.book === book && last.ch === ch) last.n += 1; else chapters.push({ book, ch, n: 1, first: id });
}

// ── Citations actually used ──
const used = new Set();
const walk = (x) => { if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === "object") { if (Array.isArray(x.cites)) x.cites.forEach((c) => used.add(c)); Object.values(x).forEach(walk); } };
walk(ruler); walk(group.intro);
const citations = [...used].map((id) => group.citations.find((c) => c.id === id) ?? fail(`citation ${id} missing`));

const out = {
  about: "Extracted by design/david-directions/helix/extract.mjs from src/data/people-pages/rulers-united-kingdom.json, data/study/people/david-rut-4-17.json, data/places.json and data/text/kjv. Do not edit by hand.",
  books,
  person: {
    id: ruler.id, name: ruler.name, title: ruler.title, tagline: ruler.tagline, house: ruler.house, tribe: ruler.tribe,
    capital: ruler.capital, reign: ruler.reign, short: person.story.short, describe: person.b, era: person.e, storyBy: person.storyBy,
    verseCount: person.refs.length, predecessor: ruler.predecessor, successor: ruler.successor, order: ruler.order,
  },
  hero: { verse: kjv(10005004), hebron: kjv(10005005) },
  scale: { accession: ACCESSION, allIsrael: ALL_ISRAEL, death: DEATH },
  crystals, rungs, chronicles: { start: ALL_ISRAEL, gaps, leavesOut },
  story: person.story.paragraphs, intro: group.intro, identifications: ruler.identifications,
  accession, records: ruler.records, dates: ruler.dates, verdictTone: ruler.verdictTone, verdictNotes: ruler.verdictNotes,
  verdictVerse: kjv(11015005), nation: ruler.nation, prophets: ruler.prophets, worldStage: ruler.worldStage, outside: ruler.outside,
  twoAccounts: ruler.twoAccounts, questions: ruler.questions, notSaid: ruler.notSaid,
  places: ruler.places.map((p) => { const pl = placeById(p.placeId); return { ...p, lon: pl.lon, lat: pl.lat, type: pl.type, confidence: pl.confidence, where: whereText(p, pl), crystals: crystals.filter((c) => c.place?.placeId === p.placeId).map((c) => c.id) }; }),
  passages: ruler.passages, chapters, citations,
};
writeFileSync(OUT, JSON.stringify(out));
console.log(`wrote ${OUT}: ${crystals.length} crystals (${beforeCrystals.length} before the throne), ${rungs.length} rungs, ${gaps.length} Chronicles gaps, ${chapters.length} chapters, ${citations.length} citations`);
