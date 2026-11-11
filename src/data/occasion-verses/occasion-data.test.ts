// The occasion verse picker's data (design 2–6) against the site's own Berean files, the packs and sets it folds in, and
// its committed keys.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assemblePassage, partLetter, passageReference } from "@/pages/life-events/passage";
import { LIFE_EVENTS } from "../life-events";
import { FUNERAL_READINGS, HUB_SET, LOSS_SETS, passageKey } from "../sympathy";
import { BIRTHDAY_BY_DATE, OCCASIONS, OCCASION_GROUPS, allBirthdayDates, birthdayDatesComplete, monthDayOf, occasionBySlug, occasionKeys, placeByKey } from ".";
import { KEPT_OCCASION_KEYS } from "./kept-keys";
import { p } from "../life-events/types";

interface CatalogBook { num: number; code: string; name: string }
const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as { books: CatalogBook[] };
const books = new Map(catalog.books.map((book) => [book.num, book]));
const held = new Map<string, Record<string, string>>();
function berean(id: number): string | null {
  const code = books.get(Math.floor(id / 1_000_000))!.code;
  if (!held.has(code)) held.set(code, JSON.parse(readFileSync(`data/plain/bsb/${code}.json`, "utf8")) as Record<string, string>);
  const text = held.get(code)![`${Math.floor(id / 1000) % 1000}:${id % 1000}`];
  return text === undefined ? null : text.replace(/^¶\s*/, "").replace(/\s+/g, " ").trim();
}
const bookName = (num: number) => books.get(num)!.name;
const all = OCCASIONS.flatMap((occasion) => occasion.sections.flatMap((section) => section.passages.map((passage) => ({
  occasion, section, passage, key: passageKey(passage), where: `${occasion.slug}/${section.id} ${passageReference(passage, bookName)}`,
}))));

describe("occasion verse picker: the occasions", () => {
  it("folds in every life-event pack, the funeral readings, the sympathy hub and every loss page, plus its own", () => {
    for (const event of LIFE_EVENTS) expect(occasionBySlug(event.slug)?.heading, event.slug).toBe(event.heading);
    expect(occasionBySlug("sympathy")?.heading).toBe(HUB_SET.heading);
    for (const set of LOSS_SETS) expect(occasionBySlug(`sympathy-${set.slug}`)?.heading, set.slug).toBe(set.heading);
    expect(occasionBySlug("funeral")?.sections.flatMap((section) => section.passages)).toHaveLength(FUNERAL_READINGS.length);
    for (const slug of ["wedding", "baptism", "confirmation", "birthday", "funeral"]) expect(occasionBySlug(slug), slug).toBeDefined();
    expect(OCCASIONS).toHaveLength(LIFE_EVENTS.length + LOSS_SETS.length + 4);
  });

  it("gives every occasion a unique address-safe slug, a known group, and sections in group order", () => {
    const slugs = OCCASIONS.map((occasion) => occasion.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    const ranks = OCCASIONS.map((occasion) => OCCASION_GROUPS.findIndex((group) => group.id === occasion.group));
    expect(ranks.every((rank) => rank >= 0)).toBe(true);
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
    for (const occasion of OCCASIONS) {
      expect(occasion.sections.length, occasion.slug).toBeGreaterThan(0);
      const ids = occasion.sections.map((section) => section.id);
      expect(new Set(ids).size, occasion.slug).toBe(ids.length);
      for (const section of occasion.sections) expect(section.passages.length, `${occasion.slug}/${section.id}`).toBeGreaterThan(0);
    }
  });

  it("names nothing for unknown or inherited slugs", () => {
    for (const slug of ["", "nope", "__proto__", "constructor", "toString", null, undefined]) expect(occasionBySlug(slug)).toBeUndefined();
  });

  it("puts every passage of the wedding pack in a part of the service, keeping the pack's own notes", () => {
    const pack = LIFE_EVENTS.find((event) => event.slug === "wedding")!;
    const wedding = occasionBySlug("wedding")!;
    expect(wedding.sections.map((section) => section.id)).toEqual(["opening", "readings", "message", "vows", "prayer", "benediction", "programs"]);
    const shown = wedding.sections.flatMap((section) => section.passages);
    for (const passage of pack.passages) expect(shown).toContain(passage);
    expect(wedding.certificate).toBe("wedding");
  });

  it("keeps the sympathy pages' pastoral parts: the help strip, explainers and labels", () => {
    expect(occasionBySlug("sympathy-loss-to-suicide")?.helpStrip).toBe(true);
    for (const set of LOSS_SETS) if (set.explainer) expect(occasionBySlug(`sympathy-${set.slug}`)?.explainer, set.slug).toEqual(set.explainer);
    for (const event of LIFE_EVENTS) if (event.explainer) expect(occasionBySlug(event.slug)?.explainer?.paragraphs, event.slug).toEqual([event.explainer.text]);
    expect(all.some(({ passage }) => passage.believer)).toBe(true);
  });

  it("offers a certificate only for the wedding, baptism, confirmation and dedication", () => {
    const withCertificate = OCCASIONS.filter((occasion) => occasion.certificate).map((occasion) => `${occasion.slug}:${occasion.certificate}`);
    expect(withCertificate.sort()).toEqual(["baby-dedication:dedication", "baptism:baptism", "confirmation:profession", "wedding:wedding"]);
  });

  it("says plainly how Baptists differ on confirmation, and leaves the Orthodox out", () => {
    const text = occasionBySlug("confirmation")!.explainer!.paragraphs.join(" ");
    expect(text).toContain("Baptist churches do not confirm");
    expect(text).toContain("baptized as a believer");
    expect(text).not.toMatch(/Orthodox/);
  });
});

describe("occasion verse picker: the passages", () => {
  it("uses only verses the Berean has, and every passage assembles into words", () => {
    for (const { passage, where } of all) {
      const text = assemblePassage(passage, berean);
      expect(text.length, where).toBeGreaterThan(10);
    }
  });

  it("stores every partial verse as an exact excerpt, marked a or b by where it sits", () => {
    for (const { passage, where } of all.filter((item) => item.passage.part)) {
      const verse = berean(passage.part!.verse)!;
      expect(partLetter(passage, verse), where).toBe(passage.part!.mark);
    }
  });

  it("gives one key the same verses, skips and excerpt wherever it appears", () => {
    const seen = new Map<string, string>();
    for (const { passage, key, where } of all) {
      const shape = JSON.stringify([passage.from, passage.to ?? null, passage.skip ?? null, passage.part?.text ?? null]);
      expect(seen.get(key) ?? shape, where).toBe(shape);
      seen.set(key, shape);
    }
  });

  it("never loses a committed key, and every key finds its passage", () => {
    const keys = new Set(occasionKeys());
    for (const key of KEPT_OCCASION_KEYS) expect(keys.has(key), key).toBe(true);
    for (const key of keys) expect(placeByKey(key)?.key).toBe(key);
    expect(placeByKey("  PSALM-23-1-6, ")?.key).toBe("psalm-23-1-6");
    expect(placeByKey("psalm-999-1")).toBeUndefined();
  });
});

describe("occasion verse picker: the birthday date slot", () => {
  it("knows the 366 dates of a leap year and reads a date field without a time zone", () => {
    const dates = allBirthdayDates();
    expect(dates).toHaveLength(366);
    expect(dates).toContain("02-29");
    expect(monthDayOf("2025-12-31")).toBe("12-31");
    expect(monthDayOf("2024-02-29")).toBe("02-29");
    expect(monthDayOf("2025-02-30")).toBeNull();
    expect(monthDayOf("12-31")).toBeNull();
  });

  it("is complete only when every date has a verse, and every entry is a real date with a real verse", () => {
    expect(birthdayDatesComplete({})).toBe(false);
    const full = Object.fromEntries(allBirthdayDates().map((date) => [date, p("PSA 118:24", "card", "A test verse.")]));
    expect(birthdayDatesComplete(full)).toBe(true);
    for (const [date, passage] of Object.entries(BIRTHDAY_BY_DATE)) {
      expect(allBirthdayDates(), date).toContain(date);
      expect(assemblePassage(passage, berean).length, date).toBeGreaterThan(10);
    }
  });
});
