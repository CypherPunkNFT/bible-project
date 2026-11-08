// The packs' data against the site's own Berean files and topic index (design 7.3, "Data checks" and "Search inventory").
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assemblePassage, CARD_MAX, partLetter, passageReference, passageVerseIds } from "@/pages/life-events/passage";
import { ORNAMENT_NAMES } from "@/pages/life-events/Ornament";
import { LIFE_EVENT_FAMILIES, LIFE_EVENTS, lifeEventPaths } from ".";
import { BOOK_NUMBERS } from "./types";

interface CatalogBook { num: number; code: string; name: string }
const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as { books: CatalogBook[] };
const books = new Map(catalog.books.map((book) => [book.num, book]));
const topics = (JSON.parse(readFileSync("data/topics/index.json", "utf8")) as { topics: Record<string, { title: string }> }).topics;

const held = new Map<string, Record<string, string>>();
/** A verse's Berean words as the site shows them (verses.ts: no paragraph sign, whitespace collapsed), or null. */
function berean(id: number): string | null {
  const code = books.get(Math.floor(id / 1_000_000))!.code;
  if (!held.has(code)) held.set(code, JSON.parse(readFileSync(`data/plain/bsb/${code}.json`, "utf8")) as Record<string, string>);
  const text = held.get(code)![`${Math.floor(id / 1000) % 1000}:${id % 1000}`];
  return text === undefined ? null : text.replace(/^¶\s*/, "").replace(/\s+/g, " ").trim();
}
const bookName = (num: number) => books.get(num)!.name;
const all = LIFE_EVENTS.flatMap((event) => event.passages.map((passage) => ({ event, passage, where: `${event.slug} ${passageReference(passage, bookName)}` })));

describe("life-event packs: the data", () => {
  it("names every book by the catalogue's own number", () => {
    for (const [code, num] of Object.entries(BOOK_NUMBERS)) expect(books.get(num)?.code, code).toBe(code);
    expect(Object.keys(BOOK_NUMBERS)).toHaveLength(66);
  });

  it("holds the fifteen planned packs and their 182 passages", () => {
    expect(LIFE_EVENTS).toHaveLength(15);
    expect(all).toHaveLength(182);
  });

  it("uses only verses the Berean has, in ranges that run forward inside one book and chapter", () => {
    for (const { passage, where } of all) {
      if (passage.to !== undefined) {
        expect(Math.floor(passage.to / 1_000_000), where).toBe(Math.floor(passage.from / 1_000_000));
        expect(passage.to, where).toBeGreaterThan(passage.from);
      }
      for (const id of passageVerseIds(passage)) expect(berean(id), `${where} verse ${id}`).toBeTruthy();
    }
  });

  it("skips only verses the Berean really omits, inside their range (Acts 8:37)", () => {
    const skipping = all.filter(({ passage }) => passage.skip?.length);
    expect(skipping.map(({ where }) => where)).toEqual(["baptism Acts 8:35–36, 38"]);
    for (const { passage, where } of skipping) {
      for (const id of passage.skip!) {
        expect(berean(id), where).toBeNull();
        expect(id > passage.from && id < (passage.to ?? passage.from), where).toBe(true);
      }
    }
  });

  it("stores every partial verse as an exact excerpt of the first or last verse, marked a or b by where it sits", () => {
    const partial = all.filter(({ passage }) => passage.part);
    expect(partial.map(({ where }) => where).sort()).toEqual([
      "anniversary 1 Corinthians 13:7–8a", "anniversary Song of Songs 8:7a", "baby-dedication Joshua 24:15b",
      "wedding 1 Corinthians 13:4–8a", "wedding Ecclesiastes 4:12b",
    ]);
    for (const { passage, where } of partial) {
      const part = passage.part!;
      expect([passage.from, passage.to ?? passage.from], where).toContain(part.verse);
      const verse = berean(part.verse)!;
      expect(verse.includes(part.text), where).toBe(true);
      expect(partLetter(passage, verse), where).toBe(part.mark);
    }
  });

  it("assembles every passage with paired double quotation marks and a proper sentence end", () => {
    for (const { passage, where } of all) {
      const text = assemblePassage(passage, berean);
      expect(text.split("“").length, `${where}: ${text}`).toBe(text.split("”").length);
      let depth = 0;
      for (const character of text) {
        if (character === "“") depth++;
        if (character === "”") depth--;
        expect(depth >= 0 && depth <= 1, where).toBe(true);
      }
      expect(text.replace(/[”’"']+$/, ""), where).toMatch(/[.!?…]$/);
      expect(text.charAt(0), where).toBe(text.charAt(0).toUpperCase());
    }
  });

  it("keeps 9–16 passages per pack, at least three card verses, each card verse 320 characters or fewer", () => {
    for (const event of LIFE_EVENTS) {
      expect(event.passages.length, event.slug).toBeGreaterThanOrEqual(9);
      expect(event.passages.length, event.slug).toBeLessThanOrEqual(16);
      expect(event.passages.filter((item) => item.role === "card").length, event.slug).toBeGreaterThanOrEqual(3);
    }
    for (const { passage, where } of all) {
      if (passage.role === "card") expect(assemblePassage(passage, berean).length, where).toBeLessThanOrEqual(CARD_MAX);
    }
  });

  it("gives every passage a one-line note, and keeps the deacon readings under their own sub-heading", () => {
    for (const { passage, where } of all) {
      expect(passage.note.length, where).toBeGreaterThan(10);
      expect(passage.note.length, where).toBeLessThanOrEqual(160);
    }
    const ordination = LIFE_EVENTS.find((event) => event.slug === "ordination")!;
    expect(ordination.passages.filter((item) => item.group === "For deacons").map((item) => passageReference(item, bookName))).toEqual(["Acts 6:1–6", "1 Timothy 3:8–13"]);
  });

  it("carries the context notes the design lists", () => {
    const withContext = new Set(all.filter(({ passage }) => passage.context).map(({ where }) => where.replace(/^\S+ /, "")));
    for (const reference of ["Ruth 1:16–17", "Jeremiah 29:11", "Jeremiah 1:5", "Joshua 1:9", "Joshua 24:15b", "Proverbs 22:6", "Deuteronomy 8:18",
      "Philippians 4:11–13", "Matthew 6:33", "Lamentations 3:22–23", "1 Peter 3:21", "Acts 2:38–41", "Luke 2:22–24", "Daniel 1:17", "Esther 2:7",
      "Numbers 8:25–26", "John 16:21", "Zephaniah 3:17", "Matthew 25:21", "2 Timothy 4:7"]) expect(withContext.has(reference), reference).toBe(true);
    for (const { event, passage, where } of all) {
      if (Math.floor(passage.from / 1_000_000) === 22) expect(passage.context, where).toMatch(/husband and wife/);
      if (passage.context) expect(event.passages.includes(passage)).toBe(true);
    }
  });

  it("has unique, address-safe slugs, real families, siblings and topic pages, and card settings within limits", () => {
    const slugs = LIFE_EVENTS.map((event) => event.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const families = new Set(LIFE_EVENT_FAMILIES.map((family) => family.id));
    for (const event of LIFE_EVENTS) {
      expect(event.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(families.has(event.family), event.slug).toBe(true);
      for (const related of event.related) {
        expect(slugs, `${event.slug} -> ${related}`).toContain(related);
        expect(related, event.slug).not.toBe(event.slug);
      }
      expect(event.topics.length, event.slug).toBeGreaterThan(0);
      for (const topic of event.topics) expect(topics[topic.slug]?.title, `${event.slug} topic ${topic.slug}`).toBe(topic.title);
      expect(event.card.heading.length, event.slug).toBeLessThanOrEqual(50);
      expect(ORNAMENT_NAMES, event.slug).toContain(event.card.ornament);
      expect(event.heading.length, event.slug).toBeLessThanOrEqual(60);
    }
  });

  it("gives every pack a 60–160 word introduction whose first sentence names the event", () => {
    for (const event of LIFE_EVENTS) {
      const words = event.intro.trim().split(/\s+/).length;
      expect(words, event.slug).toBeGreaterThanOrEqual(60);
      expect(words, event.slug).toBeLessThanOrEqual(160);
      const first = event.intro.split(/(?<=\.)\s/)[0];
      expect(first.toLowerCase(), event.slug).toContain(event.heading.toLowerCase().replace(/^bible verses (for|about) (an? )?/, "").split(" ")[0]);
    }
  });

  it("gives the name and date fields the design sets out", () => {
    const names = Object.fromEntries(LIFE_EVENTS.map((event) => [event.slug, event.card.names]));
    for (const slug of ["wedding", "engagement", "anniversary"]) expect(names[slug], slug).toBe(2);
    for (const slug of ["baptism", "new-baby", "baby-dedication", "adoption", "ordination", "missionary", "graduation", "retirement"]) expect(names[slug], slug).toBe(1);
    const dated = LIFE_EVENTS.filter((event) => event.card.date).map((event) => event.slug).sort();
    expect(dated).toEqual(["anniversary", "baby-dedication", "baptism", "graduation", "ordination", "wedding"]);
  });
});

describe("life-event packs: the search inventory", () => {
  it("lists the hub and every pack, and nothing else", () => {
    expect(lifeEventPaths()).toEqual(["/life-events", ...LIFE_EVENTS.map((event) => `/life-events/${event.slug}`)]);
    expect(new Set(lifeEventPaths()).size).toBe(16);
  });
});
