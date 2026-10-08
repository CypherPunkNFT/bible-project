// "What readers still ask", gathered for one apostle from reviewed data only: his own open questions, the
// identifications his page relies on, what Scripture does not say, how his story ends (Scripture beside tradition),
// and the reviewed questions on the church and Letters pages that concern him. Each is placed in one of four groups.
// No question or answer is written here: titles for identifications are listed in spec-persons.cjs and shorten the
// identification itself; every answer is the reviewed text.
const fs = require("fs");
const { W } = require("./kjv.cjs");
const { QGROUP } = require("./spec-persons.cjs");
const read = (p) => JSON.parse(fs.readFileSync(W + "/" + p, "utf8"));
const files = {};
const fileOf = (p) => (files[p] ??= read(p));

const GROUPS = [
  { id: "who", title: "Who he was", sub: "Names, family and identifications" },
  { id: "happened", title: "What happened", sub: "Readings of the events" },
  { id: "ended", title: "How it ended", sub: "Where he went and how he died" },
  { id: "writings", title: "The writings", sub: "The books that bear his name" },
];

// The group of a "Scripture does not say" line, by its wording.
function silentGroup(text) {
  if (/\b(wrote|writer|letter|book|Gospel that bears|1 John|2 and 3 John)\b/i.test(text)) return "writings";
  if (/\b(die|died|death|killed|buried|Rome|Spain|India|Armenia|Ephesus|where he went|went after|after Acts 1:13|after Pentecost|later life|how .*died)\b/i.test(text)) return "ended";
  if (/\b(name|names|named|brother|twin|wife|children|age|trade|home|family|epithet|Iscariot|came from|appearance|married|same man|“James the less”|son of|whose)\b/i.test(text)) return "who";
  return "happened";
}
const viewGroup = (q) => QGROUP[q.id] ?? (/\b(wr(o|i)te|letter|Gospel|Revelation|Hebrews)\b/i.test(q.question) ? "writings" : /\b(die|death|Rome|preach|work after)\b/i.test(q.question) ? "ended" : "happened");
// Questions read better without the ordering note the data keeps in brackets: "(In the order the views arose.)".
const plainQ = (q) => q.replace(/\s*\((?:Most|In |Older|Earliest|Harmonising|Greek|Order|Scripture does not say|Acts gives|In date)[^)]*\)\.?\s*$/, "").trim();

function build({ a, spec, fail, citeOut }) {
  const out = [];
  // 1 · His own open questions.
  for (const q of a.questions ?? []) out.push({ id: q.id, group: viewGroup(q), q: plainQ(q.question), full: q.question, kind: "views", from: "This page", views: q.views });
  // 2 · Identifications his page relies on, each with its holder in the reviewed text.
  const titles = spec.ids ?? [];
  if (titles.length !== (a.identifications ?? []).length) fail(`${a.id}: ${titles.length} identification titles for ${(a.identifications ?? []).length} identifications`);
  (a.identifications ?? []).forEach((c, i) => out.push({ id: `id${i}`, group: "who", q: titles[i] ?? `Identification ${i + 1}`, kind: "answer", from: "The identifications this page relies on", views: [{ label: "What the page relies on", holders: "", argument: c }] }));
  // 3 · How it ends: Scripture first, then every tradition record by who said it and when.
  const ending = [...(a.ending?.scripture ?? []).map((c) => ({ label: "Scripture", holders: "", argument: c })),
    ...(a.ending?.tradition ?? []).map((t) => ({ label: t.who, holders: t.when, argument: { text: t.text, layer: t.layer, cites: t.cites } }))];
  if (ending.length) out.push({ id: "ending", group: "ended", q: "How did his story end?", kind: "ending", from: "How the story ends: Scripture beside tradition, never blended", views: ending });
  // 4 · Reviewed questions from the church and Letters pages that concern him.
  for (const x of spec.extra ?? []) {
    const path = x.src === "church" ? `src/data/people-pages/${x.file}.json` : `src/data/letters/${x.file}.json`;
    const f = fileOf(path);
    const q = x.src === "church" ? f.apostles.find((p) => p.id === x.person)?.questions.find((y) => y.id === x.id) : f.questions.find((y) => y.id === x.id);
    if (!q) { fail(`${a.id}: question ${x.file}/${x.person ?? ""}/${x.id} not found`); continue; }
    const prefix = `${x.file}:`;
    const views = q.views.map((v) => ({ ...v, argument: { ...v.argument, layer: v.argument.layer ?? "letters", cites: (v.argument.cites ?? []).map((c) => prefix + c) } }));
    for (const v of views) for (const c of v.argument.cites) {
      const cite = f.citations.find((y) => prefix + y.id === c);
      if (!cite) fail(`${a.id}: citation ${c} not found`); else citeOut.set(c, { ...cite, id: c });
    }
    const page = x.src === "church" ? `${f.apostles.find((p) => p.id === x.person).name}’s page` : `the ${f.title ?? "Letters"} page`;
    out.push({ id: `${x.file}-${x.id}`, group: x.src === "letters" ? (QGROUP[q.id] ?? "writings") : viewGroup(q), q: plainQ(q.question), full: q.question, kind: "views", from: `Asked on ${page}`, views });
  }
  // 5 · What Scripture does not say.
  (a.notSaid ?? []).forEach((s, i) => out.push({ id: `n${i}`, group: silentGroup(s), q: s, kind: "silent", from: "What Scripture does not say" }));
  const ids = out.map((q) => q.id);
  if (new Set(ids).size !== ids.length) fail(`${a.id}: duplicate question ids`);
  return { groups: GROUPS.map((g) => ({ ...g, n: out.filter((q) => q.group === g.id).length })), items: out };
}
module.exports = { build };
