// The countdowns' written content against the site's own Berean files and the writing rules (design 4.1, 4.5, 8.3 "Data").
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assemblePassage, CARD_FULL, passageReference, passageVerseIds } from "@/pages/life-events/passage";
import { ADVENT_DAYS, ADVENT_PANELS } from "./advent";
import { LENT_DAYS_1 } from "./lent-1";
import { LENT_DAYS_2 } from "./lent-2";
import type { CountdownDay, LifeEventPassage } from "./types";

interface CatalogBook { num: number; code: string; name: string }
const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as { books: CatalogBook[] };
const books = new Map(catalog.books.map((book) => [book.num, book]));
const hymnIds = new Set((JSON.parse(readFileSync("data/hymns/collection.json", "utf8")) as { hymns: { id: string }[] }).hymns.map((hymn) => hymn.id));

const held = new Map<string, Record<string, string>>();
const bookFile = (code: string) => {
  if (!held.has(code)) held.set(code, JSON.parse(readFileSync(`data/plain/bsb/${code}.json`, "utf8")) as Record<string, string>);
  return held.get(code)!;
};
const clean = (text: string) => text.replace(/^¶\s*/, "").replace(/\s+/g, " ").trim();
/** A verse's Berean words as the site shows them, or null. */
function berean(id: number): string | null {
  const text = bookFile(books.get(Math.floor(id / 1_000_000))!.code)[`${Math.floor(id / 1000) % 1000}:${id % 1000}`];
  return text === undefined ? null : clean(text);
}
const bookName = (num: number) => books.get(num)!.name;

/** Every chapter of the Berean as one run of text, for finding a quotation wherever it comes from. */
let chapters: string[] | null = null;
function allChapters(): string[] {
  if (chapters) return chapters;
  const found = new Map<string, string[]>();
  for (const book of catalog.books.filter((entry) => entry.num <= 66)) {
    for (const [reference, text] of Object.entries(bookFile(book.code))) {
      const key = `${book.code} ${reference.split(":")[0]}`;
      if (!found.has(key)) found.set(key, []);
      found.get(key)!.push(clean(text));
    }
  }
  chapters = [...found.values()].map((verses) => flat(verses.join(" ")));
  return chapters;
}
/** Quotation marks and case set aside, so a quotation cut from inside a verse still matches it. */
const flat = (text: string) => text.toLowerCase().replace(/[“”‘’"]/g, "").replace(/\s+/g, " ");

const DAYS: CountdownDay[] = [...ADVENT_DAYS, ...LENT_DAYS_1, ...LENT_DAYS_2];
const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
const passagesOf = (day: CountdownDay): LifeEventPassage[] => [...day.readings, day.card];
const PLACEHOLDER = /\b(todo|tbd|lorem|xxx|fixme)\b/i;
/** The site's own words, with quoted Scripture (inside curly double quotes) taken out. */
const ownWords = (text: string) => text.replace(/“[^”]*”/g, "");

describe("countdowns: the written content", () => {
  it("holds all 29 Advent days, 5 candle panels and 47 Lent days", () => {
    expect(ADVENT_DAYS).toHaveLength(29);
    expect(ADVENT_PANELS).toHaveLength(5);
    expect(LENT_DAYS_1.length + LENT_DAYS_2.length).toBe(47);
  });

  it("uses only verses the Berean has, in ranges that run forward inside one chapter, with the right roles", () => {
    for (const day of DAYS) {
      expect(day.readings.length, day.key).toBeGreaterThanOrEqual(1);
      expect(day.readings.length, day.key).toBeLessThanOrEqual(2);
      for (const passage of day.readings) expect(passage.role, day.key).toBe("reading");
      expect(day.card.role, day.key).toBe("card");
      for (const passage of passagesOf(day)) {
        for (const id of passageVerseIds(passage)) expect(berean(id), `${day.key} verse ${id}`).toBeTruthy();
      }
    }
    for (const panel of ADVENT_PANELS) for (const id of passageVerseIds(panel.passage)) expect(berean(id), panel.key).toBeTruthy();
  });

  it("assembles every passage with paired double quotation marks and a proper sentence end", () => {
    const passages = [...DAYS.flatMap((day) => passagesOf(day).map((passage) => ({ passage, where: day.key }))),
      ...ADVENT_PANELS.map((panel) => ({ passage: panel.passage, where: panel.key }))];
    for (const { passage, where } of passages) {
      const text = assemblePassage(passage, berean);
      const label = `${where} ${passageReference(passage, bookName)}: ${text}`;
      expect(text.split("“").length, label).toBe(text.split("”").length);
      expect(/[.!?…][”’]*$/.test(text), label).toBe(true);
    }
  });

  it("keeps every card verse and candle passage short enough to print at full size", () => {
    for (const day of DAYS) expect(assemblePassage(day.card, berean).length, day.key).toBeLessThanOrEqual(CARD_FULL);
    for (const panel of ADVENT_PANELS) expect(assemblePassage(panel.passage, berean).length, panel.key).toBeLessThanOrEqual(CARD_FULL);
  });

  it("keeps titles, reflections, prayers and questions within their limits", () => {
    for (const day of DAYS) {
      expect(day.title.length, day.key).toBeLessThanOrEqual(50);
      expect(words(day.reflection), `${day.key} reflection`).toBeGreaterThanOrEqual(60);
      expect(words(day.reflection), `${day.key} reflection`).toBeLessThanOrEqual(110);
      expect(words(day.prayer), `${day.key} prayer`).toBeLessThanOrEqual(45);
      expect(day.prayer.endsWith("Amen."), `${day.key} prayer`).toBe(true);
      if (day.question !== undefined) expect(day.question.length, `${day.key} question`).toBeLessThanOrEqual(120);
    }
  });

  it("has no empty or placeholder text and no exclamation marks in the site's own words", () => {
    const texts = [
      ...DAYS.flatMap((day) => [day.title, day.reflection, day.prayer, day.question ?? "x", ...passagesOf(day).map((item) => item.note)]
        .map((text) => ({ text, where: day.key }))),
      ...ADVENT_PANELS.flatMap((panel) => [panel.heading, panel.line, panel.passage.note].map((text) => ({ text, where: panel.key }))),
    ];
    for (const { text, where } of texts) {
      expect(text.trim().length, where).toBeGreaterThan(0);
      expect(PLACEHOLDER.test(text), `${where}: ${text}`).toBe(false);
      expect(ownWords(text).includes("!"), `${where}: ${text}`).toBe(false);
    }
  });

  it("quotes Scripture in the reflections in the Berean's exact words", () => {
    const corpus = allChapters();
    for (const day of DAYS) {
      for (const quoted of day.reflection.match(/“[^”]*”/g) ?? []) {
        const inner = flat(quoted.slice(1, -1)).replace(/[.,;:!?…]+$/, "").trim();
        if (inner.split(" ").length < 3) continue;
        expect(corpus.some((chapter) => chapter.includes(inner)), `${day.key}: ${quoted}`).toBe(true);
      }
    }
  });

  it("links only hymns the collection holds", () => {
    for (const item of [...DAYS, ...ADVENT_PANELS]) if (item.hymn) expect(hymnIds.has(item.hymn), `${item.key} ${item.hymn}`).toBe(true);
  });
});
