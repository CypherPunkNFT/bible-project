// node design/apostle-directions/build/extract.cjs — builds design/apostle-directions/data/ from the site's reviewed data: the apostle records (apostles-1/2.json), the
// person files (story, family), the harmony, places (lon/lat), Paul's journeys, and the KJV. Validates the thread.
const fs = require("fs");
const { verse, span, books, W } = require("./kjv.cjs");
const THREADS = require("./threads.cjs");
const OUT = W + "/design/apostle-directions/data";
fs.mkdirSync(OUT, { recursive: true });
const read = (p) => JSON.parse(fs.readFileSync(W + "/" + p, "utf8"));
const A1 = read("src/data/people-pages/apostles-1.json"), A2 = read("src/data/people-pages/apostles-2.json");
const places = read("data/places.json"), placeById = Object.fromEntries(places.map((p) => [p.id, p]));
const harmony = read("data/study/harmony.json"), letters = read("src/data/letters/paul-letters.json");
const errors = [];

// ── Shared: books and the harmony in order ──
const bookList = Object.values(books).map((b) => ({ num: b.num, code: b.code, name: b.name }));
fs.writeFileSync(OUT + "/books.json", JSON.stringify(bookList));
const sections = [];
for (const part of harmony.parts) for (const s of part.sections) sections.push({ n: s.n, title: s.title, part: part.n, partTitle: part.title, books: Object.keys(s.refs) });
fs.writeFileSync(OUT + "/harmony.json", JSON.stringify(sections));
const ordOf = Object.fromEntries(sections.map((s, i) => [s.n, i]));

// ── Thread validation ──
const norm = (s) => s.replace(/\s+/g, " ").trim();
function checkLine(line, where) {
  const v = verse(line.v);
  const parts = line.t.split(" … ").map(norm);
  let at = 0;
  for (const part of parts) {
    const i = v.text.indexOf(part, at);
    if (i < 0) { errors.push(`${where}: "${part}" not in ${line.v} "${v.text}"`); return; }
    at = i + part.length;
  }
  if (line.who === "j") {
    const red = norm(v.segs.filter((s) => s.j).map((s) => s.t).join(" | "));
    for (const part of parts) { const bare = part.replace(/[.,;:?!]+$/, ""); if (!red.replace(/ \| /g, " ").includes(bare) && !red.split(" | ").some((r) => norm(r).includes(bare))) errors.push(`${where}: Jesus line not red-letter in ${line.v}: "${part}"`); }
  } else if (v.segs.some((s) => s.j && norm(s.t).length > 3 && parts.some((p) => p.includes(norm(s.t))))) {
    errors.push(`${where}: line marked ${line.who} contains red-letter words in ${line.v}`);
  }
}

// ── Coordinates ──
const ll = (id) => { const p = placeById[id]; return p && Number.isFinite(p.lon) ? [p.lon, p.lat] : null; };

// ── Globe specs (chapters and arcs), our presentation of the reviewed data ──
const arc = (id, from, to, kind, label, extra = {}) => ({ id, from, to, kind, label, ...extra });
const GLOBE = {
  "peter-mat-4-18": {
    arcs: [
      arc("s1", "a562fcc", "ab7bf48", "scripture", "Into the coasts of Caesarea Philippi", { refs: [[40016013, 40016013]] }),
      arc("s2", "ab7bf48", "a15257a", "scripture", "With Jesus to Jerusalem", { refs: [[41011020, 41011021], [41011027, 41011027]] }),
      arc("s3", "a15257a", "a562fcc", "scripture", "Back to the sea of Tiberias", { refs: [[43021001, 43021003]] }),
      arc("s4", "a562fcc", "a15257a", "scripture", "Jerusalem, at Pentecost", { refs: [[44002014, 44002014]] }),
      arc("s5", "a15257a", "a282dce", "scripture", "Sent with John to Samaria", { refs: [[44008014, 44008014]] }),
      arc("s6", "a282dce", "a15257a", "scripture", "Returned to Jerusalem", { refs: [[44008025, 44008025]] }),
      arc("s7", "a15257a", "a2c5cc7", "scripture", "Down to the saints at Lydda", { refs: [[44009032, 44009032]] }),
      arc("s8", "a2c5cc7", "ae023a9", "scripture", "Sent for to Joppa", { refs: [[44009038, 44009038]] }),
      arc("s9", "ae023a9", "a58735e", "scripture", "To Cornelius at Caesarea", { refs: [[44010024, 44010024]] }),
      arc("s10", "a58735e", "a15257a", "scripture", "Up to Jerusalem to answer for it", { refs: [[44011002, 44011002]] }),
      arc("s11", "a15257a", "ae41ab4", "scripture", "Peter at Antioch (Galatians 2:11)", { refs: [[48002011, 48002011]] }),
      arc("t1", "ae41ab4", "a83a43e", "tradition", "Preached in Pontus, Galatia, Bithynia, Cappadocia and Asia", { trad: 8 }),
      arc("t2", "a83a43e", "afc8e7a", "tradition", "“At last, having come to Rome”", { trad: 8 }),
      arc("t3", "ae41ab4", "afc8e7a", "tradition", "Bishop of Antioch, then Rome “in the second year of Claudius”", { trad: 10 }),
    ],
    chapters: [
      { id: "home", title: "Bethsaida and Capernaum", kicker: "Home", focus: "af2161c", zoom: 9, pins: ["a91b732", "af2161c"], parts: ["home", "trade", "family", "identifications"] },
      { id: "call", title: "Called by the sea of Galilee", kicker: "The call", focus: "a562fcc", zoom: 9, pins: ["a562fcc"], parts: ["calling", "lists"] },
      { id: "jesus", title: "With Jesus", kicker: "27 moments in the Gospels", focus: "ab7bf48", zoom: 6, pins: ["a562fcc", "ab7bf48", "a15257a"], arcs: ["s1", "s2", "s3"], parts: ["moments"] },
      { id: "jerusalem", title: "Jerusalem", kicker: "Acts 1–5", focus: "a15257a", zoom: 8, pins: ["a15257a"], arcs: ["s4"], acts: [0, 1, 2, 3, 4] },
      { id: "samaria", title: "Samaria", kicker: "Acts 8", focus: "a282dce", zoom: 8, pins: ["a282dce"], arcs: ["s5", "s6"], acts: [5] },
      { id: "coast", title: "Lydda, Joppa and Caesarea", kicker: "Acts 9–11", focus: "ae023a9", zoom: 8, pins: ["a2c5cc7", "ae023a9", "a58735e"], arcs: ["s7", "s8", "s9", "s10"], acts: [6, 7] },
      { id: "escape", title: "Prison, and “another place”", kicker: "Acts 12–15", focus: "a15257a", zoom: 7, pins: ["a15257a"], acts: [8, 9, 10] },
      { id: "antioch", title: "Antioch, and the letters", kicker: "Galatians · 1 Corinthians · 1 Peter", focus: "ae41ab4", zoom: 5, pins: ["ae41ab4"], arcs: ["s11"], acts: [11, 12, 13], parts: ["writings"] },
      { id: "end", title: "How the story ends", kicker: "Scripture beside tradition", focus: "afc8e7a", zoom: 2.6, pins: ["a83a43e", "afc8e7a"], arcs: ["t1", "t2", "t3"], parts: ["ending"] },
      { id: "world", title: "Everything at once", kicker: "Companions · questions · sources", focus: [24, 38], zoom: 2, parts: ["companions", "questions", "notSaid", "sources"], all: true },
    ],
  },
  "paul-act-7-58": {
    arcs: [
      arc("s1", "a666ea0", "a15257a", "scripture", "Brought up in Jerusalem “at the feet of Gamaliel”", { refs: [[44022003, 44022003]] }),
      arc("s2", "a15257a", "a69c1d4", "scripture", "To Damascus with letters from the high priest", { refs: [[44009001, 44009003]] }),
      arc("s3", "a69c1d4", "a0f4ea8", "scripture", "Into Arabia", { refs: [[48001017, 48001017]] }),
      arc("s4", "a0f4ea8", "a69c1d4", "scripture", "Returned again unto Damascus", { refs: [[48001017, 48001017]] }),
      arc("s5", "a69c1d4", "a15257a", "scripture", "Up to Jerusalem to see Peter", { refs: [[48001018, 48001018], [44009026, 44009026]] }),
      arc("s6", "a15257a", "a666ea0", "scripture", "Sent forth to Tarsus", { refs: [[44009030, 44009030]] }),
      arc("s7", "a666ea0", "ae41ab4", "scripture", "Barnabas brings him to Antioch", { refs: [[44011025, 44011026]] }),
      arc("s8", "ae41ab4", "a15257a", "scripture", "Up to Jerusalem for the council", { refs: [[44015002, 44015004]] }),
      arc("t1", "afc8e7a", "a3f0f69", "tradition", "“The farthest bounds of the West”; the journey to Spain", { trad: 0, also: [2] }),
    ],
    journeys: ["journey-1", "journey-2", "journey-3", "voyage-rome"],
    chapters: [
      { id: "home", title: "Tarsus", kicker: "Born a citizen of no mean city", focus: "a666ea0", zoom: 6, pins: ["a666ea0"], parts: ["home", "trade", "family", "identifications"] },
      { id: "jerusalem", title: "Jerusalem", kicker: "The persecutor", focus: "a15257a", zoom: 6, pins: ["a15257a"], arcs: ["s1"], acts: [0, 1] },
      { id: "call", title: "Damascus", kicker: "The call, told four times", focus: "a69c1d4", zoom: 6, pins: ["a69c1d4"], arcs: ["s2"], parts: ["calling"], moments: [0, 1] },
      { id: "arabia", title: "Arabia, Damascus, Jerusalem, Tarsus", kicker: "Galatians 1 · Acts 9", focus: "a0f4ea8", zoom: 3.6, pins: ["a0f4ea8", "a69c1d4", "a15257a", "a666ea0"], arcs: ["s3", "s4", "s5", "s6"], acts: [2, 3], moments: [2] },
      { id: "antioch", title: "Antioch", kicker: "A whole year teaching", focus: "ae41ab4", zoom: 5, pins: ["ae41ab4"], arcs: ["s7"], acts: [4] },
      { id: "j1", title: "The first journey", kicker: "Cyprus, Pisidia, Lycaonia", focus: "a6c704a", zoom: 3.4, journey: "journey-1", acts: [5] },
      { id: "council", title: "The council at Jerusalem", kicker: "Acts 15 · Galatians 2", focus: "a15257a", zoom: 4, pins: ["a15257a", "ae41ab4"], arcs: ["s8"], acts: [6] },
      { id: "j2", title: "The second journey", kicker: "Macedonia and Achaia", focus: "a1fe6e7", zoom: 2.8, journey: "journey-2", acts: [7], moments: [3] },
      { id: "j3", title: "The third journey", kicker: "Three years at Ephesus", focus: "a5feb15", zoom: 3, journey: "journey-3", acts: [8], moments: [5] },
      { id: "arrest", title: "Arrest, and Caesarea", kicker: "Before Felix, Festus and Agrippa", focus: "a58735e", zoom: 6, pins: ["a15257a", "a58735e"], acts: [9], moments: [4] },
      { id: "voyage", title: "The voyage to Rome", kicker: "Shipwreck at Melita", focus: "a57835d", zoom: 2.6, journey: "voyage-rome", acts: [10] },
      { id: "rome", title: "Rome, and the letters", kicker: "Prisons, plans and the pastoral journeys", focus: "afc8e7a", zoom: 2.6, pins: ["afc8e7a", "ac405c0", "a26aa94", "af43cde"], acts: [11, 12, 13, 14], parts: ["writings"] },
      { id: "end", title: "How the story ends", kicker: "Scripture beside tradition", focus: "afc8e7a", zoom: 2, pins: ["afc8e7a", "a3f0f69"], arcs: ["t1"], parts: ["ending"] },
      { id: "world", title: "Everything at once", kicker: "Companions · questions · sources", focus: [24, 37], zoom: 1.7, parts: ["companions", "questions", "notSaid", "sources"], all: true },
    ],
  },
  "judas-mat-10-3": {
    arcs: [arc("t1", "a15257a", "ab9696f", "tradition", "Preached with Simon in Persia, where both were killed", { trad: 2 })],
    chapters: [
      { id: "jerusalem", title: "Everything Scripture tells", kicker: "Four lists, three moments, one sentence", focus: "a15257a", zoom: 5, pins: ["a15257a"], parts: ["lists", "identifications", "family", "calling", "moments", "acts"] },
      { id: "end", title: "How the story ends", kicker: "Scripture is silent; tradition is not", focus: [42, 34], zoom: 2.4, pins: ["a15257a", "ab9696f"], arcs: ["t1"], parts: ["ending"] },
      { id: "world", title: "What is left open", kicker: "Companions · questions · sources", focus: [38, 35], zoom: 2, parts: ["companions", "questions", "notSaid", "sources"], all: true },
    ],
  },
};

function journeyArcs(mapId) {
  const m = letters.maps.find((x) => x.id === mapId);
  const stops = m.stops.filter((s) => s.placeId && ll(s.placeId));
  const out = [];
  for (let i = 0; i < stops.length - 1; i++) {
    if (stops[i].placeId === stops[i + 1].placeId) continue;
    out.push({ id: `${mapId}-${i}`, from: stops[i].placeId, to: stops[i + 1].placeId, kind: "scripture", label: `${m.title}: ${stops[i].name} to ${stops[i + 1].name}`, refs: stops[i + 1].refs ?? [], journey: mapId });
  }
  return { id: mapId, title: m.title, arcs: out, stops: stops.map((s) => ({ name: s.name, placeId: s.placeId, refs: s.refs ?? [], note: s.note ?? null, ll: ll(s.placeId) })), unpinned: m.stops.filter((s) => !s.placeId || !ll(s.placeId)).map((s) => s.name) };
}

// ── Each apostle ──
const KEYS = { "peter-mat-4-18": "peter", "paul-act-7-58": "paul", "judas-mat-10-3": "thaddaeus" };
for (const [id, key] of Object.entries(KEYS)) {
  const group = A1.apostles.some((a) => a.id === id) ? A1 : A2;
  const a = group.apostles.find((x) => x.id === id);
  const person = read(`data/study/people/${id}.json`);
  // Moments with their harmony section.
  const moments = a.moments.map((m) => {
    const out = { ...m };
    if (m.harmony != null) { const i = ordOf[m.harmony]; if (i == null) errors.push(`${id}: harmony ${m.harmony} not found`); else out.h = { ord: i, ...sections[i] }; }
    return out;
  });
  // Places with coordinates.
  const placesOut = a.places.map((p) => ({ ...p, ll: p.placeId ? ll(p.placeId) : null }));
  // Thread: validate every line.
  const thread = THREADS[id];
  for (const g of thread) for (const item of g.items) for (const [ti, lines] of (item.tabs ? item.tabs.map((t) => t.lines) : [item.lines]).entries()) lines.forEach((line, li) => checkLine(line, `${key} ${item.key} tab ${ti} line ${li}`));
  // Verses for context drawers: every verse of the moment refs (each span capped at 14 verses) and of the calling.
  const verses = {};
  const addSpan = (r, cap = 14) => { try { span(r).slice(0, cap).forEach((v) => { verses[v.id] = v.text; }); } catch (e) { errors.push(`${key}: verse span ${r}: ${e.message}`); } };
  moments.forEach((m) => m.refs.forEach((r) => addSpan(r)));
  a.calling.forEach((c) => addSpan(c.quote.span));
  // Citations used anywhere in this record.
  const used = new Set();
  JSON.stringify(a, (k, v) => { if (k === "cites" && Array.isArray(v)) v.forEach((c) => used.add(c)); return v; });
  const citations = group.citations.filter((c) => used.has(c.id));
  for (const c of used) if (!citations.some((x) => x.id === c)) errors.push(`${key}: citation ${c} missing`);
  // Globe spec with coordinates resolved.
  const g = GLOBE[id];
  const resolveArc = (x) => { const f = ll(x.from), t = ll(x.to); if (!f || !t) errors.push(`${key}: arc ${x.id} has an unpinned end`); return { ...x, a: f, b: t, fromName: placeById[x.from]?.name, toName: placeById[x.to]?.name }; };
  const journeys = (g.journeys ?? []).map(journeyArcs).map((j) => ({ ...j, arcs: j.arcs.map(resolveArc) }));
  const globe = {
    arcs: g.arcs.map(resolveArc),
    journeys,
    chapters: g.chapters.map((c) => ({ ...c, focusLL: Array.isArray(c.focus) ? c.focus : ll(c.focus), pins: (c.pins ?? []).map((pid) => ({ placeId: pid, name: placeById[pid]?.name, ll: ll(pid) })) })),
  };
  for (const c of globe.chapters) if (!c.focusLL) errors.push(`${key}: chapter ${c.id} focus has no coordinates`);
  const out = {
    id, key, name: a.name, otherNames: a.otherNames, title: a.title, tagline: a.tagline,
    home: a.home ?? null, trade: a.trade ?? null, family: a.family, identifications: a.identifications, lists: a.lists ?? [],
    calling: a.calling, moments, acts: a.acts, places: placesOut, companions: a.companions, ending: a.ending,
    writings: a.writings, questions: a.questions, notSaid: a.notSaid, passages: a.passages,
    story: person.story ?? null, verseCount: (person.refs ?? []).length,
    citations, thread, verses, globe,
  };
  fs.writeFileSync(`${OUT}/${id}.json`, JSON.stringify(out));
  console.log(`${key}: ${moments.length} moments, ${a.acts.length} acts, ${thread.reduce((n, g2) => n + g2.items.length, 0)} thread items, ${Object.keys(verses).length} verses, ${citations.length} citations, ${globe.arcs.length + journeys.reduce((n, j) => n + j.arcs.length, 0)} arcs`);
}
// Land for the globe: world-atlas (Natural Earth) 110m while dragging, 50m at rest.
for (const f of ["land-110m.json", "land-50m.json"]) fs.copyFileSync(`${W}/node_modules/world-atlas/${f}`, `${OUT}/${f}`);
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("all thread lines match the KJV");
