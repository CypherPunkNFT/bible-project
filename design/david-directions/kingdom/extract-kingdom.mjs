// The kingdom's own additions to data/david.json (called from extract.mjs): the moments as crystals (by kind, at their
// named places), the reign's events gathered into large categories (each with its key verse, the Chronicles telling,
// the prophet, outside records, world stage and open questions that belong to it), and the place tiles.
// Everything is chosen from the ruler file, the person file and the KJV text; nothing here is new wording except the
// category titles and one-line leads, which say only how many events each holds and from where to where.

// Crystal kinds, as the Life helix grouped them (the data's own kind is kept beside each).
export const KINDS = [
  { id: "anointing", label: "Anointing", icon: "oil", shape: "Long bipyramid" },
  { id: "battle", label: "Battle", icon: "swords", shape: "Spike" },
  { id: "building", label: "Building", icon: "hammer", shape: "Cube" },
  { id: "worship", label: "Worship", icon: "ark", shape: "Twenty faces" },
  { id: "family", label: "Family", icon: "home", shape: "Twelve faces" },
  { id: "sin", label: "Sin and judgment", icon: "bolt", shape: "Dark shard" },
  { id: "word", label: "The LORD's word", icon: "scrollWord", shape: "Star" },
  { id: "court", label: "Court and allies", icon: "landmark", shape: "Hex prism" },
];
const KIND_OF_EVENT = [
  "anointing", "battle", "anointing", "battle", "battle", "building", "worship", "worship", "word", "battle",
  "battle", "court", "battle", "family", "battle", "sin", "sin", "family", "battle", "family",
  "battle", "family", "battle", "court", "battle", "sin", "battle", "worship", "sin", "sin",
  "worship", "building", "anointing", "family",
];
// Where an event stands on the table when the ruler file gives it no place: a place its own verses name.
const EVENT_PLACE = {
  8: "a15257a", 9: "aa0b1d6", 13: "a15257a", 15: "a15257a", 16: "a15257a", 17: "a15257a", 22: "aa24ad4", 23: "ab94aea",
  25: "aede336", 26: "aea4530", 28: "a15257a", 29: "a15257a", 31: "a15257a", 33: "a84f426",
};
// Key verses chosen by hand where the first verse of the span only sets the scene (each must lie inside the refs).
const KEY_VERSE = { 2: 10005003, 6: 10006007, 7: 10006015, 8: 10007016, 13: 10009007, 14: 10010019, 15: 10011027, 16: 10012007,
  19: 10013038, 21: 10015030, 22: 10018033, 24: 10020001, 26: 10021022, 28: 10024002, 29: 10024016, 31: 13022005, 32: 11001039, 33: 11002010 };

// The categories of the reign (every event in exactly one).
const CATS = [
  { id: "crown", title: "The crown", icon: "crown", events: [0, 2, 32, 33], nation: [], verdict: [], reign: true,
    lead: "Four events: king over Judah at Hebron, king over all Israel, Solomon anointed at Gihon, and the charge and death." },
  { id: "wars", title: "Wars and enemies", icon: "swords", events: [1, 4, 9, 10, 11, 12, 14, 18, 26], nation: [["alliances", 5], ["alliances", 2], ["people", 1]], verdict: [4],
    lead: "Nine events, from the long war with the house of Saul to the giants of Gath." },
  { id: "city", title: "Jerusalem, the city of David", icon: "castle", events: [3, 5, 13], nation: [["building", 0], ["building", 1], ["alliances", 0]], verdict: [], capital: true,
    lead: "Three events: the strong hold of Zion taken, Hiram's cedar house, and Mephibosheth at the king's table." },
  { id: "worship", title: "The ark and worship", icon: "ark", events: [6, 7, 27, 30, 31], nation: [["worship", 0], ["worship", 1], ["worship", 2], ["worship", 3], ["worship", 4], ["building", 3]], verdict: [],
    lead: "Five events: the ark brought up, the song and last words, the altar on the threshingfloor, and the stores for the temple." },
  { id: "word", title: "The LORD's word to David", icon: "scrollWord", events: [8, 16, 17], nation: [["building", 2]], verdict: [1, 3, 5],
    lead: "Three events, all through Nathan: the promise of a house, “Thou art the man”, and the child named Jedidiah." },
  { id: "sin", title: "Sin and its cost", icon: "bolt", events: [15, 25, 28, 29], nation: [["people", 2]], verdict: [0, 2],
    lead: "Four events: Bathsheba and Uriah, the famine and the Gibeonites, the census, and the plague." },
  { id: "sword", title: "The sword in his house", icon: "flag", events: [19, 20, 21, 22, 23, 24], nation: [["people", 3], ["alliances", 3]], verdict: [], notSaid: [3], quoteVerse: 10012010,
    lead: "Six events, from Amnon and Tamar through Absalom's revolt to Sheba's trumpet." },
];
const EVENT_TWO = { 2: [11], 6: [9], 9: [8], 10: [5], 12: [7], 14: [6], 15: [12], 26: [4, 10], 28: [0, 1], 29: [2], 30: [3], 32: [13] };
const EVENT_PROPHET = { 8: 2, 16: 2, 17: 2, 32: 2, 28: 1, 29: 1, 30: 1 };
const EVENT_QUESTION = { 5: "david-hiram", 20: "david-absalom-forty", 26: "david-goliath", 28: "david-census" };
const EVENT_OUTSIDE = { 10: 1 };
const EVENT_POWER = { 4: 0, 10: 1, 11: 2, 14: 3, 12: 4, 5: 5, 19: 6 };

export function kingdomData({ D, person, verse, place, fail }) {
  const inSpan = (id, [a, b]) => id >= a && id <= b;
  const norm = (t) => t.toLowerCase().replace(/[’‘]/g, "'");
  function* versesIn([a, b]) { for (let id = a; id <= b; id++) { try { verse(id); yield id; } catch { /* past the chapter's end */ } } }
  function keyVerse(claim, at) {
    const spans = claim.refs ?? [];
    if (!spans.length) return null;
    if (at) { if (!spans.some((s) => inSpan(at, s))) fail(`key verse ${at} is outside the claim's refs`); verse(at); return at; }
    const quoted = [...claim.text.matchAll(/[“"]([^”"]{6,})[”"]/g)].map((m) => m[1].replace(/[,.;:!?]+$/, "").trim());
    for (const q of quoted) {
      const probe = norm(q.split(/\s+/).slice(0, 5).join(" "));
      for (const span of spans) if (span[1] - span[0] < 200) for (const id of versesIn(span)) if (norm(verse(id)).includes(probe)) return id;
    }
    verse(spans[0][0]);
    return spans[0][0];
  }
  const storyClaim = (i, opening, refs) => {
    const p = person.story.paragraphs[i];
    const sentences = p.text.match(/[^.!?]+(?:[.!?]+["”]?|$)\s*/g).map((s) => s.trim());
    const text = sentences.find((s) => s.startsWith(opening)) ?? fail(`story ${i}: no sentence starting "${opening}"`);
    for (const r of refs) if (!p.refs.some((x) => x[0] === r[0] && x[1] === r[1])) fail(`story ${i}: ref ${r} not in the paragraph's refs`);
    return { text, layer: null, refs };
  };

  if (KIND_OF_EVENT.length !== D.events.length) fail(`${KIND_OF_EVENT.length} kinds for ${D.events.length} events`);
  const covered = CATS.flatMap((c) => c.events);
  D.events.forEach((e, i) => { if (covered.filter((x) => x === i).length !== 1) fail(`event ${i} (${e.label}) must be in exactly one category`); });

  // ── The moments as crystals ──
  const pick = (list, test, where) => list.find(test) ?? fail(`not found in ${where}`);
  const before = [
    { id: "jesse", label: "Son of Jesse", kind: "family", claim: storyClaim(0, "David was the son of Jesse", [[8004013, 8004017]]), placeId: "a112427", verse: 8004017 },
    { id: "anointed-samuel", label: "Anointed by Samuel at Bethlehem", kind: "anointing", claim: D.accession[0], placeId: "a112427", verse: 9016013 },
    { id: "goliath", label: "Goliath", kind: "battle", claim: storyClaim(1, "Sent to bring food", [[9017017, 9017018], [9017045, 9017050]]), placeId: "ab183f8", verse: 9017050 },
    { id: "adullam", label: "The cave of Adullam", kind: "family", claim: storyClaim(2, "At the cave of Adullam", [[9022001, 9022004]]), placeId: "af82614", verse: 9022001 },
    { id: "ziklag", label: "Ziklag, from Achish", kind: "court", claim: pick(D.nation.alliances, (c) => c.text.startsWith("Before he reigned he had served Achish"), "nation.alliances"), placeId: "a0ed7ff", verse: 9027006 },
    { id: "amalek", label: "Ziklag's spoil recovered", kind: "battle", claim: pick(D.worldStage, (w) => w.power === "Amalek", "worldStage").claim, placeId: "a0ed7ff", verse: 9030019 },
  ];
  const catOf = (i) => CATS.find((c) => c.events.includes(i)).id;
  const events = D.events.map((e, i) => {
    const placeId = e.placeId || EVENT_PLACE[i] || null;
    if (placeId) place(placeId);
    return { i, label: e.label, kind: KIND_OF_EVENT[i], dataKind: e.kind, year: e.year ?? null, claim: e.claim, placeId, cat: catOf(i),
      verse: keyVerse(e.claim, KEY_VERSE[i]), two: EVENT_TWO[i] ?? [], prophet: EVENT_PROPHET[i] ?? null, question: EVENT_QUESTION[i] ?? null,
      outside: EVENT_OUTSIDE[i] ?? null, power: EVENT_POWER[i] ?? null };
  });
  const crystals = [
    ...before.map((b) => { place(b.placeId); verse(b.verse); return { id: b.id, label: b.label, kind: b.kind, claim: b.claim, placeId: b.placeId, verse: b.verse, before: true }; }),
    ...events.filter((e) => e.placeId).map((e) => ({ id: `ev-${e.i}`, event: e.i, label: e.label, kind: e.kind, claim: e.claim, placeId: e.placeId, verse: e.verse, cat: e.cat })),
  ];
  const unplaced = events.filter((e) => !e.placeId).map((e) => e.label);

  // ── Categories ──
  const cats = CATS.map((c) => {
    const nation = c.nation.map(([k, i]) => D.nation[k][i] ?? fail(`nation.${k}[${i}] missing`));
    if (c.quoteVerse) verse(c.quoteVerse);
    return { ...c, nation };
  });

  // ── Place tiles: distance and direction from Jerusalem (towns, springs and hills; regions and rivers have no single point) ──
  const J = place(D.capital.placeId);
  const toRad = (d) => (d * Math.PI) / 180;
  function fromJerusalem(p) {
    if (p.id === J.id || p.type === "region" || p.type === "river") return null;
    const R = 6371, dLat = toRad(p.lat - J.lat), dLon = toRad(p.lon - J.lon);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(J.lat)) * Math.cos(toRad(p.lat)) * Math.sin(dLon / 2) ** 2;
    const km = Math.round(2 * R * Math.asin(Math.sqrt(a)));
    if (km < 2) return { km: 0, dir: "", deg: 0 };
    const y = Math.sin(dLon) * Math.cos(toRad(p.lat)), x = Math.cos(toRad(J.lat)) * Math.sin(toRad(p.lat)) - Math.sin(toRad(J.lat)) * Math.cos(toRad(p.lat)) * Math.cos(dLon);
    const deg = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    return { km, dir: ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"][Math.round(deg / 45) % 8], deg: Math.round(deg) };
  }
  const tiles = D.places.map((p, i) => {
    const a = place(p.placeId);
    return { i, placeId: p.placeId, name: p.name, note: p.note, refs: p.refs, type: a.type, confidence: a.confidence, named: a.verses?.length ?? 0,
      from: fromJerusalem(a), events: events.filter((e) => e.placeId === p.placeId).map((e) => e.i) };
  });
  return { kinds: KINDS, events, crystals, unplaced, cats, tiles };
}
