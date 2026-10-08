// Builds data/david.json for direction B (The house of David) from the site's own reviewed files.
// Run from this folder: node extract.mjs
// Sources: src/data/people-pages/rulers-united-kingdom.json (David, Saul, Ish-bosheth), data/study/people/*.json
// (David's story and every family member), data/study/people.json (names), data/places.json (lon/lat) and the
// KJV text in data/text/kjv. Nothing is invented: step captions are KJV verses or the ruler file's own claims; the few
// lines written here (kind "text") only explain how the tree is drawn.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { STEPS, DRAMA, TREE, CUSTOM, CHRONICLES } from "./extract-spec.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, "../../..");
const read = (p) => JSON.parse(readFileSync(path.join(site, p), "utf8"));

const catalog = read("data/catalog.json");
const books = Object.fromEntries(catalog.books.map((b) => [b.num, { code: b.code, name: b.name }]));
const byCode = Object.fromEntries(catalog.books.map((b) => [b.code, b.num]));
const group = read("src/data/people-pages/rulers-united-kingdom.json");
const ruler = (id) => group.rulers.find((r) => r.id === id) ?? fail(`ruler ${id} missing from rulers-united-kingdom.json`);
const david = ruler("david-rut-4-17");
const names = Object.fromEntries(read("data/study/people.json").map((p) => [p.id, p]));
const places = Object.fromEntries(read("data/places.json").map((p) => [p.id, p]));

function fail(message) { throw new Error(`extract: ${message}`); }

// "2SA 3:2-5" -> [10003002, 10003005]; verse text joined from the KJV runs.
function span(ref) {
  const m = /^(\w+) (\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/.exec(ref) ?? fail(`bad reference "${ref}"`);
  const num = byCode[m[1]] ?? fail(`unknown book in "${ref}"`);
  const ch = +m[2], v = +m[3], ch2 = m[4] ? +m[4] : ch, v2 = m[5] ? +m[5] : v;
  return [num * 1e6 + ch * 1e3 + v, num * 1e6 + ch2 * 1e3 + v2];
}
const chunks = new Map();
function verseText([a, b]) {
  const num = Math.floor(a / 1e6), code = books[num].code, out = [];
  for (let id = a; id <= b;) {
    const ch = Math.floor((id % 1e6) / 1e3), file = `data/text/kjv/${code}/${Math.floor((ch - 1) / 5)}.json`;
    if (!chunks.has(file)) chunks.set(file, read(file));
    const chapter = chunks.get(file)[String(ch)] ?? fail(`chapter ${code} ${ch} missing`);
    let found = false;
    for (const verse of chapter.v) {
      const vid = num * 1e6 + ch * 1e3 + Number(verse.n);
      if (vid >= id && vid <= b) { found = true; out.push(verse.r.map((r) => (typeof r === "string" ? r : Array.isArray(r) ? r[0] : "")).join("").replace(/¶\s*/g, "").trim()); }
    }
    if (!found) fail(`no verses for ${code} ${ch} in span ${a}-${b}`);
    id = num * 1e6 + (ch + 1) * 1e3 + 1;
  }
  return out.join(" ");
}

// A step's caption: the ruler file's event claim, an accession claim, or exact KJV verses.
const eventByLabel = Object.fromEntries(david.events.map((e) => [e.label, e]));
function caption(src) {
  const parts = [];
  for (const label of src.ev ?? []) {
    const e = eventByLabel[label] ?? fail(`event "${label}" not in David's events`);
    parts.push({ kind: "claim", event: label, text: e.claim.text, layer: e.claim.layer, refs: e.claim.refs });
  }
  for (const i of src.acc ?? []) {
    const c = david.accession[i] ?? fail(`accession ${i} missing`);
    parts.push({ kind: "claim", text: c.text, layer: c.layer, refs: c.refs });
  }
  for (const [label, ref] of src.other ?? []) {
    const r = ruler(label), e = r.events.find((x) => x.label === ref) ?? fail(`event "${ref}" not in ${label}`);
    parts.push({ kind: "claim", text: e.claim.text, layer: e.claim.layer, refs: e.claim.refs, from: r.name });
  }
  for (const ref of src.kjv ?? []) { const s = span(ref); parts.push({ kind: "kjv", text: verseText(s), refs: [s] }); }
  if (src.note) parts.push({ kind: "note", text: src.note, layer: "text", refs: (src.noteRefs ?? []).map(span) });
  return parts;
}

// People: every tree node must exist as a person file (or be one of the few CUSTOM group nodes), and its parent
// must be one the person file itself records (pa), so the tree draws no relationship the data does not hold.
const people = {};
for (const node of TREE) {
  if (CUSTOM[node.id]) { people[node.id] = { ...CUSTOM[node.id], custom: true }; continue; }
  const file = path.join(site, "data/study/people", `${node.id}.json`);
  if (!existsSync(file)) fail(`person file missing for tree node ${node.id}`);
  const p = JSON.parse(readFileSync(file, "utf8"));
  const parent = node.parent && !CUSTOM[node.parent] ? node.parent : null;
  if (parent && !(p.pa ?? []).includes(parent)) fail(`${node.id}: parent ${parent} is not in its person file (pa = ${JSON.stringify(p.pa)})`);
  if (node.mother && !(p.pa ?? []).includes(node.mother)) fail(`${node.id}: mother ${node.mother} is not in its person file`);
  people[node.id] = { name: names[node.id]?.n ?? fail(`no name for ${node.id}`), brief: p.b, short: p.short, verses: names[node.id]?.c ?? 0, first: p.f, story: p.story?.short ?? null };
}

const steps = STEPS.map((s, i) => ({ ...s, index: i, caption: caption(s), interval: s.interval && { ...s.interval, span: span(s.interval.ref), quote: verseText(span(s.interval.ref)) }, kjv: undefined, ev: undefined, acc: undefined, other: undefined, note: undefined, noteRefs: undefined }));
const drama = DRAMA.map((b) => ({ ...b, caption: caption(b), kjv: undefined, note: undefined }));

// Every event of the reign must be reachable from a step, so the event lanes can jump the tree to it.
const covered = new Map();
steps.forEach((s, i) => [...(STEPS[i].ev ?? []), ...(s.covers ?? [])].forEach((label) => covered.has(label) || covered.set(label, i)));
const events = david.events.map((e) => {
  if (!covered.has(e.label)) fail(`event "${e.label}" is not covered by any step`);
  return { ...e, step: covered.get(e.label), place: e.placeId ? places[e.placeId]?.name : undefined };
});

const placeRows = david.places.map((p) => {
  const g = places[p.placeId] ?? fail(`place ${p.placeId} (${p.name}) not in places.json`);
  return { ...p, lon: g.lon, lat: g.lat, type: g.type };
});

const saul = ruler("saul-1sa-9-2"), ish = ruler("ish-bosheth-2sa-2-8"), solomon = ruler("solomon-2sa-5-14");
const out = {
  about: "Direction B, The house of David. Built by extract.mjs from the site's reviewed data; do not hand-edit.",
  books,
  person: {
    id: david.id, name: david.name, title: david.title, tagline: david.tagline, house: david.house, tribe: david.tribe,
    capital: david.capital, reign: david.reign, records: david.records, identifications: david.identifications,
    verdictTone: david.verdictTone, brief: names[david.id].b, verses: names[david.id].c,
  },
  neighbours: {
    saul: { name: saul.name, title: saul.title, reign: saul.reign, death: saul.records.find((r) => r.death)?.death },
    ishbosheth: { name: ish.name, title: ish.title, reign: ish.reign, death: ish.records.find((r) => r.death)?.death },
    solomon: { name: solomon.name, title: solomon.title, reign: solomon.reign },
  },
  groupIntro: group.intro,
  story: read("data/study/people/david-rut-4-17.json").story,
  accession: david.accession, events, verdictNotes: david.verdictNotes, nation: david.nation, prophets: david.prophets,
  worldStage: david.worldStage, outside: david.outside, twoAccounts: david.twoAccounts, questions: david.questions,
  notSaid: david.notSaid, dates: david.dates, places: placeRows, passages: david.passages, citations: group.citations,
  people, tree: TREE, steps, drama, chronicles: CHRONICLES,
};
for (const c of CHRONICLES.verses) c.text = verseText(span(c.ref)), c.span = span(c.ref);
writeFileSync(path.join(here, "data/david.json"), JSON.stringify(out));
console.log(`david.json: ${Object.keys(people).length} people, ${steps.length} steps, ${drama.length} drama beats, ${events.length} events, ${placeRows.length} places`);
