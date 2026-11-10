// The 366 birthday verses against the rules every choice keeps (docs/features/birthday-verses/design.md 4.2, 9.1), read
// against the site's own Berean files, and every one made into a card that fits all four sizes.
import { describe, expect, it } from "vitest";
import { BIRTHDAY_BY_DATE, allBirthdayDates, birthdayDatesComplete } from "@/data/occasion-verses";
import { EXCLUDED_VERSES, LIMITS } from "@/data/birthday-verses";
import { fitSizes } from "@/lib/verse-card/layout";
import { cardProblems, closeNoteGaps } from "@/lib/verse-card/spec";
import { bereanVerse, fixedMeasure } from "@/lib/verse-card/test-kit";
import { bookCode } from "@/lib/verse-card/links";
import { catalog } from "@/pages/life-events/test-kit";
import { toCardSpec } from "./card";
import { dayOf, matchKind } from "./dates";
import { leadLine, passageRef, passageReference } from "./verse";

const entries = Object.entries(BIRTHDAY_BY_DATE);
/** A visitor's line at the generator's 60-character limit. */
const FULL_LINE = "Happy birthday, dear Anna! With all our love, Sam and family";

/** The passage's words as the page and card show them. */
function wordsOf(date: string): string {
  const ref = passageRef(BIRTHDAY_BY_DATE[date]);
  const verses: string[] = [];
  for (let verse = ref.first; verse <= ref.last; verse++) {
    const text = bereanVerse(bookCode(ref.book), ref.chapter, verse);
    if (text === undefined) throw new Error(`${date}: the Berean has no verse ${bookCode(ref.book)} ${ref.chapter}:${verse}`);
    verses.push(closeNoteGaps(text));
  }
  return verses.join(" ");
}

const wordsIn = (text: string) => text.toLowerCase().replace(/[^a-z' ]+/g, " ").split(/\s+/).filter(Boolean);

/** True when `note` holds ten or more consecutive words of `verse`. */
function quotes(note: string, verse: string): boolean {
  const said = wordsIn(note);
  const scripture = ` ${wordsIn(verse).join(" ")} `;
  for (let start = 0; start + 10 <= said.length; start++) if (scripture.includes(` ${said.slice(start, start + 10).join(" ")} `)) return true;
  return false;
}

describe("birthday verses: the 366 choices", () => {
  it("has exactly one passage for each of the 366 dates", () => {
    expect(Object.keys(BIRTHDAY_BY_DATE)).toEqual(allBirthdayDates());
    expect(birthdayDatesComplete()).toBe(true);
  });

  it("keeps every passage inside one chapter, one to three verses, whole sentences of at most 300 characters", () => {
    for (const [date, passage] of entries) {
      const ref = passageRef(passage);
      if (passage.to) expect(Math.floor(passage.to / 1000), date).toBe(Math.floor(passage.from / 1000));
      expect(ref.last - ref.first + 1, date).toBeGreaterThanOrEqual(1);
      expect(ref.last - ref.first + 1, date).toBeLessThanOrEqual(LIMITS.maxVerses);
      expect(passage.skip ?? [], date).toEqual([]);
      expect(passage.part, date).toBeUndefined();
      expect(passage.role, date).toBe("card");
      const words = wordsOf(date);
      expect(words.length, date).toBeLessThanOrEqual(LIMITS.maxText);
      expect(words, date).toMatch(/^[“‘"'(]?[A-Z]/);
      expect(words, date).toMatch(/[.!?][”’"')]*$/);
    }
  });

  it("never gives two dates the same or an overlapping verse", () => {
    const owner = new Map<number, string>();
    for (const [date, passage] of entries) {
      for (let id = passage.from; id <= (passage.to ?? passage.from); id++) {
        expect(owner.get(id), `${date} overlaps ${owner.get(id)}`).toBeUndefined();
        owner.set(id, date);
      }
    }
  });

  it("matches the date for at least 342 dates, and flips only on days 13 to 31", () => {
    const kinds = entries.map(([date, passage]) => ({ date, kind: matchKind(date, passage) }));
    expect(kinds.filter((item) => item.kind === "chosen").length).toBeLessThanOrEqual(LIMITS.maxChosen);
    for (const { date, kind } of kinds) if (kind === "flipped") expect(dayOf(date), date).toBeGreaterThanOrEqual(13);
    expect(matchKind("03-16", { from: 43_003_016 })).toBe("date");
    expect(matchKind("07-31", { from: 19_031_007 })).toBe("flipped");
    expect(matchKind("07-12", { from: 19_012_007 })).toBe("chosen");
  });

  it("leaves out every verse the site has ruled out as a birthday verse", () => {
    for (const [date, passage] of entries) {
      for (const id of EXCLUDED_VERSES) expect(id >= passage.from && id <= (passage.to ?? passage.from), `${date} uses ${id}`).toBe(false);
    }
  });

  it("balances the year: Psalms and Proverbs at most a third, the New Testament at least a third, no book over 40", () => {
    const books = entries.map(([, passage]) => Math.floor(passage.from / 1_000_000));
    expect(books.filter((book) => book === 19 || book === 20).length).toBeLessThanOrEqual(LIMITS.maxPsalmsProverbs);
    expect(books.filter((book) => book >= 40).length).toBeGreaterThanOrEqual(LIMITS.minNewTestament);
    const counts = new Map<number, number>();
    for (const book of books) counts.set(book, (counts.get(book) ?? 0) + 1);
    for (const [book, count] of counts) expect(count, bookCode(book)).toBeLessThanOrEqual(LIMITS.maxPerBook);
  });

  it("gives every date a note of 40 to 140 characters that starts with a capital, and never quotes its verse", () => {
    for (const [date, passage] of entries) {
      expect(passage.note.length, date).toBeGreaterThanOrEqual(LIMITS.noteMin);
      expect(passage.note.length, date).toBeLessThanOrEqual(LIMITS.noteMax);
      expect(passage.note, date).toMatch(/^[A-Z]/);
      expect(passage.note, date).toMatch(/[.!?]$/);
      const words = wordsOf(date);
      expect(quotes(passage.note, words), `${date} note`).toBe(false);
      if (passage.context !== undefined) {
        expect(passage.context.length, date).toBeLessThanOrEqual(LIMITS.contextMax);
        expect(quotes(passage.context, words), `${date} context`).toBe(false);
      }
    }
    expect(quotes("one two three four five six seven eight nine ten", "Zero one two three four five six seven eight nine ten.")).toBe(true);
    expect(quotes("one two three four five six seven eight nine", "Zero one two three four five six seven eight nine ten.")).toBe(false);
  });

  it("writes a lead line of at least 60 characters for every date, so it is the page's search description", () => {
    for (const [date, passage] of entries) expect(leadLine(date, passageReference(catalog, passage), passage.note).length, date).toBeGreaterThanOrEqual(60);
    expect(leadLine("03-16", "John 3:16", "The heart of the gospel.")).toBe("March 16 · John 3:16: The heart of the gospel.");
  });

  it("makes every passage a card that fits all four sizes, bare and with a full line of the visitor's own", () => {
    const failing: string[] = [];
    for (const [date, passage] of entries) {
      const spec = toCardSpec(date, { text: wordsOf(date), reference: passageReference(catalog, passage), book: passageRef(passage).book });
      expect(cardProblems(spec), date).toEqual([]);
      for (const card of [spec, { ...spec, lines: [FULL_LINE] }]) {
        const { fits } = fitSizes(card, fixedMeasure);
        for (const size of fits) if (!size.fits) failing.push(`${date} ${size.id}${card.lines ? " with a line" : ""} (${spec.passage.text.length} characters)`);
      }
    }
    expect(failing).toEqual([]);
  });
});
