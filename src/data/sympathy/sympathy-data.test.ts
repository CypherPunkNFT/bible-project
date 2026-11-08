// The sympathy sets against the site's own Berean files, topic index and hymn collection (design 7.4: data checks, tone
// checks, passage keys and the sitemap inventory).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assemblePassage, CARD_MAX, partLetter, passageReference, passageVerseIds } from "@/pages/life-events/passage";
import {
  FUNERAL_HYMNS, FUNERAL_INTRO, FUNERAL_READINGS, funeralReadingByKey, HUB_SET, KEEP_SHOWING_UP, KEPT_KEYS, KEY_ALIASES, keyedPassages,
  LEAVE_OUT, LINES_TO_USE, LOSS_SETS, PARTICULAR_FAITH_NOTE, PARTICULAR_LIVES, passageByKey, passageKey, SERVICE_PARTS, sympathyPaths,
  type SympathyPassage, type SympathySet,
} from ".";
import { p } from "../life-events/types";

interface CatalogBook { num: number; code: string; name: string }
const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as { books: CatalogBook[] };
const books = new Map(catalog.books.map((book) => [book.num, book]));
const topics = (JSON.parse(readFileSync("data/topics/index.json", "utf8")) as { topics: Record<string, { title: string }> }).topics;
const hymnIds = new Set((JSON.parse(readFileSync("data/hymns/collection.json", "utf8")) as { hymns: { id: string }[] }).hymns.map((hymn) => hymn.id));

const held = new Map<string, Record<string, string>>();
/** A verse's Berean words as the site shows them (verses.ts: no paragraph sign, whitespace collapsed), or null. */
function berean(id: number): string | null {
  const code = books.get(Math.floor(id / 1_000_000))!.code;
  if (!held.has(code)) held.set(code, JSON.parse(readFileSync(`data/plain/bsb/${code}.json`, "utf8")) as Record<string, string>);
  const text = held.get(code)![`${Math.floor(id / 1000) % 1000}:${id % 1000}`];
  return text === undefined ? null : text.replace(/^¶\s*/, "").replace(/\s+/g, " ").trim();
}
const bookName = (num: number) => books.get(num)!.name;
const SETS: SympathySet[] = [HUB_SET, ...LOSS_SETS];
const inSets = SETS.flatMap((set) => set.passages.map((passage) => ({ passage, where: `${set.slug || "hub"} ${passageReference(passage, bookName)}` })));
const inFuneral = FUNERAL_READINGS.map((passage) => ({ passage, where: `funeral ${passageReference(passage, bookName)}` }));
const all = [...inSets, ...inFuneral];
const labelled = (passage: SympathyPassage) => Boolean(passage.believer || passage.later);

describe("sympathy: the passages", () => {
  it("holds the hub's set, twelve loss pages and 47 funeral readings, as planned", () => {
    expect(LOSS_SETS).toHaveLength(12);
    expect(inSets).toHaveLength(160);
    expect(FUNERAL_READINGS).toHaveLength(47);
  });

  it("uses only verses the Berean has, in ranges that run forward inside one chapter", () => {
    for (const { passage, where } of all) {
      if (passage.to !== undefined) expect(passage.to, where).toBeGreaterThan(passage.from);
      for (const id of passageVerseIds(passage)) expect(berean(id), `${where} verse ${id}`).toBeTruthy();
    }
  });

  it("stores every excerpt exactly, on a single verse, marked a or b by where it sits", () => {
    const partial = all.filter(({ passage }) => passage.part);
    expect(partial.length).toBeGreaterThanOrEqual(11);
    for (const { passage, where } of partial) {
      expect(passage.to, `${where}: an excerpt sits only on a single verse`).toBeUndefined();
      const verse = berean(passage.part!.verse)!;
      expect(verse.includes(passage.part!.text), where).toBe(true);
      expect(partLetter(passage, verse), where).toBe(passage.part!.mark);
    }
  });

  it("assembles every passage with paired double quotation marks and a proper sentence end", () => {
    for (const { passage, where } of all) {
      const text = assemblePassage(passage, berean);
      expect(text.split("“").length, `${where}: ${text}`).toBe(text.split("”").length);
      expect(text.replace(/[”’"']+$/, ""), where).toMatch(/[.!?…]$/);
    }
  });

  it("keeps 9–16 passages per set, at least six card verses, each card verse 320 characters or fewer", () => {
    for (const set of SETS) {
      expect(set.passages.length, set.slug).toBeGreaterThanOrEqual(9);
      expect(set.passages.length, set.slug).toBeLessThanOrEqual(16);
      expect(set.passages.filter((item) => item.role === "card").length, set.slug).toBeGreaterThanOrEqual(6);
    }
    for (const { passage, where } of inSets) if (passage.role === "card") expect(assemblePassage(passage, berean).length, where).toBeLessThanOrEqual(CARD_MAX);
  });

  it("gives every set a default card verse that carries neither label", () => {
    for (const set of SETS) {
      const first = set.passages.find((item) => item.role === "card")!;
      expect(labelled(first), set.slug).toBe(false);
    }
  });

  it("puts no labelled card verse on the suicide and faith-unknown pages", () => {
    for (const slug of ["loss-to-suicide", "faith-unknown"]) {
      const set = LOSS_SETS.find((item) => item.slug === slug)!;
      expect(set.passages.filter((item) => item.role === "card" && labelled(item)), slug).toEqual([]);
    }
  });

  it("never offers Romans 8:28, Job 1:21, Jeremiah 29:11, Isaiah 57:1–2 or 1 Corinthians 10:13 as a card verse", () => {
    const kept = [p("ROM 8:28", "card", "x"), p("JOB 1:21", "card", "x"), p("JER 29:11", "card", "x"), p("ISA 57:1", "card", "x"), p("ISA 57:2", "card", "x"), p("1CO 10:13", "card", "x")];
    const keptIds = new Set(kept.map((item) => item.from));
    for (const { passage, where } of inSets) {
      if (passage.role !== "card") continue;
      for (const id of passageVerseIds(passage)) expect(keptIds.has(id), where).toBe(false);
    }
  });

  it("gives every passage a one-line note, and every funeral reading a part of the service", () => {
    for (const { passage, where } of all) {
      expect(passage.note.length, where).toBeGreaterThan(10);
      expect(passage.note.length, where).toBeLessThanOrEqual(160);
    }
    const parts = new Set(SERVICE_PARTS.map((part) => part.id));
    for (const { passage, where } of inFuneral) expect(parts.has(passage.servicePart!), where).toBe(true);
    for (const { passage, where } of inSets) expect(passage.servicePart, where).toBeUndefined();
  });
});

describe("sympathy: the pages' words", () => {
  it("has unique, address-safe slugs, real siblings and topic pages, and card defaults within limits", () => {
    const slugs = LOSS_SETS.map((set) => set.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const set of SETS) {
      if (set.slug) expect(set.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      for (const related of set.related) {
        expect(slugs, `${set.slug} -> ${related}`).toContain(related);
        expect(related).not.toBe(set.slug);
      }
      expect(set.topics.length, set.slug).toBeGreaterThan(0);
      for (const topic of set.topics) expect(topics[topic.slug]?.title, `${set.slug} topic ${topic.slug}`).toBe(topic.title);
      expect(set.card.heading.length, set.slug).toBeLessThanOrEqual(50);
      expect(set.heading.length, set.slug).toBeLessThanOrEqual(60);
    }
  });

  it("gives every set a 60–160 word introduction whose first sentence names the loss", () => {
    for (const set of [...SETS, { slug: "funeral", intro: FUNERAL_INTRO, short: "funeral" }]) {
      const words = set.intro.trim().split(/\s+/).length;
      expect(words, set.slug).toBeGreaterThanOrEqual(60);
      expect(words, set.slug).toBeLessThanOrEqual(160);
      const first = set.intro.split(/(?<=\.)\s/)[0].toLowerCase();
      if (set.slug) expect(first, set.slug).toContain(set.short.toLowerCase().split(" ").at(-1));
    }
  });

  it("has the four explainers, and the help strip on the suicide page only", () => {
    expect(SETS.filter((set) => set.explainer).map((set) => set.slug).sort()).toEqual(["faith-unknown", "loss-of-baby", "loss-of-pet", "loss-to-suicide"]);
    expect(SETS.filter((set) => set.helpStrip).map((set) => set.slug)).toEqual(["loss-to-suicide"]);
  });

  it("links real hymns, and readings for a particular life to real pages or readings", () => {
    for (const hymn of FUNERAL_HYMNS) expect(hymnIds.has(hymn.id), hymn.id).toBe(true);
    const slugs = new Set(LOSS_SETS.map((set) => set.slug));
    const readingKeys = new Set(FUNERAL_READINGS.map(passageKey));
    for (const item of PARTICULAR_LIVES.flatMap((group) => group.items)) {
      if (item.href.startsWith("#reading-")) expect(readingKeys.has(item.href.slice("#reading-".length)), item.href).toBe(true);
      else expect(slugs.has(item.href.replace("/sympathy/", "")), item.href).toBe(true);
      expect(() => p(item.reference, "reading", "x")).not.toThrow();
    }
  });

  /** Every string the site writes in its own voice on these pages (Scripture is never stored here). */
  function siteWords(): { text: string; where: string }[] {
    const words: { text: string; where: string }[] = [];
    for (const set of SETS) {
      const where = set.slug || "hub";
      words.push({ text: set.heading, where }, { text: set.intro, where }, { text: set.card.heading, where }, { text: set.card.inside, where });
      if (set.explainer) words.push({ text: set.explainer.title, where }, ...set.explainer.paragraphs.map((text) => ({ text, where })));
      for (const passage of set.passages) {
        words.push({ text: passage.note, where });
        if (passage.context) words.push({ text: passage.context, where });
        if (passage.hint) words.push({ text: passage.hint, where });
      }
    }
    for (const passage of FUNERAL_READINGS) words.push({ text: passage.note, where: "funeral" }, ...(passage.context ? [{ text: passage.context, where: "funeral" }] : []));
    words.push({ text: FUNERAL_INTRO, where: "funeral" }, { text: PARTICULAR_FAITH_NOTE, where: "funeral" }, { text: KEEP_SHOWING_UP, where: "hub" });
    words.push(...LINES_TO_USE.map((text) => ({ text, where: "lines" })));
    return words;
  }

  it("keeps the tone rules: no \"committed suicide\", no exclamation marks, no \"at least\", no angels", () => {
    const words = siteWords();
    expect(words.length).toBeGreaterThan(250);
    for (const { text, where } of words) {
      expect(text, where).not.toMatch(/committed suicide|commit suicide/i);
      expect(text.replace(/"[^"]*"/g, ""), where).not.toContain("!");
      expect(text, where).not.toMatch(/\bat least\b/i);
      expect(text, where).not.toMatch(/angel/i);
    }
  });

  it("speaks of angels and \"at least\" only in the guide to what to leave out", () => {
    const guide = LEAVE_OUT.map((item) => `${item.saying} ${item.why}`).join(" ");
    expect(guide).toMatch(/angel/);
    expect(guide).toMatch(/At least/);
    for (const item of LEAVE_OUT) expect(`${item.saying} ${item.why}`).not.toMatch(/committed suicide/i);
  });
});

describe("sympathy: passage keys", () => {
  it("gives each key exactly one passage, computed from the verse ids alone", () => {
    const seen = new Map<string, string>();
    for (const { passage, where } of all) {
      const key = passageKey(passage);
      expect(key, where).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*[ab]?$/);
      const shape = JSON.stringify([passage.from, passage.to ?? null, passage.part ?? null]);
      expect(seen.get(key) ?? shape, `${where} (${key})`).toBe(shape);
      seen.set(key, shape);
    }
    expect(passageKey(p("PSA 34:18", "card", "x"))).toBe("psalm-34-18");
    expect(passageKey(p("2CO 1:3-4", "card", "x"))).toBe("2-corinthians-1-3-4");
    expect(passageKey(p("SNG 8:7a", "card", "x", { part: "Mighty" }))).toBe("song-of-songs-8-7a");
  });

  it("gives every card verse and funeral reading a key, and keeps every key ever handed out", () => {
    const now = new Set(keyedPassages().map(passageKey));
    for (const key of now) expect(KEPT_KEYS, `${key} is new: add it to KEPT_KEYS`).toContain(key);
    for (const key of KEPT_KEYS) expect(passageByKey(key) ?? passageByKey(KEY_ALIASES[key]), `${key} no longer resolves`).toBeTruthy();
    for (const [retired, replacement] of Object.entries(KEY_ALIASES)) expect(now.has(replacement), `${retired} -> ${replacement}`).toBe(true);
  });

  it("reads a key as a chat app may have changed it, and lets only readings join a funeral list", () => {
    expect(passageByKey("Psalm-34-18.")?.from).toBe(19034018);
    expect(passageByKey(" john-11-25b)")?.part?.mark).toBe("b");
    expect(passageByKey("psalm-999-1")).toBeUndefined();
    expect(funeralReadingByKey("psalm-23-1-6")?.servicePart).toBe("old-testament");
    expect(funeralReadingByKey("psalm-34-18")).toBeUndefined();
  });
});

describe("sympathy: the search inventory", () => {
  it("lists the hub, the twelve loss pages and the readings page, and no card page", () => {
    const paths = sympathyPaths();
    expect(paths).toEqual(["/sympathy", ...LOSS_SETS.map((set) => `/sympathy/${set.slug}`), "/sympathy/funeral-readings"]);
    expect(new Set(paths).size).toBe(14);
    for (const path of paths) expect(path).not.toContain("/sympathy/card");
  });
});
