// Word-by-word options for Pick at Hard (design §5.1): three distinct options with the right one among them, never the
// same word or one differing only by its ending, the right word's capital on every option, and seeded.
import { bsbWords } from "@/lib/bsb-for-tests";
import { bareWord, wordChoices } from "./choices";
import { equivalent } from "./equivalents";
import { differsByEnding } from "./match";
import { cleanVerse } from "./passage";
import { words } from "./words";

const verse = (code: string, chapter: number, number: number) => words(cleanVerse(bsbWords({ code, chapter, verse: number })));
const hidden = verse("JHN", 3, 16).slice(6);
const decoys = [...verse("JHN", 1, 1), ...verse("JHN", 14, 6)];

describe("verse completion word choices", () => {
  it("offers three distinct options including the right word, none equal to it or differing only by an ending", () => {
    for (let i = 0; i < hidden.length; i++) {
      const choice = wordChoices(hidden, i, { decoys, book: [] }, 7, "jhn-3-16")!;
      expect(choice.options).toHaveLength(3);
      const right = bareWord(hidden[i]);
      expect(choice.options[choice.right]).toBe(right);
      const keys = choice.options.map((option) => equivalent(words(option)[0].key));
      expect(new Set(keys).size).toBe(3);
      for (const [k, key] of keys.entries()) if (k !== choice.right) expect(differsByEnding(key, keys[choice.right])).toBe(false);
    }
  });

  it("gives the same options for the same seed, and others for another", () => {
    const a = wordChoices(hidden, 3, { decoys, book: [] }, 7, "jhn-3-16");
    expect(wordChoices(hidden, 3, { decoys, book: [] }, 7, "jhn-3-16")).toEqual(a);
    const seeds = new Set(Array.from({ length: 8 }, (_, seed) => JSON.stringify(wordChoices(hidden, 3, { decoys, book: [] }, seed, "jhn-3-16"))));
    expect(seeds.size).toBeGreaterThan(1);
  });

  it("styles every option with the right word's capital and no punctuation", () => {
    const capital = verse("PSA", 23, 1);
    const choice = wordChoices(capital, 5, { decoys, book: [] }, 3, "psa-23-1")!; // "I"
    expect(choice.options.every((option) => /^[A-Z]/.test(option))).toBe(true);
    const lower = wordChoices(hidden, 0, { decoys, book: [] }, 3, "jhn-3-16")!;
    expect(lower.options.every((option) => /^[a-z]/.test(option) && !/[,.;:“”]/.test(option))).toBe(true);
  });

  it("falls back to the book's words and gives up only when two others cannot be found", () => {
    const short = verse("PSA", 23, 1).slice(5);
    expect(wordChoices(short, short.length - 1, { decoys: [], book: [] }, 1, "psa-23-1")).toBeNull();
    expect(wordChoices(short, short.length - 1, { decoys: [], book: verse("PSA", 23, 4) }, 1, "psa-23-1")).not.toBeNull();
  });
});
