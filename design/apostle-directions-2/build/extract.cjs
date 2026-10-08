// node design/apostle-directions-2/build/extract.cjs — builds design/apostle-directions-2/data/<who>.json from the site's
// reviewed data: the apostle records (src/data/people-pages/apostles-1/2.json), the person files (data/study/people/,
// whose refs are the verses that name each person), the harmony, places, Paul's journeys, and the KJV.
// Who was with him is not curated: a companion is "with" an entry when a verse that names the companion (from that
// person's own file) falls inside the entry's passages. Objects are curated in spec.cjs, and every quoted phrase is
// checked against its KJV verse here; the build fails on any mismatch.
const fs = require("fs");
const { verse, span, books, W } = require("./kjv.cjs");
const THREADS = require("./threads.cjs");
const { PEOPLE, KINDS, PERSONS, PLACE_KIND } = require("./spec.cjs");
const GLOBE = require("./globe-spec.cjs");
const OUT = W + "/design/apostle-directions-2/data";
fs.mkdirSync(OUT, { recursive: true });
const read = (p) => JSON.parse(fs.readFileSync(W + "/" + p, "utf8"));
const A1 = read("src/data/people-pages/apostles-1.json"), A2 = read("src/data/people-pages/apostles-2.json");
const places = read("data/places.json"), placeById = Object.fromEntries(places.map((p) => [p.id, p]));
const harmony = read("data/study/harmony.json"), letters = read("src/data/letters/paul-letters.json");
const catalog = read("data/catalog.json"), kjvCat = catalog.translations.find((t) => t.slug === "kjv");
const errors = [];
// Letters whose writer names himself in the opening verse: Paul (Romans to Philemon), Peter (1 and 2 Peter).
const WRITERS = { paul: [45, 57], peter: [60, 61] };
const fail = (msg) => errors.push(msg);

// ── Shared look-ups ──
const sections = [];
for (const part of harmony.parts) for (const s of part.sections) sections.push({ n: s.n, title: s.title, part: part.n });
const ordOf = Object.fromEntries(sections.map((s, i) => [s.n, i]));
const codeOf = (id) => books[Math.floor(id / 1e6)].code;
const nameOf = (id) => books[Math.floor(id / 1e6)].name;
const chapterCount = (code) => kjvCat.books[code].length;
const inSpan = (v, [a, b = a]) => v >= a && v <= b;
const inAny = (v, refs) => refs.some((r) => inSpan(v, r));
const ll = (id) => { const p = placeById[id]; return p && Number.isFinite(p.lon) ? [p.lon, p.lat] : null; };
const norm = (s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();
const personRefs = {};
function refsOf(key) {
  if (!personRefs[key]) {
    const [id] = PEOPLE[key];
    try { personRefs[key] = read(`data/study/people/${id}.json`).refs ?? []; } catch (e) { fail(`person ${key} (${id}): ${e.message}`); personRefs[key] = []; }
  }
  return personRefs[key];
}

// Verse text store for one apostle (only what the page shows).
function verseStore() {
  const v = {};
  return {
    add(id) { if (v[id] == null) { try { v[id] = verse(id).text; } catch (e) { fail(`verse ${id}: ${e.message}`); } } return v[id]; },
    addSpan(r, cap = 12) { try { span(r).slice(0, cap).forEach((x) => { v[x.id] = x.text; }); } catch (e) { fail(`span ${r}: ${e.message}`); } },
    all: v,
  };
}

function journeyArcs(mapId) {
  const m = letters.maps.find((x) => x.id === mapId);
  const stops = m.stops.filter((s) => s.placeId && ll(s.placeId));
  const arcs = [];
  for (let i = 0; i < stops.length - 1; i++) {
    if (stops[i].placeId === stops[i + 1].placeId) continue;
    arcs.push({ id: `${mapId}-${i}`, from: stops[i].placeId, to: stops[i + 1].placeId, kind: "scripture", label: `${m.title}: ${stops[i].name.split(",")[0]} to ${stops[i + 1].name.split(",")[0]}`, refs: stops[i + 1].refs ?? [], journey: mapId });
  }
  return { id: mapId, title: m.title, arcs, stops: stops.map((s) => ({ name: s.name.split(",")[0], placeId: s.placeId, ll: ll(s.placeId) })) };
}

for (const [who, P] of Object.entries(PERSONS)) {
  const group = A1.apostles.some((a) => a.id === P.id) ? A1 : A2;
  const a = group.apostles.find((x) => x.id === P.id);
  const person = read(`data/study/people/${P.id}.json`);
  const V = verseStore();
  const claimAt = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), a);

  // ── Entries: facts, moments, acts and tradition, each with its passages ──
  const entries = [];
  for (const [path, title] of P.facts) {
    const c = claimAt(path);
    if (!c) { fail(`${who}: fact ${path} missing`); continue; }
    entries.push({ key: `fact.${path}`, type: "fact", title, text: c.text, layer: c.layer, refs: c.refs ?? [], cites: c.cites ?? [] });
  }
  a.moments.forEach((m, i) => {
    const e = { key: `m${i}`, type: "moment", title: m.label, refs: m.refs, layer: "scripture" };
    if (m.harmony != null) { const o = ordOf[m.harmony]; if (o == null) fail(`${who} m${i}: harmony ${m.harmony} not found`); else e.h = { ord: o, n: m.harmony, title: sections[o].title }; }
    entries.push(e);
  });
  if (P.actTitles.length !== a.acts.length) fail(`${who}: ${P.actTitles.length} act titles for ${a.acts.length} acts`);
  a.acts.forEach((c, i) => entries.push({ key: `a${i}`, type: "act", title: P.actTitles[i], text: c.text, layer: c.layer, refs: c.refs ?? [], cites: c.cites ?? [] }));
  a.ending.tradition.forEach((t, i) => entries.push({ key: `t${i}`, type: "trad", title: t.who, text: t.text, layer: t.layer, who: t.who, when: t.when, refs: [], cites: t.cites ?? [] }));

  // Story order.
  let ordered;
  if (P.order) {
    const byKey = Object.fromEntries(entries.map((e) => [e.key, e]));
    ordered = P.order.map((k) => byKey[k] ?? (fail(`${who}: order names unknown ${k}`), null)).filter(Boolean);
    const left = entries.filter((e) => !P.order.includes(e.key));
    if (left.some((e) => e.type !== "trad")) fail(`${who}: order leaves out ${left.filter((e) => e.type !== "trad").map((e) => e.key)}`);
    ordered.push(...left);
  } else {
    const moments = entries.filter((e) => e.type === "moment").sort((x, y) => (x.h?.ord ?? 0) - (y.h?.ord ?? 0));
    ordered = [...entries.filter((e) => e.type === "fact"), ...moments, ...entries.filter((e) => e.type === "act"), ...entries.filter((e) => e.type === "trad")];
  }

  // Period, kind, verses, places and companions for each entry.
  const kindOf = {};
  for (const [k, list] of Object.entries(P.kinds)) for (const key of list) { if (kindOf[key]) fail(`${who}: ${key} in two kinds`); kindOf[key] = k; }
  const pool = P.pool.filter((k) => PEOPLE[k]);
  ordered.forEach((e, i) => {
    e.i = i;
    e.period = P.period(e);
    if (e.type === "moment" || e.type === "act") { e.kind = kindOf[e.key]; if (!e.kind) fail(`${who}: ${e.key} has no kind`); }
    if (e.type === "trad") e.kind = "tradition";
    e.refs.forEach((r) => V.addSpan(r));
    e.first = e.refs.length ? e.refs[0][0] : null;
    // The lead verse: the first verse of the passages that names him (his own verse list), else the first verse.
    const named = new Set(person.refs ?? []);
    e.lead = e.refs.flatMap(([lo, hi = lo]) => Object.keys(V.all).map(Number).filter((v) => v >= lo && v <= hi).sort((x, y) => x - y)).find((v) => named.has(v)) ?? e.first;
    if (e.lead) V.add(e.lead);
    // Places: a place belongs to the entry when one of the place's verses lies in the entry's passages.
    e.places = a.places.map((p, pi) => ((p.refs ?? []).some((r) => inAny(r[0], e.refs)) ? pi : -1)).filter((x) => x >= 0);
    // Companions named in the entry's passages.
    e.with = {};
    if (e.layer !== "text") for (const k of pool) {
      if ((P.notWith?.[e.key] ?? []).includes(k)) continue;
      const hits = refsOf(k).filter((v) => inAny(v, e.refs));
      if (hits.length) { e.with[k] = hits.slice(0, 3); hits.slice(0, 3).forEach((v) => V.add(v)); }
    }
    // The writer of a letter is present in what he tells, though he says "I" rather than his name.
    for (const [k, [lo, hi]] of Object.entries(WRITERS)) {
      if (!pool.includes(k) || e.with[k]) continue;
      const r = e.refs.find((x) => Math.floor(x[0] / 1e6) >= lo && Math.floor(x[0] / 1e6) <= hi);
      if (r) { e.with[k] = [r[0]]; e.writer = k; V.add(r[0]); }
    }
  });
  for (const key of Object.keys(kindOf)) if (!ordered.some((e) => e.key === key)) fail(`${who}: kind lists unknown ${key}`);
  const rows = pool.map((k) => ({ key: k, id: PEOPLE[k][0], name: PEOPLE[k][1], twelve: ["andrew", "jamesz", "johnz", "philip", "bartholomew", "thomas", "matthew", "jamesa", "thaddaeus", "simonz", "iscariot", "peter"].includes(k),
    n: ordered.filter((e) => e.with[k]).length })).filter((r) => r.n > 0);

  // His own words (validated in the old build's thread; re-checked here).
  const words = [];
  for (const g of THREADS[P.id] ?? []) for (const item of g.items) {
    const lines = item.tabs ? item.tabs[0].lines : item.lines;
    for (const l of lines) if (l.who === "s") {
      const text = V.add(l.v);
      if (!norm(text).includes(norm(l.t.split(" … ")[0]))) fail(`${who}: word "${l.t}" not in ${l.v}`);
      words.push({ entry: item.key, v: l.v, t: l.t });
    }
  }

  // ── Heat: verses that name him, per chapter ──
  const heat = {};
  for (const v of person.refs ?? []) {
    const code = codeOf(v), ch = Math.floor((v % 1e6) / 1e3);
    heat[code] ??= { name: nameOf(v), chapters: chapterCount(code), counts: {}, first: {} };
    heat[code].counts[ch] = (heat[code].counts[ch] ?? 0) + 1;
    if (!heat[code].first[ch]) { heat[code].first[ch] = v; V.add(v); }
  }

  // ── Parallel accounts ──
  const accounts = P.accounts.map((acc) => {
    let cols;
    if (acc.from === "calling") cols = a.calling.map((c) => ({ label: c.label, span: c.quote.span }));
    else if (acc.from === "lists") {
      const wide = { MAT: [40010002, 40010004], MRK: [41003016, 41003019], LUK: [42006014, 42006016], ACT: [44001013, 44001013] };
      cols = a.lists.map((l) => ({ label: `${nameOf(l.span[0])} ${Math.floor((l.span[0] % 1e6) / 1e3)} · ${l.position === 10 ? "tenth" : "eleventh"}`, span: wide[l.book] }));
    } else {
      const e = ordered.find((x) => x.key === acc.id);
      if (!e) { fail(`${who}: account ${acc.id} unknown`); return null; }
      // One column per book; spans of the same book are joined.
      const byBook = new Map();
      for (const r of e.refs) { const c = codeOf(r[0]); if (!byBook.has(c)) byBook.set(c, []); byBook.get(c).push(r); }
      cols = [...byBook].map(([c, rs]) => ({ label: nameOf(rs[0][0]), spans: rs }));
    }
    const out = cols.map((c) => {
      const spans = c.spans ?? [c.span];
      const verses = spans.flatMap((r) => { try { return span(r).slice(0, 12).map((x) => ({ id: x.id, text: x.text })); } catch (err) { fail(`${who} account ${acc.id}: ${err.message}`); return []; } });
      return { label: c.label, spans, verses };
    });
    if (out.length < 2) fail(`${who}: account ${acc.id} has ${out.length} column`);
    return { id: acc.id, title: acc.title, cols: out };
  }).filter(Boolean);

  // ── Objects, each phrase checked word for word ──
  const objects = P.objects.map((o) => ({ name: o.name, art: o.art, verses: o.verses.map(([v, phrase]) => {
    const text = V.add(v);
    if (!norm(text).includes(norm(phrase))) fail(`${who}: object "${o.name}": "${phrase}" not in ${v}: "${text}"`);
    return { id: v, phrase };
  }) }));
  // An object's first and last book, for the cabinet labels.
  objects.forEach((o) => { o.first = o.verses[0].id; });

  // ── Places with coordinates, kind, and distance from Jerusalem ──
  const JER = ll("a15257a");
  const distance = (p) => {
    const R = 6371, rad = Math.PI / 180;
    const dLat = (p[1] - JER[1]) * rad, dLon = (p[0] - JER[0]) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(JER[1] * rad) * Math.cos(p[1] * rad) * Math.sin(dLon / 2) ** 2;
    const km = 2 * R * Math.asin(Math.sqrt(h));
    const y = Math.sin(dLon) * Math.cos(p[1] * rad), x = Math.cos(JER[1] * rad) * Math.sin(p[1] * rad) - Math.sin(JER[1] * rad) * Math.cos(p[1] * rad) * Math.cos(dLon);
    const bearing = (Math.atan2(y, x) / rad + 360) % 360;
    return { km: Math.round(km / 5) * 5, dir: ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"][Math.round(bearing / 45) % 8] };
  };
  const placesOut = a.places.map((p) => {
    const pos = p.placeId ? ll(p.placeId) : null;
    (p.refs ?? []).forEach((r) => V.add(r[0]));
    return { name: p.name, placeId: p.placeId ?? null, refs: p.refs ?? [], note: p.note ?? null, tradition: !!p.tradition, ll: pos,
      kind: p.tradition ? "tradition" : PLACE_KIND[p.placeId] ?? (pos ? "city" : "unpinned"), from: pos && p.placeId !== "a15257a" ? distance(pos) : null,
      entries: ordered.filter((e) => e.places.includes(a.places.indexOf(p))).map((e) => e.key) };
  });

  // ── Globe arcs ──
  const g = GLOBE[P.id];
  const resolveArc = (x) => { const f = ll(x.from), t = ll(x.to); if (!f || !t) fail(`${who}: arc ${x.id} has an unpinned end`); (x.refs ?? []).forEach((r) => V.add(r[0])); return { ...x, a: f, b: t, fromName: placeById[x.from]?.name, toName: placeById[x.to]?.name }; };
  const globe = { arcs: g.arcs.map(resolveArc), journeys: (g.journeys ?? []).map(journeyArcs).map((j) => ({ ...j, arcs: j.arcs.map(resolveArc) })), views: g.views };
  for (const [k, v] of Object.entries(g.views)) if (!v.center) fail(`${who}: globe view ${k} has no centre`);

  // Calling and lists verses for quotes.
  a.calling.forEach((c) => V.addSpan(c.quote.span));
  (a.lists ?? []).forEach((l) => V.add(l.span[0]));
  a.ending.scripture.forEach((c) => (c.refs ?? []).forEach((r) => V.addSpan(r, 4)));
  (a.questions ?? []).forEach((q) => q.views.forEach((v) => (v.argument.refs ?? []).forEach((r) => V.add(r[0]))));

  // Citations used anywhere.
  const used = new Set();
  JSON.stringify(a, (k, v) => { if (k === "cites" && Array.isArray(v)) v.forEach((c) => used.add(c)); return v; });
  const citations = group.citations.filter((c) => used.has(c.id));

  const out = {
    who, id: P.id, name: a.name, short: P.short, names: P.names, otherNames: a.otherNames, title: a.title, tagline: a.tagline,
    story: person.story?.short ?? null, verseCount: (person.refs ?? []).length,
    periods: P.periods.map((p, i) => ({ ...p, entries: ordered.filter((e) => e.period === i + 1).map((e) => e.key) })),
    entries: ordered, rows, words, heat, accounts, objects, places: placesOut,
    kinds: Object.fromEntries([...Object.keys(P.kinds), "tradition"].map((k) => [k, k === "tradition" ? { label: "Tradition", icon: "dash", tone: "--muted" } : KINDS[k]])),
    lists: a.lists ?? [], calling: a.calling, companions: a.companions, family: a.family, identifications: a.identifications,
    ending: a.ending, questions: a.questions, notSaid: a.notSaid, writings: a.writings, citations,
    hero: P.hero, chapters: P.chapters, pairDefault: P.pairDefault, globe, verses: V.all,
  };
  V.addSpan(P.hero.ref);
  for (const ch of P.chapters) for (const s of ch.slides) {
    if (s.verse) { V.add(s.verse); const e = s.entry ? ordered.find((x) => x.key === s.entry) : null; if (e && !inAny(s.verse, e.refs)) fail(`${who}: slide verse ${s.verse} is outside ${s.entry}`); }
    if (s.entry && !ordered.some((x) => x.key === s.entry)) fail(`${who}: slide names unknown ${s.entry}`);
    if (s.fact && !ordered.some((x) => x.key === `fact.${s.fact}`)) fail(`${who}: slide names unknown fact ${s.fact}`);
  }
  fs.writeFileSync(`${OUT}/${who}.json`, JSON.stringify(out));
  console.log(`${who}: ${ordered.length} entries (${out.periods.map((p) => p.entries.length).join("/")}), ${rows.length} people, ${words.length} words, ${Object.keys(heat).length} books, ${accounts.length} accounts, ${objects.length} objects, ${placesOut.length} places, ${globe.arcs.length + globe.journeys.reduce((n, j) => n + j.arcs.length, 0)} arcs, ${Object.keys(V.all).length} verses, ${(fs.statSync(`${OUT}/${who}.json`).size / 1024).toFixed(0)} KB`);
}
fs.writeFileSync(`${OUT}/books.json`, JSON.stringify(Object.values(books).map((b) => [b.num, b.code, b.name])));
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("every object phrase and every word matches the KJV");
