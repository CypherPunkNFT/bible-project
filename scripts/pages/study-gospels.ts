// CONTENT for Jesus & the Gospels (/study/gospels, with the Gospel harmony; /study/harmony redirects to it):
// four Gospel portraits, teaching journeys, where he speaks, and Robertson's harmony of 185 events.
import { TEACHINGS } from "../../src/data/chart-insights";
import { GOSPEL_PORTRAITS, PORTRAIT_GOSPELS } from "../../src/data/gospel-portraits";
import { splitId } from "../../src/lib/refs";
import type { HarmonySection } from "../../src/lib/study";
import type { Stats } from "../../src/lib/types";
import { chartArea, panelHead } from "./study-charts";
import { blocks, loadCatalog, n, readJson, refs, table, type Span } from "./study-lib";
import { byTag, findAll, jsxRoots, wording } from "./study-source";
import type { PageContent } from "./types";

interface Harmony { parts: { n: number; title: string; sections: HarmonySection[] }[] }
const GOSPELS = [["MAT", "Matthew"], ["MRK", "Mark"], ["LUK", "Luke"], ["JHN", "John"]] as const;

/** "6:30–44" inside a Gospel's own column, as the harmony prints it. */
function shortRange([start, end]: Span): string {
  const a = splitId(start), b = splitId(end);
  if (start === end) return `${a.chapter}:${a.verse}`;
  return a.chapter === b.chapter ? `${a.chapter}:${a.verse}–${b.verse}` : `${a.chapter}:${a.verse}–${b.chapter}:${b.verse}`;
}
const column = (spans: Span[] | undefined) => (spans ?? []).map(shortRange).join(", ") || "—";

async function portraits(harmony: Harmony): Promise<string> {
  const catalog = await loadCatalog();
  const events = new Map(harmony.parts.flatMap((part) => part.sections).map((section) => [section.n, section]));
  const withGospel = [...events.values()].filter((event) => GOSPELS.some(([key]) => event.refs[key]));
  const inAll = withGospel.filter((event) => GOSPELS.every(([key]) => event.refs[key])).length;
  const inOne = withGospel.filter((event) => GOSPELS.filter(([key]) => event.refs[key]).length === 1).length;
  const guides = GOSPEL_PORTRAITS.map((guide, i) => {
    const event = events.get(guide.event);
    const lines = PORTRAIT_GOSPELS.map((gospel) => {
      const spans = event?.refs[gospel.key];
      const notice = guide.observations[gospel.key];
      return `  - ${gospel.name}: ${spans ? refs(catalog, spans) : "no passage in this harmony entry"}${notice ? ` · *Notice:* ${notice}` : ""}`;
    });
    return `${i + 1}. **${guide.title}** (harmony §${guide.event}, "${event?.title ?? "missing event"}"): *${guide.question}* ${guide.invitation}\n${lines.join("\n")}`;
  });
  return blocks(`Eight guided comparisons (buttons), the map "Where it falls in each Gospel" (four lines, each a whole Gospel scaled by KJV verses), then "Read the accounts in their setting" with each Gospel's passages, a *Notice* note and the entries before and after it in that Gospel's order.`,
    guides.join("\n"),
    `"Keep exploring": search and pick any of **${withGospel.length} Gospel entries** (filters: All accounts ${withGospel.length} · In all four ${inAll} · In one Gospel ${inOne}); a non-guided entry shows its harmony title and a standard invitation.`,
    `*Interface wording (GospelPortraits.tsx):* ${(await wording("src/components/study/GospelPortraits.tsx")).join(" · ")}`);
}

async function teachings(): Promise<string> {
  const catalog = await loadCatalog();
  const roots = await jsxRoots("src/components/charts/WordsOfJesus.tsx", "TeachingJourneys");
  const rows = TEACHINGS.map((t, i) => `${i + 1}. **${t.theme}: ${t.title}** ${t.invitation} Passages: ${refs(catalog, t.refs)}. *Look closer:* ${t.notice}`);
  return blocks(rows.join("\n"), `Under the passages: "${findAll(roots, byTag("p")).at(-1)?.text}" and the link "${findAll(roots, byTag("Link")).at(-1)?.text}".`);
}

async function speech(stats: Stats): Promise<string> {
  const withRed = stats.books.filter((book) => book.red > 0);
  const gospels = stats.books.filter((book) => GOSPELS.some(([key]) => key === book.code));
  const chapters = gospels.flatMap((book) => book.chapters.map(([, words, red], i) => ({ book, chapter: i + 1, words, red })));
  const ranked = chapters.filter((c) => c.red > 0).sort((a, b) => b.red - a.red).slice(0, 5);
  const roots = await jsxRoots("src/components/charts/WordsOfJesus.tsx", "SpeechAtlas");
  return blocks(`Figure: **${n(withRed.reduce((sum, book) => sum + book.red, 0))} words in red across ${withRed.length} books** (whole KJV). ${findAll(roots, byTag("p"))[0]?.text ?? ""}`,
    "Buttons: All four · Matthew · Mark · Luke · John; Share of chapter · Number of words. One numbered bar per chapter, each opening the reader.",
    table(["Gospel", "Words in red", "Share of the book", "Chapters"], gospels.map((book) => [book.name, n(book.red), `${Math.round((book.red / book.words) * 100)}%`, book.chapters.length])),
    `"Linger in a longer teaching" (all four): ${ranked.map((c) => `${c.book.name} ${c.chapter} (${n(c.red)} words)`).join(" · ")}.`,
    `"Beyond the four Gospels": ${withRed.filter((book) => !gospels.includes(book)).map((book) => `${book.name} (${n(book.red)} words)`).join(" · ")}.`,
    `*Interface wording (SpeechAtlas):* ${(await wording("src/components/charts/WordsOfJesus.tsx", "SpeechAtlas")).join(" · ")}`);
}

async function harmonyTable(harmony: Harmony): Promise<string> {
  const catalog = await loadCatalog();
  const events = harmony.parts.flatMap((part) => part.sections);
  const told = GOSPELS.map(([key, name]) => `${name} in ${events.filter((event) => event.refs[key]).length}`).join(", ");
  const source = await jsxRoots("src/pages/study/HarmonyPage.tsx", "HarmonySource");
  const parts = harmony.parts.map((part) => {
    const rows = part.sections.map((event) => [`§${event.n}`, event.title, ...GOSPELS.map(([key]) => column(event.refs[key])), refs(catalog, event.refs.also)]);
    const items = part.sections.filter((event) => event.items.length).map((event) => `Within §${event.n}:\n${event.items.map((item) => `- ${item.title}${item.refs ? ` (${GOSPELS.filter(([key]) => item.refs?.[key]).map(([key, name]) => `${name} ${column(item.refs?.[key])}`).join("; ")})` : ""}`).join("\n")}`);
    return blocks(`### Part ${part.n}: ${part.title} (${part.sections.length} ${part.sections.length === 1 ? "event" : "events"})`, table(["§", "Event", "Matthew", "Mark", "Luke", "John", "Also"], rows), ...items);
  });
  return blocks(`The source note beside the introduction: ${source[0].text}`,
    `${harmony.parts.length} parts, ${events.length} events (${told}). Above the rows: a coverage strip (one column per event, four rows; dark green where all four Gospels tell it, light green where three do), a search box ("Find an event, e.g. lepers"), "Told in" Gospel filters with an "exactly these" option. Opening an event shows the Gospel passages side by side, and "Within this event" for its sub-headings.`,
    ...parts, `*Interface wording (HarmonyPage.tsx):* ${(await wording("src/pages/study/HarmonyPage.tsx")).join(" · ")}`);
}

export async function gospelsPage(): Promise<PageContent> {
  const [{ header, panels }, harmony, stats] = await Promise.all([chartArea("words", "gospels"), readJson<Harmony>("data/study/harmony.json"), readJson<Stats>("data/stats.json")]);
  return { dir: "Study/jesus-and-the-gospels", title: "Jesus & the Gospels", markdown: blocks(header,
    "The old address /study/harmony (and /study/harmony#event-N from the Miracles page) opens this page on the Gospel harmony.",
    panelHead(panels, "gospels", "portraits"), await portraits(harmony),
    panelHead(panels, "gospels", "jesus"), await teachings(),
    panelHead(panels, "gospels", "speech"), await speech(stats),
    panelHead(panels, "gospels", "harmony"), await harmonyTable(harmony)) };
}
