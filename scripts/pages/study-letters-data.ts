// The Letters study's underlying material, listed once for CONTENT: every letter (what its "Inside" cards show) and
// each collection's shared material (questions, witnesses, pairings, timelines, maps, networks). study-letters.ts
// lists the pages and cards that show them.
import type { Claim, Letter, LetterGroup, LettersOverview } from "../../src/data/letters/types";
import type { Catalog } from "../../src/lib/types";
import { blocks, n, ref, refs, table, type Span } from "./study-lib";

const claim = (c: Claim | undefined) => (c?.text ?? "").trim() || "—";
const dates = (l: Letter) => (l.date.from ? `AD ${l.date.from}${l.date.to && l.date.to !== l.date.from ? `–${l.date.to}` : ""}` : "Not dated");

/** One letter: what "At a glance", "How it is built", "The words it leans on", "Old Testament" and "Who and where" show. */
export function letterDetail(catalog: Catalog, l: Letter): string {
  const s = (span: Span) => ref(catalog, span);
  return blocks(`#### ${l.name} (${n(l.verses)} verses${l.greekWords ? `, ${n(l.greekWords)} Greek words` : ""}; ${dates(l)})`,
    [`- **Author:** ${claim(l.author)}`, `- **To:** ${claim(l.recipients)}`, `- **Written from:** ${claim(l.writtenFrom)}`, `- **When:** ${claim(l.date)}`, `- **Why:** ${claim(l.occasion)}`,
      `- **Themes:** ${l.themes.map(claim).join(" · ")}`].join("\n"),
    `Key verses:\n\n${l.keyVerses.map((k) => `- ${s(k.span)}: ${k.why}`).join("\n")}`,
    `Outline ("How it is built"): ${l.outline.map((part) => `${part.title} (${s(part.span)}${part.kind ? `, ${part.kind}` : ""})`).join(" · ")}`,
    `Key Greek words: ${l.words.map((w) => `${w.greek} ${w.translit} "${w.gloss}" ${w.strongs} ×${w.count}`).join(" · ") || "—"}`,
    `People named (${l.people.length}): ${l.people.map((p) => p.name).join(", ") || "—"}. Places named (${l.places.length}): ${l.places.map((p) => `${p.name}${p.implied ? " (implied)" : ""}`).join(", ") || "—"}.`,
    `Old Testament quotations (${l.otQuotes.length}): ${l.otQuotes.map((q) => `${s(q.at)} ← ${s(q.from)}${q.note ? ` (${q.note})` : ""}`).join("; ") || "none"}.`);
}

const question = (q: LetterGroup["questions"][number]) =>
  `- **${q.question}** (${q.letters.join(", ")}) ${q.views.map((v) => `*${v.label}* (${v.holders}): ${claim(v.argument)}`).join(" / ")}`;
const witness = (c: LetterGroup["canon"][number]) => `${c.year} ${c.label} (${c.who}): ${Object.entries(c.status).map(([code, status]) => `${code} ${status}`).join(", ")}`;

/** A collection's shared material: its tagline and introduction, groupings, questions, witnesses and charts' data. */
export function groupDetail(catalog: Catalog, g: LetterGroup): string {
  return blocks(`### ${g.title}: shared material`,
    `Tagline (shown): ${g.tagline}\n\nIntroduction (in the data, **not shown in layout 2**, owner check pending): ${g.intro.map(claim).join(" ")}`,
    g.groupings?.length ? `Groupings (the figures bar; each explanation sits behind an ⓘ): ${g.groupings.map((x) => `**${x.label}** (${x.letters.join(", ")}): ${claim(x.claim)}`).join(" · ")}` : "",
    `Open questions (${g.questions.length}); each view is shown with who held it:\n\n${g.questions.map((q) => question(q)).join("\n")}`,
    `Canon witnesses (${g.canon.length}): ${g.canon.map(witness).join(" · ")}`,
    `Side-by-side pairings: ${g.parallels.map((p) => `**${p.title}** (${p.left.label} ↔ ${p.right.label}, ${p.pairs.length} pairs): ${claim(p.claim)}`).join(" · ") || "—"}`,
    `Timelines: ${g.timelines.map((t) => `**${t.title}** (${t.events.length}): ${t.events.map((e) => e.label).join(" · ")}`).join(" | ") || "—"}`,
    `Maps: ${g.maps.map((m) => `**${m.title}**${m.route ? " (route)" : ""}: ${m.stops.map((stop) => stop.name).join(" → ")}`).join(" | ") || "—"}`,
    `Networks: ${g.networks.map((x) => `**${x.title}** (${x.nodes.length} people): ${x.nodes.map((node) => node.label).join(", ")}`).join(" | ") || "—"}`,
    `Old Testament flows (the "ot-sources" one is merged into "The Old Testament behind them"; the collection's own chart is **not shown in layout 2**, owner check pending): ${g.flows.map((f) => `**${f.title}**: ${f.links.map((l) => `${l.source} → ${l.target} ${l.value}`).join(", ")}`).join(" | ") || "—"}`,
    g.ladders.length ? `Ladders: ${g.ladders.map((l) => `**${l.title}**: ${l.steps.map((step) => `${step.label} (better than ${step.better}; ${refs(catalog, step.refs, ", ")})`).join(" · ")}`).join(" | ")}` : "",
    `"Where this page comes from" (${g.citations.length} works): ${g.citations.map((c) => `${c.author}, *${c.title}* (${c.year})`).join("; ")}`);
}

/** What only the overview holds (used by the four ways in). */
export function overviewDetail(catalog: Catalog, o: LettersOverview): string {
  return blocks("### Across all twenty-one: shared material (overview.json)",
    `Tagline: ${o.tagline}\n\nIntroduction (in the data, **not shown in layout 2**, owner check pending): ${o.intro.map(claim).join(" ")}`,
    table(["Part of an ancient letter", "What it is", "Examples"], o.letterForm.map((f) => [f.part, claim(f.claim), refs(catalog, f.examples)])),
    table(["Hand", "Role", "Letter", "Passages", "Note"], o.hands.map((h) => [h.name, h.role, h.letter, refs(catalog, h.refs), h.note ?? ""])),
    table(["Letter", "Mentions", "Label", "What it says"], o.letterLinks.map((l) => [l.from, l.to, l.label, claim(l.claim)])),
    `People in more than one collection (${o.sharedPeople.length}): ${o.sharedPeople.map((p) => `**${p.name}** (${p.letters.join(", ")}): ${claim(p.claim)}`).join(" · ")}`,
    `Shared threads (${o.themes.length}): ${o.themes.map((t) => `**${t.title}** (${t.letters.join(", ")}): ${claim(t.claim)}`).join(" · ")}`,
    `How they were gathered and ordered: ${o.collection.map(claim).join(" ")}`,
    `Open questions about the letters as a whole (${o.questions.length}):\n\n${o.questions.map((q) => question(q)).join("\n")}`,
    `Canon witnesses for all twenty-one (${o.canon.length}): ${o.canon.map(witness).join(" · ")}`,
    `"Where this page comes from" on the ways in (${o.citations.length} works): ${o.citations.map((c) => `${c.author}, *${c.title}* (${c.year})`).join("; ")}`);
}

/** What browse.json adds for the ways in (scripts/build-letters-browse.py). */
export interface BrowseData {
  christ: Record<string, { title: string; topics: { title: string; n: number; points: { text: string; refs: Span[] }[] }[] }>;
  topicsTop: { title: string; total: number }[];
  greekWords: Record<string, number>;
  onlyHere: Record<string, { strongs: string; greek: string; count: number }[]>;
  grid: Record<string, number>;
  gospels: Record<string, Record<string, number>>;
  gospelNames: Record<string, string>;
  translations: { abbr: string; name: string; year?: number; lang: string; verses: Record<string, string> }[];
}

export function browseDetail(b: BrowseData, letters: Letter[]): string {
  const name = (code: string) => letters.find((l) => l.code === code)?.name ?? code;
  const pairs = Object.entries(b.grid).map(([key, count]) => [...key.split("|"), count] as [string, string, number]).filter(([a, c]) => a < c).sort((x, y) => y[2] - x[2]);
  const topics = Object.values(b.christ).map((section) => `**${section.title}**: ${section.topics.map((topic) => `${topic.title} (${topic.n} passages; points: ${topic.points.map((point) => point.text).join("; ")})`).join(" · ")}`);
  return blocks("### Across all twenty-one: computed tables (browse.json)",
    `Christ in the letters, Torrey's topics by card:\n\n${topics.map((line) => `- ${line}`).join("\n")}`,
    `The Topics that draw most on the letters (${b.topicsTop.length}): ${b.topicsTop.map((t) => `${t.title} ${t.total}`).join(" · ")}`,
    table(["Letter", "Greek words", "Words only here", "Most-used words only here", ...Object.values(b.gospelNames).map((g) => `Links to ${g}`)],
      letters.map((l) => [l.name, n(l.greekWords ?? b.greekWords[l.code] ?? 0), (b.onlyHere[l.code] ?? []).length, (b.onlyHere[l.code] ?? []).slice(0, 5).map((w) => `${w.greek} ${w.strongs}${w.count > 1 ? ` ×${w.count}` : ""}`).join(", "), ...Object.keys(b.gospelNames).map((g) => b.gospels[l.code]?.[g] ?? 0)])),
    `Most-linked pairs of letters (cross-references both ways; the grid has every pair): ${pairs.slice(0, 15).map(([a, c, count]) => `${name(a)} & ${name(c)} ${n(count)}`).join(" · ")}`,
    `"One verse in every translation" (${b.translations.length} translations, each letter's first key verse): ${b.translations.map((t) => `${t.abbr} (${t.name}${t.year ? `, ${t.year}` : ""})`).join(" · ")}`);
}
