// The curation file, the schedule and the files the widget reads (docs/features/verse-widget/design.md 10, "Curation
// and schedule" and "The v1 promise"), against the site's own Berean files and the widget's own shape check.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { OCCASIONS } from "@/data/countdowns";
import { assemblePassage, passageVerseIds } from "@/pages/life-events/passage";
import { dayFileOf, MAX_ORDINARY, type DayFile } from "@/pages/verse-of-the-day/day-file";
import { bookOfKey, rotationOf, scheduledKey, type Schedule } from "@/pages/verse-of-the-day/schedule";
import { runWidget, widget } from "@/pages/verse-of-the-day/widget-kit";
import { FIXED_DAYS, POOL } from "./curation";
import { dayOfKey, keyOfDay, passageKey } from "./keys";

interface CatalogBook { num: number; code: string; name: string }
const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as { books: CatalogBook[] };
const books = new Map(catalog.books.map((book) => [book.num, book]));
const held = new Map<string, Record<string, string>>();
const bookFile = (code: string) => {
  if (!held.has(code)) held.set(code, JSON.parse(readFileSync(`data/plain/bsb/${code}.json`, "utf8")) as Record<string, string>);
  return held.get(code)!;
};
const words = {
  verse: (id: number): string | null => {
    const text = bookFile(books.get(Math.floor(id / 1_000_000))!.code)[`${Math.floor(id / 1000) % 1000}:${id % 1000}`];
    return text === undefined ? null : text.replace(/^¶\s*/, "").replace(/\s+/g, " ").trim();
  },
  bookName: (num: number) => books.get(num)!.name,
};

const DAYS_FOLDER = "public/widget/v1/days";
const schedule = JSON.parse(readFileSync("src/data/verse-of-the-day/schedule.json", "utf8")) as Schedule;
const pool = JSON.parse(readFileSync("public/widget/v1/pool.json", "utf8")) as { v: 1; lastDate: string; next: number; entries: { text: string; reference: string; read: string }[]; longest: DayFile };
const dates = Object.keys(schedule.days).sort();
const dayFile = (date: string) => JSON.parse(readFileSync(`${DAYS_FOLDER}/${date}.json`, "utf8")) as DayFile;
const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
const cardVerses = new Set(OCCASIONS.flatMap((occasion) => (Array.isArray(occasion.days) ? occasion.days : []).flatMap((day) => passageVerseIds(day.card))));

describe("verse of the day: the curation file", () => {
  it("quotes only Berean verses, one chapter and at most three verses each, starting a sentence, 220 characters or fewer", () => {
    for (const passage of [...POOL, ...FIXED_DAYS.map((fixed) => fixed.passage)]) {
      const key = passageKey(passage);
      const ids = passageVerseIds(passage);
      expect(ids.length, key).toBeLessThanOrEqual(3);
      for (const id of ids) expect(words.verse(id), `${key}: verse ${id}`).not.toBeNull();
      const text = assemblePassage(passage, words.verse);
      expect(text.length, `${key}: ${text}`).toBeLessThanOrEqual(MAX_ORDINARY);
      expect(text, `${key} starts mid-sentence`).toMatch(/^[“‘"A-Z]/);
    }
  });

  it("keeps the seasons' verses special: no pool entry is a countdown card or a fixed day's verse, and none is listed twice", () => {
    const fixed = new Set(FIXED_DAYS.flatMap((day) => passageVerseIds(day.passage)));
    const keys = POOL.map(passageKey);
    expect(new Set(keys).size).toBe(keys.length);
    for (const passage of POOL) {
      for (const id of passageVerseIds(passage)) {
        expect(cardVerses.has(id), `${passageKey(passage)} is a countdown card`).toBe(false);
        expect(fixed.has(id), `${passageKey(passage)} is a fixed day's verse`).toBe(false);
      }
    }
    for (const day of FIXED_DAYS) for (const id of passageVerseIds(day.passage)) expect(cardVerses.has(id), day.key).toBe(false);
  });

  it("holds at least 320 entries, at most a quarter from Psalms and Proverbs and at least 40% from the New Testament", () => {
    const bookOf = (from: number) => Math.floor(from / 1_000_000);
    expect(POOL.length).toBeGreaterThanOrEqual(320);
    expect(POOL.filter((passage) => [19, 20].includes(bookOf(passage.from))).length * 4).toBeLessThanOrEqual(POOL.length);
    expect(POOL.filter((passage) => bookOf(passage.from) > 39).length * 10).toBeGreaterThanOrEqual(POOL.length * 4);
  });

  it("gives every entry a note saying why it is there", () => {
    for (const passage of [...POOL, ...FIXED_DAYS.map((fixed) => fixed.passage)]) expect(passage.note.length, passageKey(passage)).toBeGreaterThan(5);
  });
});

describe("verse of the day: the schedule and its files", () => {
  it("has a day file for every scheduled date and a scheduled date for every day file", () => {
    const files = readdirSync(DAYS_FOLDER).filter((name) => name.endsWith(".json")).map((name) => name.replace(/\.json$/, "")).sort();
    expect(files).toEqual(dates);
    expect(dates[0]).toBe(schedule.epoch);
    expect(dates[dates.length - 1]).toBe(schedule.lastDate);
    // One file per date, with no gaps.
    expect(dayOfKey(schedule.lastDate) - dayOfKey(schedule.epoch) + 1).toBe(dates.length);
  });

  it("writes in every day file the Berean words, reference and reader link its passage gives today", () => {
    for (const date of dates) expect(dayFile(date), date).toEqual(dayFileOf(date, schedule.days[date], words));
  });

  it("lists in pool.json the rotation in schedule order, with the position after the last day, and the longest day", () => {
    const rotation = rotationOf(schedule);
    expect(pool.v).toBe(1);
    expect(pool.lastDate).toBe(schedule.lastDate);
    expect(pool.next).toBe(schedule.next);
    expect(pool.entries).toEqual(rotation.map((key) => {
      const file = dayFileOf("", key, words);
      return { text: file.text, reference: file.reference, read: file.read };
    }));
    const longest = Math.max(...dates.map((date) => dayFile(date).text.length));
    expect(pool.longest.text.length).toBe(longest);
    expect(pool.longest).toEqual(dayFile(pool.longest.date));
  });

  it("never puts two verses from one book on consecutive ordinary days", () => {
    const ordinary = dates.filter((date) => typeof schedule.days[date] === "string");
    for (let i = 1; i < ordinary.length; i++) {
      const [a, b] = [scheduledKey(schedule.days[ordinary[i - 1]]), scheduledKey(schedule.days[ordinary[i]])];
      expect(bookOfKey(a) === bookOfKey(b), `${ordinary[i - 1]} ${a} and ${ordinary[i]} ${b}`).toBe(false);
    }
    const rotation = rotationOf(schedule);
    expect(bookOfKey(rotation[0]) === bookOfKey(rotation[rotation.length - 1]), "the rotation's last and first verses").toBe(false);
  });

  it("never repeats an ordinary verse within 365 days", () => {
    const seen = new Map<string, number>();
    for (const date of dates) {
      const day = schedule.days[date];
      if (typeof day !== "string") continue;
      const n = dayOfKey(date);
      const before = seen.get(day);
      if (before !== undefined) expect(n - before, `${day} on ${keyOfDay(before)} and ${date}`).toBeGreaterThanOrEqual(365);
      seen.set(day, n);
    }
  });

  it("has at least 400 scheduled days left after today", () => {
    const left = dayOfKey(schedule.lastDate) - dayOfKey(today());
    expect(left, "Fewer than 400 days of verses are left: run node --experimental-strip-types scripts/build-verse-of-the-day.ts and commit what it writes.").toBeGreaterThanOrEqual(400);
  });
});

describe("verse of the day: the widget accepts what the build writes", () => {
  beforeAll(() => {
    if (!window.__bibleGuideVerse) runWidget();
    widget().stop();
  });

  it("passes every day file, every pool entry and the longest day through verse.js's own shape check", () => {
    for (const date of dates) expect(widget().isDay(dayFile(date)), date).toBe(true);
    expect(widget().isPool(pool)).toBe(true);
  });
});

describe("verse of the day: the v1 promise", () => {
  it("keeps the four v1 addresses in public/", () => {
    for (const file of ["public/widget/v1/verse.js", "public/widget/v1/frame.html", "public/widget/v1/pool.json"]) expect(existsSync(file), file).toBe(true);
    expect(readdirSync(DAYS_FOLDER).length).toBeGreaterThan(0);
  });
});
