// node design/apostle-merged/build/extract.cjs — builds design/apostle-merged/data/<person id>.json for all fourteen
// apostles from the site's reviewed data: the apostle records (src/data/people-pages/apostles-1/2.json), the person
// files (data/study/people/, whose refs are the verses that name each person), the harmony, places, the Atlas's own
// land outline and projection (src/data/atlas-map.json), the church and Letters questions, and the KJV.
// Who was with him is not curated: a companion is "with" a record when a verse that names the companion (from that
// person's own file) falls inside the record's passages. Every line quoted on the landing is checked against its KJV
// verse word for word; the build fails on any mismatch or any missing record.
const fs = require("fs");
const { verse, span, books, W } = require("./kjv.cjs");
const { PEOPLE, ORDER, TWELVE, GOSPEL_POOL, ACTS_POOL, PAUL_POOL, iconFor, PLACE_KIND } = require("./spec-people.cjs");
const { PERSONS } = require("./spec-persons.cjs");
const Questions = require("./questions.cjs");
const Accounts = require("./accounts.cjs");
const OUT = W + "/design/apostle-merged/data";
fs.mkdirSync(OUT, { recursive: true });
const read = (p) => JSON.parse(fs.readFileSync(W + "/" + p, "utf8"));
const A1 = read("src/data/people-pages/apostles-1.json"), A2 = read("src/data/people-pages/apostles-2.json");
const places = read("data/places.json"), placeById = Object.fromEntries(places.map((p) => [p.id, p]));
const harmony = read("data/study/harmony.json"), atlas = read("src/data/atlas-map.json");
const catalog = read("data/catalog.json"), kjvCat = catalog.translations.find((t) => t.slug === "kjv");
const SHORT = { jamesz: "James", johnz: "John", jamesa: "James", simonz: "Simon", iscariot: "Judas" };
const EPITHET = { jamesz: "son of Zebedee", johnz: "son of Zebedee", jamesa: "son of Alphaeus", simonz: "the Zealot", iscariot: "Iscariot" };
const errors = [], fail = (msg) => errors.push(msg);

// ── Shared look-ups ──
const sections = [];
for (const part of harmony.parts) for (const s of part.sections) sections.push({ n: s.n, title: s.title });
const ordOf = Object.fromEntries(sections.map((s, i) => [s.n, i]));
const codeOf = (id) => books[Math.floor(id / 1e6)].code, nameOf = (id) => books[Math.floor(id / 1e6)].name;
const inAny = (v, refs) => refs.some(([a, b = a]) => v >= a && v <= b);
const ll = (id) => { const p = placeById[id]; return p && Number.isFinite(p.lon) ? [p.lon, p.lat] : null; };
const norm = (s) => s.replace(/[’‘]/g, "'").replace(/æ/g, "ae").replace(/\s+/g, " ").trim().toLowerCase();
// The Atlas's Mercator (d3 geoMercator with the scale and translate atlas-map.json was drawn with).
const project = ([lon, lat]) => { const r = Math.PI / 180; return [+(atlas.scale * lon * r + atlas.translate[0]).toFixed(2), +(atlas.translate[1] - atlas.scale * Math.log(Math.tan(Math.PI / 4 + (lat * r) / 2))).toFixed(2)]; };
const refsCache = {};
const refsOf = (key) => (refsCache[key] ??= (() => { try { return read(`data/study/people/${PEOPLE[key][0]}.json`).refs ?? []; } catch (e) { fail(`person ${key}: ${e.message}`); return []; } })());
const JER = ll("a15257a");
function fromJerusalem(p) {
  const R = 6371, rad = Math.PI / 180, dLat = (p[1] - JER[1]) * rad, dLon = (p[0] - JER[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(JER[1] * rad) * Math.cos(p[1] * rad) * Math.sin(dLon / 2) ** 2;
  const y = Math.sin(dLon) * Math.cos(p[1] * rad), x = Math.cos(JER[1] * rad) * Math.sin(p[1] * rad) - Math.sin(JER[1] * rad) * Math.cos(p[1] * rad) * Math.cos(dLon);
  return { km: Math.round((2 * R * Math.asin(Math.sqrt(h))) / 5) * 5, dir: ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"][Math.round(((Math.atan2(y, x) / rad + 360) % 360) / 45) % 8] };
}
function verseStore() {
  const v = {};
  return {
    add(id) { if (v[id] == null) { try { v[id] = verse(id).text; } catch (e) { fail(`verse ${id}: ${e.message}`); } } return v[id]; },
    addSpan(r, cap = 12) { try { span(r).slice(0, cap).forEach((x) => { v[x.id] = x.text; }); } catch (e) { fail(`span ${r}: ${e.message}`); } },
    all: v,
  };
}
const checkLine = (who, V, [id, phrase]) => { const t = V.add(id) ?? ""; if (!norm(t).includes(norm(phrase))) fail(`${who}: "${phrase}" is not in ${id}: "${t}"`); return { v: id, t: phrase }; };
const DEFAULT_PERIODS = [
  { n: "I", title: "Before the call", sub: "Home, trade and family" }, { n: "II", title: "With Jesus", sub: "The Gospels, in the harmony’s order" },
  { n: "III", title: "The church in Acts", sub: "Acts and the letters" }, { n: "IV", title: "After Scripture", sub: "Tradition, by who said it and when" },
];

const all = [...A1.apostles.map((a) => [a, A1]), ...A2.apostles.map((a) => [a, A2])];
const index = [];
for (const key of ORDER) {
  const P = PERSONS[key], id = PEOPLE[key][0];
  const [a, group] = all.find(([x]) => x.id === id) ?? [];
  if (!a) { fail(`${key}: no apostle record ${id}`); continue; }
  const person = read(`data/study/people/${id}.json`), V = verseStore();
  const named = new Set(person.refs ?? []);
  const claimAt = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), a);

  // ── Records: facts, moments, acts, tradition ──
  const entries = [];
  const factPaths = [...(a.home ? ["home"] : []), ...(a.trade ? ["trade"] : []), ...a.family.map((_, i) => `family.${i}`)];
  for (const path of factPaths) {
    const c = claimAt(path), title = P.facts[path];
    if (!title) { fail(`${key}: no title for fact ${path}`); continue; }
    entries.push({ key: `fact.${path}`, type: "fact", title, text: c.text, layer: c.layer, refs: c.refs ?? [], cites: c.cites ?? [] });
  }
  a.moments.forEach((m, i) => {
    const e = { key: `m${i}`, type: "moment", title: m.label, refs: m.refs, layer: "scripture" };
    if (m.harmony != null) { const o = ordOf[m.harmony]; if (o == null) fail(`${key} m${i}: harmony ${m.harmony} not found`); else e.h = { ord: o, n: m.harmony, title: sections[o].title }; }
    entries.push(e);
  });
  if (P.acts.length !== a.acts.length) fail(`${key}: ${P.acts.length} act titles for ${a.acts.length} acts`);
  a.acts.forEach((c, i) => entries.push({ key: `a${i}`, type: "act", title: P.acts[i], text: c.text, layer: c.layer, refs: c.refs ?? [], cites: c.cites ?? [] }));
  a.ending.tradition.forEach((t, i) => entries.push({ key: `t${i}`, type: "trad", title: t.who, text: t.text, layer: t.layer, who: t.who, when: t.when, refs: [], cites: t.cites ?? [] }));

  let ordered;
  if (P.order) {
    const byKey = Object.fromEntries(entries.map((e) => [e.key, e]));
    ordered = P.order.map((k) => byKey[k] ?? (fail(`${key}: order names unknown ${k}`), null)).filter(Boolean);
    const left = entries.filter((e) => !P.order.includes(e.key));
    if (left.some((e) => e.type !== "trad")) fail(`${key}: order leaves out ${left.filter((e) => e.type !== "trad").map((e) => e.key)}`);
    ordered.push(...left);
  } else {
    const moments = entries.filter((e) => e.type === "moment").sort((x, y) => (x.h?.ord ?? 0) - (y.h?.ord ?? 0));
    ordered = [...entries.filter((e) => e.type === "fact"), ...moments, ...entries.filter((e) => e.type === "act"), ...entries.filter((e) => e.type === "trad")];
  }
  const periodOf = P.period ?? ((e) => (e.type === "fact" ? 1 : e.type === "moment" ? 2 : e.type === "act" ? 3 : 4));
  const pool = (P.pool === "paul" ? PAUL_POOL : [...TWELVE.filter((k) => k !== key), "matthias", "paul", ...GOSPEL_POOL, ...ACTS_POOL]).filter((k) => k !== key && PEOPLE[k]);
  ordered.forEach((e, i) => {
    e.i = i; e.period = periodOf(e); e.icon = e.type === "trad" ? "tradition" : e.type === "fact" ? "people" : iconFor(e.title);
    e.refs.forEach((r) => V.addSpan(r));
    e.lead = e.refs.flatMap(([lo, hi = lo]) => Object.keys(V.all).map(Number).filter((v) => v >= lo && v <= hi).sort((x, y) => x - y)).find((v) => named.has(v)) ?? (e.refs[0]?.[0] ?? null);
    if (e.lead) V.add(e.lead);
    e.places = a.places.map((p, pi) => ((p.refs ?? []).some((r) => inAny(r[0], e.refs)) ? pi : -1)).filter((x) => x >= 0);
    e.with = {};
    if (e.layer !== "text" && e.type !== "trad") for (const k of pool) {
      if ((P.notWith?.[e.key] ?? []).includes(k)) continue;
      const hits = refsOf(k).filter((v) => inAny(v, e.refs));
      if (hits.length) { e.with[k] = hits.slice(0, 3); hits.slice(0, 3).forEach((v) => V.add(v)); }
    }
  });
  const rows = pool.map((k) => ({ key: k, id: PEOPLE[k][0], name: PEOPLE[k][1], twelve: TWELVE.includes(k) || k === "matthias", n: ordered.filter((e) => e.with[k]).length })).filter((r) => r.n > 0);
  const periods = DEFAULT_PERIODS.map((p, i) => ({ ...p, ...(P.periods?.[i + 1] ?? {}), entries: ordered.filter((e) => e.period === i + 1).map((e) => e.key) }));

  // ── Where he is named: verses per chapter (and the other name's verses, for Bartholomew and Nathanael) ──
  const heatOf = (refs) => {
    const heat = {};
    for (const v of refs) {
      const code = codeOf(v), ch = Math.floor((v % 1e6) / 1e3);
      heat[code] ??= { name: nameOf(v), num: Math.floor(v / 1e6), chapters: kjvCat.books[code].length, counts: {}, first: {} };
      heat[code].counts[ch] = (heat[code].counts[ch] ?? 0) + 1;
      if (!heat[code].first[ch]) { heat[code].first[ch] = v; V.add(v); }
    }
    return heat;
  };
  const heat = heatOf(person.refs ?? []);
  const alt = (a.personIds ?? []).map((pid) => ({ id: pid, name: PEOPLE[Object.keys(PEOPLE).find((k) => PEOPLE[k][0] === pid)]?.[1] ?? pid, heat: heatOf(read(`data/study/people/${pid}.json`).refs ?? []), count: (read(`data/study/people/${pid}.json`).refs ?? []).length }));

  // ── Places, on the Atlas's own projection ──
  const placesOut = a.places.map((p, pi) => {
    const pos = p.placeId ? ll(p.placeId) : null;
    (p.refs ?? []).forEach((r) => V.add(r[0]));
    return { name: p.name, placeId: p.placeId ?? null, refs: p.refs ?? [], note: p.note ?? null, tradition: !!p.tradition, ll: pos, xy: pos ? project(pos) : null,
      kind: p.tradition ? "tradition" : PLACE_KIND[p.placeId] ?? (pos ? "city" : "unpinned"), from: pos && p.placeId !== "a15257a" ? fromJerusalem(pos) : null,
      entries: ordered.filter((e) => e.places.includes(pi)).map((e) => e.key) };
  });

  // ── One moment, several accounts ──
  const accounts = Accounts.build({ a, key, P, ordered, V, nameOf, codeOf, span, fail });

  // ── The landing's line, and the cinema chapters ──
  const landing = { art: P.landing.art, line: checkLine(key, V, P.landing.line), also: P.landing.also ? checkLine(key, V, P.landing.also) : null, note: P.landing.note ?? null };
  const byKey = Object.fromEntries(ordered.map((e) => [e.key, e]));
  const chapters = P.chapters.map((ch, ci) => ({ n: ["I", "II", "III"][ci], period: ci + 1, title: ch.title, slides: ch.slides.map((s) => {
    const e = byKey[s.e];
    if (!e) { fail(`${key}: chapter slide names unknown ${s.e}`); return null; }
    if (s.v) { V.add(s.v); if (e.refs.length && !inAny(s.v, e.refs)) fail(`${key}: slide verse ${s.v} is outside ${s.e}`); }
    return { entry: s.e, art: s.art, v: s.v ?? e.lead ?? null };
  }).filter(Boolean) }));
  a.calling.forEach((c) => V.addSpan(c.quote.span));
  (a.lists ?? []).forEach((l) => V.add(l.span[0]));
  a.ending.scripture.forEach((c) => (c.refs ?? []).forEach((r) => V.addSpan(r, 4)));

  // ── Questions, and every citation used ──
  const extraCites = new Map();
  const questions = Questions.build({ a, spec: P, fail, citeOut: extraCites });
  const used = new Set();
  JSON.stringify(a, (k, v) => { if (k === "cites" && Array.isArray(v)) v.forEach((c) => used.add(c)); return v; });
  const citations = [...group.citations.filter((c) => used.has(c.id)), ...extraCites.values()];

  const out = {
    key, id, name: a.name, short: SHORT[key] ?? PEOPLE[key][1], epithet: EPITHET[key] ?? null, names: P.names, otherNames: a.otherNames, title: a.title, tagline: a.tagline,
    story: person.story?.short ?? null, verseCount: named.size, alt, periods, entries: ordered, rows, heat, accounts, places: placesOut,
    lists: a.lists ?? [], calling: a.calling, companions: a.companions, family: a.family, identifications: a.identifications, ending: a.ending,
    questions, notSaid: a.notSaid, writings: a.writings, citations, landing, chapters, verses: V.all,
  };
  fs.writeFileSync(`${OUT}/${id}.json`, JSON.stringify(out));
  index.push({ key, id, name: PEOPLE[key][1], short: out.short });
  console.log(`${key}: ${ordered.length} records (${periods.map((p) => p.entries.length).join("/")}), ${rows.length} people, ${Object.keys(heat).length} books, ${accounts.length} accounts, ${placesOut.length} places, ${questions.items.length} questions (${questions.groups.map((g) => g.n).join("/")}), ${Object.keys(V.all).length} verses, ${(fs.statSync(`${OUT}/${id}.json`).size / 1024).toFixed(0)} KB`);
}
fs.writeFileSync(`${OUT}/books.json`, JSON.stringify(Object.values(books).map((b) => [b.num, b.code, b.name])));
fs.writeFileSync(`${OUT}/index.json`, JSON.stringify(index));
fs.writeFileSync(`${OUT}/land.json`, JSON.stringify({ width: atlas.width, height: atlas.height, land: atlas.land }));
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("every landing line matches the KJV word for word; every record, question and citation was found");
