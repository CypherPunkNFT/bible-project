// What came first? build: the owner's review sheet (design §12), regenerated on every build. Plain words: labels, not
// ids; verses as references; windows as "about ... BC". Striking a pair means adding it to the source file's blocked list.
import type { Fact, Item, Span } from "../../src/pages/games/what-came-first/order.ts";
import type { BooksResult } from "./books.ts";
import { books, type BandCounts } from "./common.ts";
import type { EventsResult } from "./events.ts";
import type { FirstsResult } from "./firsts.ts";
import type { HandResult } from "./hand.ts";
import type { JourneysResult } from "./journeys.ts";
import type { LivedResult } from "./lived.ts";
import type { RulersResult } from "./rulers.ts";

export interface SheetInput { lived: LivedResult; events: EventsResult; ruled: RulersResult; built: HandResult; went: JourneysResult;
  died: HandResult; books: BooksResult; firsts: FirstsResult }

const n = (value: number) => value.toLocaleString("en-GB");
const cell = (text: string) => text.replace(/\|/g, "/").replace(/\n/g, " ");

/** One span as a reference: "Genesis 4:17", "Acts 13:19–21", "Judges 5:31–6:1". */
export function reference([start, end]: Span): string {
  const book = books.get(Math.floor(start / 1_000_000))?.name ?? "?";
  const [c1, v1, c2, v2] = [Math.floor(start / 1000) % 1000, start % 1000, Math.floor(end / 1000) % 1000, end % 1000];
  if (start === end) return `${book} ${c1}:${v1}`;
  return c1 === c2 ? `${book} ${c1}:${v1}–${v2}` : `${book} ${c1}:${v1}–${c2}:${v2}`;
}
const refs = (spans: readonly Span[]) => spans.map(reference).join("; ");
const year = (y: number) => (y < 0 ? `${-y} BC` : `AD ${y}`);
function window(item: Item): string {
  if (!item.shown) return "early Genesis: no year shown; ordered only by verses among early-Genesis items";
  if (item.lo === null && item.hi === null) return "no years: ordered only by verses";
  if (item.lo === null) return `no earliest year; by ${year(item.hi!)}`;
  if (item.hi === null) return `from ${year(item.lo)}; no latest year`;
  return item.lo === item.hi ? `about ${year(item.lo)}` : `about ${year(item.lo)} to ${year(item.hi)}`;
}
const bandLine = (b: BandCounts) => `${n(b.easy)} easy, ${n(b.medium)} medium, ${n(b.hard)} hard`;

function factTable(facts: readonly Fact[], label: (id: string) => string): string[] {
  if (!facts.length) return ["None.", ""];
  return ["| Came first | Then | Verse | Why |", "|---|---|---|---|",
    ...facts.map((f) => `| ${cell(label(f.first))} | ${cell(label(f.second))} | ${refs(f.refs)} | ${cell(f.why)} |`), ""];
}
function blockedTable(rows: readonly { a: string; b: string; reason: string }[], label: (id: string) => string): string[] {
  if (!rows.length) return ["None.", ""];
  return ["| Pair never asked | Why |", "|---|---|", ...rows.map((r) => `| ${cell(label(r.a))} and ${cell(label(r.b))} | ${cell(r.reason)} |`), ""];
}
const leftOutList = (rows: readonly { name: string; reason: string }[]) => (rows.length ? [...rows.map((r) => `- **${r.name}**: ${r.reason}`), ""] : ["None.", ""]);
const details = (summary: string, body: string[]) => ["<details>", `<summary>${summary}</summary>`, "", ...body, "</details>", ""];

function eventsSection({ events }: SheetInput): string[] {
  const label = (id: string) => events.pool.items.find((e) => e.id === id)?.label ?? id;
  return ["## 2. What happened first?", "",
    `The Timeline sort game's events, windows and order facts, unchanged. ${n(events.pool.items.length)} events, ${n(events.pool.orders.length)} askable pairs (${bandLine(events.pool.perBand)}).`, "",
    "### This game's own blocks", "",
    ...events.source.blockedGroups.flatMap((g) => [`- **${g.name}** (never asked against each other: ${g.ids.map(label).join(", ")}): ${g.reason}`]),
    ...events.source.blocked.map((b) => `- **${label(b.a)}** and **${label(b.b)}**: ${b.reason}`), "",
    `The Timeline game's ${events.contested} contested pairs are carried over as blocked pairs too (listed below).`, "",
    ...details(`Every event (${events.pool.items.length}), with its window and verse`, ["| Event | When | Verse |", "|---|---|---|",
      ...events.pool.items.map((e) => `| ${cell(e.label)} | ${cell(window(e))} | ${refs(e.refs)} |`), ""]),
    ...details(`Every order fact (${events.facts.length})`, factTable(events.facts, label)),
    ...details(`Every blocked pair (${events.blocked.length})`, events.blocked.map(([a, b]) => `- ${label(a)} and ${label(b)}`).concat([""])),
  ];
}

function rulersSection({ ruled }: SheetInput): string[] {
  const label = (id: string) => ruled.pool.items.find((r) => r.id === id)?.label ?? id;
  const hand = ruled.facts.filter((f) => !f.derived);
  const derived = ruled.facts.filter((f) => f.derived);
  const kind = (k: string) => (k === "synchronism" ? "dated by the other king's reign" : k === "succession" ? "follows on one throne" : "the verse says so");
  const reached = [...new Set(ruled.expanded.map((f) => f.second))].map(label);
  return ["## 3. Who ruled first?", "",
    `${n(ruled.pool.items.length)} rulers, ${n(ruled.pool.orders.length)} askable pairs (${bandLine(ruled.pool.perBand)}). "First" means began to rule first. Every window is worked out from the site's ruler pages: the start year in every dating system given, the end year of the ruler before, then one year more at each end. ${ruled.settledByWindows} successions are already settled by the windows and need no fact.`, "",
    "### Every ruler", "", "| Ruler | Title | Began to rule | How the window was set | Verse |", "|---|---|---|---|---|",
    ...ruled.pool.items.map((r) => `| ${cell(r.label)} | ${cell(r.tag)} | ${cell(window(r))} | ${cell(ruled.notes.get(r.id) ?? "")} | ${refs(r.refs)} |`), "",
    "### Order facts written by hand", "", "| Came first | Then | Kind | Verse | Why |", "|---|---|---|---|---|",
    ...hand.map((f) => `| ${cell(label(f.first))} | ${cell(label(f.second))} | ${kind(f.kind)} | ${refs(f.refs)} | ${cell(f.why)} |`), "",
    "### Successions the build took from the ruler pages (strike any that look wrong)", "", ...factTable(derived, label),
    "### Joshua and the judges before Saul (the one fact that reaches more than one pair)", "",
    `${ruled.source.beforeSaul.ids.filter((id) => ruled.pool.items.some((r) => r.id === id)).map(label).join(", ")} have no years. ${refs(ruled.source.beforeSaul.refs)}: "${ruled.source.beforeSaul.why}" So each is asked against Saul and against every ruler who certainly began after Saul (a window wholly after his, or a verse that puts them after him): ${reached.length} rulers, ${n(ruled.expanded.length)} pairs.`, "",
    ...details("The rulers they reach", [reached.join(", "), ""]),
    "### Facts a dating system contradicts (refused, and the pair blocked)", "",
    ...(ruled.refusals.length ? ruled.refusals.map((r) => `- ${label(r.first)} before ${label(r.second)} (${kind(r.kind)}): ${r.system} has ${r.detail}.`) : ["None."]), "",
    "### Blocked pairs", "", ...blockedTable(ruled.source.blocked, label),
    "### Left out", "", ...leftOutList(ruled.source.leftOut)];
}

function handSection(title: string, result: HandResult, verseWord: string): string[] {
  const label = (id: string) => result.pool.items.find((i) => i.id === id)?.label ?? id;
  return [title, "", `${n(result.pool.items.length)} items, ${n(result.pool.orders.length)} askable pairs (${bandLine(result.pool.perBand)}).`, "",
    `| Item | Tag | When | How the window was set | ${verseWord} | Line shown |`, "|---|---|---|---|---|---|",
    ...result.pool.items.map((i) => `| ${cell(i.label)} | ${cell(i.tag)} | ${cell(window(i))} | ${cell(result.notes.get(i.id) ?? "")} | ${refs(i.refs)} | ${cell(i.when)} |`), "",
    "### Order facts", "", ...factTable(result.facts, label),
    "### Blocked pairs", "", ...blockedTable(result.source.blocked, label),
    "### Left out", "", ...leftOutList(result.leftOut)];
}

function journeysSection({ went }: SheetInput): string[] {
  const label = (id: string) => went.pool.items.find((s) => s.id === id)?.label ?? id;
  const out = ["## 5. Where did they go first?", "",
    `${went.journeys} journeys, ${n(went.pool.items.length)} stops, ${n(went.pool.orders.length)} askable pairs (${bandLine(went.pool.perBand)}). A pair is only ever two stops of one journey; the first arrival counts; the starting place is never a card.`, ""];
  for (const j of went.source.journeys) {
    out.push(`### ${j.traveller}: ${j.title} (${refs(j.span)})`, "", `Starts at ${j.origin.place} (${refs(j.origin.refs)}), never a card.`, "");
    j.stops.forEach((s, index) => out.push(`${index + 1}. **${s.place}**: ${refs(s.arrive)}${s.placeId ? "" : " (no map place)"}${s.sameVerse ? ` (same verse as the stop before: ${s.sameVerse})` : ""}`));
    out.push("");
  }
  out.push("### Blocked pairs", "", ...blockedTable(went.source.blocked, label), "### Left out", "", ...leftOutList(went.source.leftOut));
  return out;
}

function firstsSection({ firsts }: SheetInput): string[] {
  const out = ["## 8. Bible Firsts", "", `${firsts.questions.length} questions. Each has one right answer and two or three wrong ones; "never" names a defensible answer that is never offered.`, ""];
  firsts.questions.forEach((q, index) => {
    out.push(`${index + 1}. **${q.question}** Answer: **${q.answer}**. Wrong options: ${q.options.join("; ")}.${q.never?.length ? ` Never offered: ${q.never.join("; ")}.` : ""}`,
      `   ${q.evidence === "states" ? "Scripture states it" : "Scripture plainly shows it"}: ${refs(q.refs)}. ${q.why}`);
  });
  out.push("", "### Left out", "", ...leftOutList(firsts.leftOut));
  return out;
}

export function reviewSheet(input: SheetInput): string {
  const { lived, events, ruled, built, went, died, books: bookOrder, firsts } = input;
  const row = (name: string, items: string, pairs: number, b: BandCounts, blocked: number) =>
    `| ${name} | ${items} | ${n(pairs)} | ${n(b.easy)} | ${n(b.medium)} | ${n(b.hard)} | ${n(blocked)} |`;
  return [
    "# What came first? — the owner's review sheet", "",
    "Generated by [build-what-came-first.ts](../../../scripts/build-what-came-first.ts) from the hand-kept files in [src/data/what-came-first/](../../../src/data/what-came-first/); do not edit by hand. Every item and every order fact carries the verse that settles it, checked against the site's own Berean text. To strike a pair, add it to that category's blocked list in its source file and rebuild.", "",
    "## Counts", "", "| Category | Items | Askable pairs | Easy | Medium | Hard | Blocked pairs |", "|---|---|---|---|---|---|---|",
    row("1 Who lived first?", n(lived.people), lived.pairs, lived.perBand, lived.blocked),
    row("2 What happened first?", n(events.pool.items.length), events.pool.orders.length, events.pool.perBand, events.blocked.length),
    row("3 Who ruled first?", n(ruled.pool.items.length), ruled.pool.orders.length, ruled.pool.perBand, ruled.blocked.length),
    row("4 What was built first?", n(built.pool.items.length), built.pool.orders.length, built.pool.perBand, built.blocked.length),
    row("5 Where did they go first?", `${went.pool.items.length} stops in ${went.journeys} journeys`, went.pool.orders.length, went.pool.perBand, went.blocked.length),
    row("6 Who died first?", n(died.pool.items.length), died.pool.orders.length, died.pool.perBand, died.blocked.length),
    row("7 Which comes first in your Bible?", n(bookOrder.pool.items.length), bookOrder.pool.orders.length, bookOrder.pool.perBand, 0),
    `| 8 Bible Firsts | ${firsts.questions.length} questions | — | — | — | — | — |`, "",
    "## 1. Who lived first?", "",
    `Who's older?'s 160 people, their windows, facts and blocked pairs, unchanged: see [its review sheet](../whos-older/review-sheet.md). The build checked that the new game asks exactly the same ${n(lived.pairs)} pairs, each with the same answer, reason and difficulty.`, "",
    ...eventsSection(input), ...rulersSection(input),
    ...handSection("## 4. What was built first?", built, "Deciding verse"),
    ...journeysSection(input),
    ...handSection("## 6. Who died first?", died, "Death verse"),
    "## 7. Which comes first in your Bible?", "", "66 books in the site's order (Genesis to Revelation); nothing to review.", "",
    ...firstsSection(input),
  ].join("\n");
}
