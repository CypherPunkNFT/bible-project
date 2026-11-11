// Blessings for the home against the site's own Berean files, topic index, sibling features and the Tools hub
// (design 9.3: passages, words, tone, the older texts and their checks, print limits, links and the sitemap inventory).
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assemblePassage, CARD_MAX, partLetter, passageReference, passageVerseIds } from "@/pages/life-events/passage";
import { TOOLS } from "@/pages/tools/registry";
import { lifeEventPaths } from "../life-events";
import { occasionPrayerPaths } from "../occasion-prayers";
import { sympathyPaths } from "../sympathy";
import type { SympathyPassage } from "../sympathy/types";
import { whenYourePaths } from "../when-youre";
import {
  BLESSING_PAGES, BLESSINGS_PATH, DEATH_NOTE, DEFINED_PAGES, fitsLayout, GROUPS, homeBlessingPaths, HUB_ORDER, LARGE_CARD, largeCard,
  LAYOUT_LIMITS, OLDER_TEXTS, PAGE_LAYOUTS, pageBySlug, printedLines, storedLines, textCharacters, wordCount, type BlessingItem,
  type OlderId,
} from ".";

interface CatalogBook { num: number; code: string; name: string }
const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as { books: CatalogBook[] };
const books = new Map(catalog.books.map((book) => [book.num, book]));
const siteTopics = (JSON.parse(readFileSync("data/topics/index.json", "utf8")) as { topics: Record<string, { title: string; refs: number }> }).topics;

const held = new Map<string, Record<string, string>>();
function berean(id: number): string | null {
  const code = books.get(Math.floor(id / 1_000_000))!.code;
  if (!held.has(code)) held.set(code, JSON.parse(readFileSync(`data/plain/bsb/${code}.json`, "utf8")) as Record<string, string>);
  const text = held.get(code)![`${Math.floor(id / 1000) % 1000}:${id % 1000}`];
  return text === undefined ? null : text.replace(/^¶\s*/, "").replace(/\s+/g, " ").trim();
}
const bookName = (num: number) => books.get(num)!.name;
const reference = (passage: SympathyPassage) => passageReference(passage, bookName);

const items = BLESSING_PAGES.flatMap((page) => page.items.map((item) => ({ page, item, where: `${page.slug}#${item.id}` })));
const written = items.flatMap(({ page, item, where }) => (item.kind === "written" ? [{ page, item, where }] : []));
const stations = BLESSING_PAGES.flatMap((page) => (page.stations ?? []).map((station) => ({ page, station, where: `${page.slug}#${station.id}` })));

/** Every passage the feature shows: Scripture items, roots, station readings and asides. */
const passages: { passage: SympathyPassage; where: string }[] = [
  ...items.flatMap(({ item, where }) => {
    if (item.kind === "scripture") return [{ passage: item.passage, where }];
    if (item.kind === "written" || item.kind === "fill-in") return item.rootedIn.map((passage) => ({ passage, where: `${where} ${reference(passage)}` }));
    return [];
  }),
  ...stations.flatMap(({ station, where }) => [station.reading, ...station.rootedIn, ...(station.aside ? [station.aside] : [])].map((passage) => ({ passage, where: `${where} ${reference(passage)}` }))),
];

/** The site's own words: written items, station prayers, introductions, how-tos, settings, notes and glosses. */
const ownWords: { text: string; where: string; children: boolean }[] = [
  ...written.map(({ item, where }) => ({ text: item.text, where, children: Boolean(item.forChildren) })),
  ...stations.map(({ station, where }) => ({ text: station.prayer, where, children: false })),
  ...BLESSING_PAGES.map((page) => ({ text: page.intro, where: `${page.slug} intro`, children: false })),
  ...BLESSING_PAGES.filter((page) => page.howTo).map((page) => ({ text: page.howTo!.text, where: `${page.slug} how-to`, children: false })),
  ...items.flatMap(({ item, where }) => (item.kind === "scripture" && item.setting ? [{ text: item.setting, where: `${where} setting`, children: false }] : [])),
  ...passages.flatMap(({ passage, where }) => [{ text: passage.note, where: `${where} note`, children: false }, ...(passage.context ? [{ text: passage.context, where: `${where} context`, children: false }] : [])]),
];

/** Verses commonly misused as promises: never a root. The same eight as the prayers test (occasion-prayers-data.test.ts). */
const NEVER_ROOTS = ["JER 29:11", "ROM 8:28", "PHP 4:13", "MAT 18:20", "DEU 8:18", "3JN 1:2", "MAL 2:16", "PRO 22:6"];
/** The prayers feature's tone list (its design 4.6), matched as whole words. */
const BANNED = [
  "powerful", "breakthrough", "prayer points", "claim", "declare", "decree", "manifest", "I command", "God will heal",
  "you will get", "everything happens for a reason", "more than you can handle", "enough faith", "just pray", "at least",
];
/** Words that frighten a child, never in a child's written prayer (design 4.6). */
const CHILD_BANNED = ["devil", "die", "dying", "death", "dead", "punish", "punishment", "hell"];

const verseId = (ref: string) => {
  const [, code, chapter, verse] = /^(\w+) (\d+):(\d+)$/.exec(ref)!;
  return catalog.books.find((book) => book.code === code)!.num * 1_000_000 + Number(chapter) * 1000 + Number(verse);
};

describe("home blessings: the pages", () => {
  it("has the eight planned pages in hub order and four groups", () => {
    expect(BLESSING_PAGES.map((page) => page.slug)).toEqual(HUB_ORDER);
    expect(DEFINED_PAGES).toHaveLength(8);
    const counts = Object.fromEntries(GROUPS.map((group) => [group.id, BLESSING_PAGES.filter((page) => page.group === group.id).length]));
    expect(counts).toEqual({ house: 2, table: 2, children: 3, scripture: 1 });
    expect(BLESSING_PAGES.filter((page) => page.forChildren).map((page) => page.slug)).toEqual(["graces-for-kids", "bedtime", "blessing-your-children"]);
  });

  it("gives every page a unique URL-safe slug and heading, and a search title of 50 characters or fewer", () => {
    expect(new Set(BLESSING_PAGES.map((page) => page.heading)).size).toBe(8);
    for (const page of BLESSING_PAGES) {
      expect(page.slug).toMatch(/^[a-z]+(?:-[a-z]+)*$/);
      expect(page.searchTitle.length, page.slug).toBeLessThanOrEqual(50);
    }
  });

  it("gives every item a unique URL-safe anchor on its page", () => {
    for (const page of BLESSING_PAGES) {
      const ids = [...page.items.map((item) => item.id), ...(page.stations ?? []).map((station) => station.id)];
      expect(new Set(ids).size, page.slug).toBe(ids.length);
      for (const id of ids) expect(id, page.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("lists the hub and the eight pages in the sitemap inventory, and nothing else", () => {
    expect(homeBlessingPaths()).toEqual([BLESSINGS_PATH, ...HUB_ORDER.map((slug) => `/blessings/${slug}`)]);
  });

  it("has the planned items: Numbers 6 featured on the Scripture page, nine stations, the fill-in card on bedtime", () => {
    const scripturePage = pageBySlug("scripture-blessings")!;
    expect(scripturePage.items).toHaveLength(10);
    expect(scripturePage.items.every((item) => item.kind === "scripture")).toBe(true);
    expect(scripturePage.items[0]).toMatchObject({ id: "numbers-6-24-26" });
    expect(pageBySlug("room-by-room")!.stations).toHaveLength(9);
    expect(BLESSING_PAGES.flatMap((page) => page.items.filter((item) => item.kind === "fill-in").map(() => page.slug))).toEqual(["bedtime"]);
    expect(pageBySlug("house-blessing")!.items[0]).toMatchObject({ kind: "written", id: "front-door" });
  });
});

describe("home blessings: the words", () => {
  it("keeps introductions to 40–90 words, naming the page in the first sentence", () => {
    for (const page of BLESSING_PAGES) {
      expect(wordCount(page.intro), page.slug).toBeGreaterThanOrEqual(40);
      expect(wordCount(page.intro), page.slug).toBeLessThanOrEqual(90);
    }
  });

  it("keeps written items to 25–120 words, a child's prayer to 12–50, ending “amen.”, with 1–6 roots", () => {
    for (const { item, where } of written) {
      const words = wordCount(item.text);
      expect(words, where).toBeGreaterThanOrEqual(item.forChildren ? 12 : 25);
      expect(words, where).toBeLessThanOrEqual(item.forChildren ? 50 : 120);
      expect(item.text, where).toMatch(/amen\.$/i);
      expect(item.rootedIn.length, where).toBeGreaterThanOrEqual(1);
      expect(item.rootedIn.length, where).toBeLessThanOrEqual(6);
      expect(item.rootedIn.every((passage) => passage.role === "card"), where).toBe(true);
    }
  });

  it("keeps every station prayer to 25–50 words, said before the shared “Amen.”", () => {
    for (const { station, where } of stations) {
      expect(wordCount(station.prayer), where).toBeGreaterThanOrEqual(25);
      expect(wordCount(station.prayer), where).toBeLessThanOrEqual(50);
      expect(station.prayer, where).not.toMatch(/amen/i);
      expect(station.rootedIn.length, where).toBeGreaterThanOrEqual(1);
    }
  });

  it("keeps every older text on a children's page to 50 words (Duncan's two verses, 51, as the design plans)", () => {
    for (const { page, item, where } of items) {
      if (page.forChildren && item.kind === "older") expect(wordCount(OLDER_TEXTS[item.id].lines.join(" ")), where).toBeLessThanOrEqual(item.id === "duncan-shepherd" ? 51 : 50);
    }
  });

  it("puts [name] in every item for someone and no other, never at the start of a sentence", () => {
    for (const { item, where } of written) {
      expect(item.text.includes("[name]"), where).toBe(Boolean(item.forSomeone));
      expect(item.text, where).not.toMatch(/(^|[.?!:;]\s+|[“"]\s*|\n)\[name\]/);
    }
    for (const { text, where } of ownWords.filter((entry) => !entry.where.match(/#[a-z-]+$/))) expect(text.includes("[name]"), where).toBe(false);
  });

  it("uses no words of technique, false promise or pressure, no “thee”, and no exclamation marks, in its own words", () => {
    for (const { text, where } of ownWords) {
      for (const phrase of BANNED) expect(new RegExp(`\\b${phrase.replace(/ /g, "\\s+")}\\b`, "i").test(text), `${where}: “${phrase}”`).toBe(false);
      expect(text.includes("!"), `${where}: exclamation mark`).toBe(false);
      expect(/\b(thee|thou|thy|thine)\b/i.test(text), `${where}: old pronoun`).toBe(false);
    }
  });

  it("keeps frightening words out of every child's written prayer", () => {
    for (const { text, where } of ownWords.filter((entry) => entry.children)) {
      for (const word of CHILD_BANNED) expect(new RegExp(`\\b${word}\\b`, "i").test(text), `${where}: “${word}”`).toBe(false);
    }
  });

  it("addresses no saint, Mary or angel", () => {
    for (const { text, where } of [...written.map(({ item, where }) => ({ text: item.text, where })), ...stations.map(({ station, where }) => ({ text: station.prayer, where }))]) {
      for (const sentence of text.split(/(?<=[.?:;\n])\s*/)) expect(sentence, where).not.toMatch(/^(Saint|St\.?|Mary|Holy Mother|angels?)\b/i);
    }
  });
});

describe("home blessings: the verses", () => {
  it("uses only verses the Berean has, in ranges that run forward inside one chapter", () => {
    for (const { passage, where } of passages) {
      if (passage.to !== undefined) expect(Math.floor(passage.to / 1000), where).toBe(Math.floor(passage.from / 1000));
      for (const id of passageVerseIds(passage)) expect(berean(id), `${where} verse ${id}`).toBeTruthy();
    }
  });

  it("stores every excerpt exactly, on the last verse, marked a or b by where it sits", () => {
    const partial = passages.filter(({ passage }) => passage.part);
    expect(partial.length).toBeGreaterThanOrEqual(3);
    for (const { passage, where } of partial) {
      const verse = berean(passage.part!.verse)!;
      expect(verse.includes(passage.part!.text), where).toBe(true);
      expect(partLetter(passage, verse), where).toBe(passage.part!.mark);
    }
  });

  it("keeps every Scripture item and root within the 320-character card limit", () => {
    for (const { passage, where } of passages) expect(assemblePassage(passage, berean).length, where).toBeLessThanOrEqual(CARD_MAX);
  });

  it("never uses the eight verses so often misused as promises", () => {
    for (const { passage, where } of passages) {
      const ids = passageVerseIds(passage);
      for (const ref of NEVER_ROOTS) expect(ids.includes(verseId(ref)), `${where} uses ${ref}`).toBe(false);
    }
  });

  it("carries its context note wherever Psalm 121, Deuteronomy 28:6, Isaiah 32:18, Zephaniah 3:17 or Hebrews 13:2 appears", () => {
    const noted: Record<string, RegExp> = {
      "PSA 121": /not a guarantee that no harm will come/,
      "DEU 28:6": /not a promise to every family/,
      "ISA 32:18": /not a promise that no trouble will come/,
      "ZEP 3:17": /restored people, Jerusalem/,
      "HEB 13:2": /not a promise that our guests are angels/,
    };
    const ids: Record<string, (passage: SympathyPassage) => boolean> = {
      "PSA 121": (passage) => Math.floor(passage.from / 1000) === 19121,
      "DEU 28:6": (passage) => passageVerseIds(passage).includes(verseId("DEU 28:6")),
      "ISA 32:18": (passage) => passageVerseIds(passage).includes(verseId("ISA 32:18")),
      "ZEP 3:17": (passage) => passageVerseIds(passage).includes(verseId("ZEP 3:17")),
      "HEB 13:2": (passage) => passageVerseIds(passage).includes(verseId("HEB 13:2")),
    };
    for (const [name, matches] of Object.entries(ids)) {
      const found = passages.filter(({ passage }) => matches(passage));
      expect(found.length, name).toBeGreaterThan(0);
      for (const { passage, where } of found) expect(passage.context, `${where} (${name})`).toMatch(noted[name]);
    }
  });

  it("shows Numbers 6:24–26 whole wherever it appears", () => {
    const numbers = passages.filter(({ passage }) => passage.from === 4006024);
    expect(numbers.length).toBeGreaterThanOrEqual(3);
    for (const { passage, where } of numbers) expect([passage.to, passage.part], where).toEqual([4006026, undefined]);
  });
});

/** sha256 of each older text's lines joined by "\n", so an accidental "modernising" edit fails (design 4.3). */
const CHECKSUMS: Record<OlderId, string> = {
  "guiterman-house": "8b289b53a5d924f067d377f60a069d5652aa42a42f225a1cfba9debb5c8e4c26",
  "come-lord-jesus": "555b8320ae6507a3fd9a7b857f22d95fa62cd0828cbbe12dc516356d48204efb",
  "cennick-table": "5cf9cfe0c2dfcdfdcd8a863b633e99e75d43f12a0f3e3abbeb89c2b8c0858e8e",
  "cennick-blood": "34ce3a61f1410322278b5ae4d837c299da92b2e1f495ab85e6471882c0e64d6b",
  "god-is-great": "b79bcb8e368ec33767abbe56e73263d67b9d293f221a33aa01a9226a38a39937",
  "leatham-world": "7d70b9745efe7a45712d4fdfd37eaa1b6e94bb1c146bde1fbf307beb38e9705d",
  selkirk: "a7f597e0819f617ed7d12f8b30233ea91425ad9426293432a23b7a5ebdd96cfc",
  doxology: "ad278206b937e34f36f00ff6651b039a28cb67820b65d4e716d05b43668c5f1a",
  "ken-evening": "db98bb5d72b3c6033d81bd0337258105e390b784dcf6210014b13eae7f436796",
  "duncan-shepherd": "36dbc2e19628593e45d7a4532e8b35ad8bf35c88b2e65b70a1021b1daa8e33d8",
  "wesley-gentle": "213da4f3ccb933ae9df421646fbcca7d88162e72a8140099e112ef92212bcd03",
  "watts-evening": "47320f9849accb81bf2d0b99db5daac40ad1dab0794ebe9c735c86ecf1935fc7",
  "now-i-lay-me": "b1e5cfe6a9dfbf0de216583daeae6cfd4009f32f38a0abac701dadd708ae857f",
};

const usedOlder = new Set(items.flatMap(({ item }) => (item.kind === "older" ? [item.id] : [])));

describe("home blessings: the older texts", () => {
  it("holds every text shown to its checksum", () => {
    for (const id of usedOlder) {
      const text = OLDER_TEXTS[id];
      expect(createHash("sha256").update(text.lines.join("\n")).digest("hex"), id).toBe(CHECKSUMS[id]);
    }
  });

  it("names for every text shown an author, a year, a source and a dated check against a printing before 1931", () => {
    for (const id of usedOlder) {
      const text = OLDER_TEXTS[id];
      expect(text.author, id).toBeTruthy();
      expect(text.year, id).toBeTruthy();
      expect(text.source, id).toBeTruthy();
      expect(text.checkedAgainst, id).toMatch(/https?:\/\//);
      expect(text.checkedAgainst, id).toMatch(/2026-11-1\d/);
      const years = [...text.checkedAgainst.matchAll(/\b(1[5-9]\d\d)\b/g)].map((match) => Number(match[1]));
      expect(years.some((year) => year < 1931), `${id}: the printing checked must be dated before 1931`).toBe(true);
    }
  });

  it("shows the death-line note wherever “Now I lay me down to sleep” or Duncan's third verse appears", () => {
    expect(OLDER_TEXTS["now-i-lay-me"].note).toBe(DEATH_NOTE);
    expect(OLDER_TEXTS["duncan-shepherd"].extraLines?.lines.join(" ")).toMatch(/when I die/);
  });

  it("uses no text from the 1662 Book of Common Prayer, so the prayers feature's 500-word allowance is untouched", () => {
    const all = [...Object.values(OLDER_TEXTS).map((text) => `${text.source} ${text.checkedAgainst}`), ...ownWords.map((entry) => entry.text)].join(" ");
    expect(all, "a Book of Common Prayer text belongs to the prayers feature, which counts its 500-word allowance").not.toMatch(/Common Prayer|1662|Peace be to this house/i);
  });
});

describe("home blessings: print limits", () => {
  it("counts printed lines as the design does (Duncan's two verses: 11 lines at 34, 13 at 32)", () => {
    const duncan = OLDER_TEXTS["duncan-shepherd"].lines;
    expect(printedLines(duncan, 34)).toBe(11);
    expect(printedLines(duncan, 32)).toBe(13);
    expect(printedLines(["one two", "", "three"], 5)).toBe(4);
  });

  it("offers each item only the layouts its page offers and its length fits", () => {
    for (const { page, item, where } of items) {
      for (const layout of item.layouts) expect(PAGE_LAYOUTS[page.slug], `${where} ${layout}`).toContain(layout);
      if (item.kind === "fill-in") { expect(item.layouts.every((layout) => layout === "cards" || layout === "colouring"), where).toBe(true); continue; }
      const lines = storedLines(item) ?? [assemblePassage((item as Extract<BlessingItem, { kind: "scripture" }>).passage, berean)];
      for (const layout of item.layouts) {
        expect(layout, where).not.toBe("order");
        if (layout === "order") continue;
        const limit = LAYOUT_LIMITS[layout];
        expect(fitsLayout(lines, layout), `${where} on ${layout}: ${wordCount(lines.join(" "))} words, ${textCharacters(lines)} characters, ${printedLines(lines, limit.perLine)} lines at ${limit.perLine}`).toBe(true);
      }
    }
  });

  it("keeps the room-by-room order the only flowing layout", () => {
    for (const { page } of items) if (page.slug !== "room-by-room") expect(PAGE_LAYOUTS[page.slug]).not.toContain("order");
    expect(PAGE_LAYOUTS["room-by-room"]).toEqual(["order"]);
  });

  it("chooses the 18 pt card exactly when an item fits 8 lines at 26 characters", () => {
    expect(LARGE_CARD).toEqual({ lines: 8, perLine: 26 });
    expect(largeCard(OLDER_TEXTS["wesley-gentle"].lines)).toBe(true);
    expect(largeCard(OLDER_TEXTS.selkirk.lines)).toBe(true);
    expect(largeCard(OLDER_TEXTS["duncan-shepherd"].lines)).toBe(false);
    const grace = written.find(({ item }) => item.id === "food-to-eat")!.item;
    expect(printedLines(grace.text.split("\n"), 26)).toBe(7);
  });

  it("keeps the Lord's Prayer off children's cards: on screen and as a wall print only", () => {
    const lords = items.find(({ item }) => item.id === "matthew-6-9-13")!;
    expect(lords.item.layouts).toEqual(["wall"]);
  });
});

describe("home blessings: links", () => {
  const routes = new Set([...whenYourePaths(), ...lifeEventPaths(), ...sympathyPaths(), ...occasionPrayerPaths(), "/study/the-good-news"]);

  it("links two or three site topics that exist with references, under their own titles", () => {
    for (const page of BLESSING_PAGES) {
      expect(page.topics.length, page.slug).toBeGreaterThanOrEqual(2);
      expect(page.topics.length, page.slug).toBeLessThanOrEqual(3);
      for (const topic of page.topics) {
        expect(siteTopics[topic.slug]?.refs, `${page.slug} -> ${topic.slug}`).toBeGreaterThan(0);
        expect(siteTopics[topic.slug].title, `${page.slug} -> ${topic.slug}`).toBe(topic.title);
      }
    }
  });

  it("links real sibling pages, never itself, and only real pages of the sibling features", () => {
    for (const page of BLESSING_PAGES) {
      expect(page.related.length, page.slug).toBeGreaterThanOrEqual(2);
      for (const slug of page.related) {
        expect(pageBySlug(slug), `${page.slug} -> ${slug}`).toBeDefined();
        expect(slug).not.toBe(page.slug);
      }
      for (const link of page.elsewhere ?? []) expect(routes.has(link.href), `${page.slug} -> ${link.href}`).toBe(true);
    }
    expect(pageBySlug("house-blessing")!.elsewhere!.map((link) => link.href)).toContain("/prayers/new-home");
    expect(pageBySlug("holiday-meals")!.elsewhere!.map((link) => link.href)).toEqual(["/sympathy", "/when-youre/grieving"]);
  });

  it("is live on the Tools hub at /blessings", () => {
    expect(TOOLS.find((tool) => tool.slug === "home-blessings")).toMatchObject({ status: "live", path: "/blessings" });
  });
});
