// Builds data/david.json for the "Two voices" David mock-up from the site's reviewed files only:
//   src/data/people-pages/rulers-united-kingdom.json (David's ruler record + the group's citations)
//   data/study/people/david-rut-4-17.json (his person record: story paragraphs with refs)
//   data/places.json (place names and kinds), data/catalog.json (book names), data/text/kjv/<BOOK>/*.json (exact verse text)
// Run from this folder:  node extract.mjs
// The only editorial step here is LINKS: which narrative passage a psalm's title points to. Each link is listed below
// with the words of the title it rests on, and the page says so.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, "..", "..", "..");
const readJson = (p) => JSON.parse(readFileSync(join(site, p), "utf8"));

const group = readJson("src/data/people-pages/rulers-united-kingdom.json");
const ruler = group.rulers.find((r) => r.id === "david-rut-4-17");
if (!ruler) throw new Error("rulers-united-kingdom.json: expected a ruler with id david-rut-4-17, found none");
const person = readJson("data/study/people/david-rut-4-17.json");
const placesAll = readJson("data/places.json");
const catalog = readJson("data/catalog.json");
const books = Object.fromEntries(catalog.books.map((b) => [b.num, { code: b.code, name: b.name }]));

// ── KJV text ────────────────────────────────────────────────────────────────────────────────────────────────────────
const chunkCache = new Map();
function chapter(bookNum, ch) {
  const code = books[bookNum]?.code;
  if (!code) throw new Error(`kjv: unknown book number ${bookNum}`);
  const file = `data/text/kjv/${code}/${Math.floor((ch - 1) / 5)}.json`;
  if (!chunkCache.has(file)) chunkCache.set(file, readJson(file));
  const c = chunkCache.get(file)[String(ch)];
  if (!c) throw new Error(`kjv: ${file} has no chapter ${ch}`);
  return c;
}
const flat = (runs) => runs.map((x) => (typeof x === "string" ? x : Array.isArray(x) ? x[0] : "")).join("").replace(/\s+/g, " ").replace(/^¶\s*/, "").trim();
const parts = (id) => ({ book: Math.floor(id / 1e6), ch: Math.floor((id % 1e6) / 1e3), v: id % 1e3 });
function verse(id) {
  const { book, ch, v } = parts(id);
  const found = chapter(book, ch).v.find((x) => Number(x.n) === v);
  if (!found) throw new Error(`kjv: no verse ${id}`);
  return flat(found.r);
}
const verseSpan = ([a, b = a]) => {
  const out = [];
  for (let id = a; id <= b; id++) out.push(verse(id));
  return out.join(" ");
};
const kjv = (span) => ({ ref: span, text: verseSpan(span) });
const psalmTitle = (n) => { const c = chapter(19, n); if (!c.t) throw new Error(`kjv: Psalm ${n} has no title`); return flat(c.t); };

// ── Places ──────────────────────────────────────────────────────────────────────────────────────────────────────────
const placeById = Object.fromEntries(placesAll.map((p) => [p.id, p]));
const placeName = (id) => (id && placeById[id] ? placeById[id].name : null);

// ── The record: moments before the reign (from the person record's story, the accession claims and the KJV) ────────
const story = person.story.paragraphs;
const before = [
  { id: "anointed", label: "Anointed at Bethlehem", kind: "anointing", claim: ruler.accession[0], verses: [kjv([9016013])], place: "Bethlehem" },
  { id: "court", label: "Saul's court, Goliath and Jonathan", kind: "battle", claim: { text: story[1].text.split(" David married")[0], refs: story[1].refs.slice(0, 5) } },
  { id: "watched", label: "Saul's men watch his house", kind: "personal", claim: { text: "David married Saul's daughter Michal, and when Saul sent men to kill him, she let him down through a window.", refs: [[9018027, 9018027], [9019011, 9019012]] }, verses: [kjv([9019011])] },
  { id: "gath", label: "Before Achish at Gath", kind: "personal", verses: [kjv([9021010]), kjv([9021013])], refs: [[9021010, 9021015]], place: "Gath" },
  { id: "adullam", label: "The cave Adullam", kind: "personal", verses: [kjv([9022001])], refs: [[9022001, 9022004]], place: "Adullam" },
  { id: "doeg", label: "Doeg tells Saul", kind: "personal", verses: [kjv([9022009])], refs: [[9022009, 9022023]] },
  { id: "ziph", label: "The Ziphites tell Saul", kind: "personal", verses: [kjv([9023014]), kjv([9023019])], refs: [[9023014, 9023028]] },
  { id: "engedi", label: "The cave at En-gedi", kind: "personal", claim: { text: "Twice he had Saul in his power and would not harm “the LORD's anointed”.", refs: [[9024004, 9024007], [9026009, 9026011]] }, verses: [kjv([9024003])] },
  { id: "ziklag", label: "Ziklag, from Achish", kind: "alliance", claim: ruler.nation.alliances.find((c) => c.text.includes("Achish")), place: "Ziklag" },
  { id: "lament", label: "“How are the mighty fallen!”", kind: "worship", claim: { text: "When Saul and Jonathan died, he lamented.", refs: [[10001017, 10001019]] }, verses: [kjv([10001019])] },
];
for (const m of before) {
  if (m.claim && !m.claim.layer && m.id === "court") m.claim.layer = null; // the site's own story paragraph
  else if (m.claim && !m.claim.layer) m.claim.layer = "scripture";
}

// ── The record: the reign's events, grouped into movements by where the text tells them ───────────────────────────────
const firstRef = (e) => e.claim.refs[0][0];
const movementOf = (e) => {
  const { book, ch } = parts(firstRef(e));
  if (book === 10 && (ch <= 4 || (ch === 5 && parts(firstRef(e)).v <= 5))) return "hebron";
  if (book === 10 && ch <= 10) return "jerusalem";
  if (book === 10 && ch <= 20) return "sword";
  return "last";
};
const slug = (s) => s.toLowerCase().replace(/[“”‘’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const events = ruler.events.map((e) => ({ id: slug(e.label), label: e.label, kind: e.kind, claim: e.claim, year: e.year ?? null, place: placeName(e.placeId), movement: movementOf(e) }));

const verseFor = { "flight-over-the-mount-of-olives": [[10015014], [10015030]], "thou-art-the-man": [[10012001], [10012013]], "garrisons-in-edom": [[10008013], [13018012]], "zobah-and-damascus": [[10008003]], "the-song-and-last-words": [[10022001], [10023001]] };
for (const e of events) if (verseFor[e.id]) e.verses = verseFor[e.id].map((s) => kjv(s));

const movements = [
  { id: "before", n: "I", title: "Before the throne", sub: "The shepherd, the court and the years on the run", span: "1 Samuel 16 – 2 Samuel 1", moments: before },
  { id: "hebron", n: "II", title: "Hebron", sub: "Seven years and six months over Judah", span: "2 Samuel 2 – 5:5", moments: events.filter((e) => e.movement === "hebron") },
  { id: "jerusalem", n: "III", title: "Jerusalem", sub: "The city, the ark, the promise and the wars", span: "2 Samuel 5–10", moments: events.filter((e) => e.movement === "jerusalem") },
  { id: "sword", n: "IV", title: "“The sword shall never depart from thine house”", sub: "Bathsheba, Nathan, Amnon, Absalom, Sheba", span: "2 Samuel 11–20", moments: events.filter((e) => e.movement === "sword") },
  { id: "last", n: "V", title: "The last years", sub: "Famine, giants, the song, the census, the temple prepared, the crown passed", span: "2 Samuel 21–24 · 1 Kings 1–2 · 1 Chronicles 22–29", moments: events.filter((e) => e.movement === "last") },
];
const momentIds = new Set(movements.flatMap((m) => m.moments.map((x) => x.id)));

// ── His voice: the twelve psalms whose titles name a moment ─────────────────────────────────────────────────────────
// links: the moment(s) the title points to. "loose" = the title names a place, not a moment, so the string is not tied.
const PSALMS = [
  { n: 59, links: ["watched"], because: "when Saul sent, and they watched the house to kill him" },
  { n: 56, links: ["gath"], because: "when the Philistines took him in Gath" },
  { n: 34, links: ["gath"], because: "when he changed his behaviour before Abimelech", note: "The title names Abimelech. 1 Samuel 21 names the king of Gath Achish (21:10–12) and says David “changed his behaviour before them” (21:13)." },
  { n: 57, links: ["adullam", "engedi"], because: "when he fled from Saul in the cave", note: "The title says “the cave” and does not name it. 1 Samuel tells of two: the cave Adullam (22:1) and the cave at En-gedi (24:3). The string touches both." },
  { n: 142, links: ["adullam", "engedi"], because: "A Prayer when he was in the cave", note: "As with Psalm 57, the title does not say which cave." },
  { n: 52, links: ["doeg"], because: "when Doeg the Edomite came and told Saul" },
  { n: 54, links: ["ziph"], because: "when the Ziphims came and said to Saul, Doth not David hide himself with us?" },
  { n: 63, links: ["ziph", "flight-over-the-mount-of-olives"], loose: true, because: "when he was in the wilderness of Judah", note: "The title names a place, not a moment. 1 Samuel puts him in the wilderness fleeing Saul (23:14); 2 Samuel has him go “toward the way of the wilderness” fleeing Absalom (15:23). Neither passage says “wilderness of Judah”, so this string is left untied." },
  { n: 60, links: ["zobah-and-damascus", "garrisons-in-edom"], because: "when he strove with Aram-naharaim and with Aram-zobah, when Joab returned, and smote of Edom in the valley of salt twelve thousand", note: "Three tellings of the valley of salt: the title, Joab and twelve thousand of Edom; 2 Samuel 8:13, David and eighteen thousand Syrians; 1 Chronicles 18:12, Abishai and eighteen thousand Edomites." },
  { n: 51, links: ["thou-art-the-man"], because: "when Nathan the prophet came unto him, after he had gone in to Bath-sheba" },
  { n: 3, links: ["flight-over-the-mount-of-olives"], because: "when he fled from Absalom his son" },
  { n: 18, links: ["the-song-and-last-words"], because: "in the day that the LORD delivered him from the hand of all his enemies, and from the hand of Saul", note: "2 Samuel 22 gives the same song, under a heading in almost the same words (22:1)." },
];
const STOP = new Set("the and of to in that he him his unto with when from for a an is was be it said came come this they them their which all who by not as at on day after david upon before behold".split(" "));
const stems = (s) => new Set(s.toLowerCase().replace(/[’']s\b/g, "").split(/[^a-z]+/).filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.slice(0, 5)));
const psalms = PSALMS.map((p) => {
  for (const l of p.links) if (!momentIds.has(l)) throw new Error(`psalm ${p.n}: link "${l}" is not a moment id`);
  const title = psalmTitle(p.n);
  const c = chapter(19, p.n);
  const lines = c.v.slice(0, 2).map((v) => ({ ref: [19000000 + p.n * 1000 + Number(v.n)], text: flat(v.r) }));
  // Echo words: words of the title that also stand in the linked passage's verses (shown lit when the string sounds).
  const momentText = p.links.map((id) => { const m = movements.flatMap((x) => x.moments).find((x) => x.id === id); return (m.verses ?? []).map((v) => v.text).join(" "); }).join(" ");
  const shared = stems(momentText);
  const echo = [...stems(title)].filter((s) => shared.has(s));
  return { ...p, title, lines, echo, verses: c.v.length };
});

// ── Everything else on the ruler page, carried over as it is ─────────────────────────────────────────────────────────
const passages = ruler.passages;
const out = {
  about: {
    id: ruler.id, name: ruler.name, title: ruler.title, tagline: ruler.tagline, house: ruler.house, tribe: ruler.tribe, kind: ruler.kind, realm: ruler.realm,
    capital: ruler.capital, reign: ruler.reign, records: ruler.records, identifications: ruler.identifications,
    predecessor: { id: ruler.predecessor, name: group.rulers.find((r) => r.id === ruler.predecessor)?.name ?? null },
    successor: { id: ruler.successor, name: "Solomon" },
    era: person.e, brief: person.b, short: person.story.short, refCount: person.refs.length,
  },
  epigraph: kjv([10023001]),
  verdict: { tone: ruler.verdictTone, quote: ruler.records.find((r) => r.verdict)?.verdict, notes: ruler.verdictNotes },
  accession: ruler.accession,
  anointings: [
    { where: "Bethlehem", by: "Samuel", whom: "in the midst of his brethren", verse: kjv([9016013]), claim: ruler.accession[0] },
    { where: "Hebron", by: "the men of Judah", whom: "king over the house of Judah", verse: kjv([10002004]), claim: ruler.accession[1] },
    { where: "Hebron", by: "the elders of Israel", whom: "king over Israel", verse: kjv([10005003]), claim: ruler.accession[2] },
  ],
  movements, psalms,
  nation: ruler.nation, prophets: ruler.prophets,
  // David's answer to a prophet, where the record gives one in his own words.
  replies: { "nathan-2sa-7-2": kjv([10012013]), "gad-1sa-22-5": kjv([10024014]) }, worldStage: ruler.worldStage, outside: ruler.outside,
  twoAccounts: ruler.twoAccounts, questions: ruler.questions, notSaid: ruler.notSaid, dates: ruler.dates,
  places: ruler.places.map((p) => ({ ...p, type: placeById[p.placeId]?.type ?? null })),
  passages, citations: group.citations.filter((c) => JSON.stringify(ruler).includes(`"${c.id}"`)),
  books: Object.fromEntries(Object.entries(books).map(([k, v]) => [k, v])),
  sources: [
    "src/data/people-pages/rulers-united-kingdom.json", "data/study/people/david-rut-4-17.json", "data/places.json", "data/catalog.json", "data/text/kjv (KJV, with the psalm titles)",
  ],
};
writeFileSync(join(here, "data", "david.json"), JSON.stringify(out));
console.log(`david.json: ${movements.reduce((n, m) => n + m.moments.length, 0)} moments in ${movements.length} movements, ${psalms.length} psalms, ${out.twoAccounts.length} two-account topics, ${out.places.length} places`);
for (const p of psalms) console.log(`Ps ${p.n}: echo [${p.echo.join(", ")}]  ->  ${p.links.join(" + ")}`);
