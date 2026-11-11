// Scripture memory: how many words hide at each step, and in what order (design §3 and §9).
import { describe, expect, it } from "vitest";
import { fadeOrder, hiddenAt, hiddenCount, passageSeed, passageWords } from "./fade";

describe("hidden words per step", () => {
  it("hides none at step 1 (stage 0) and every word from the last step on", () => {
    for (const count of [1, 2, 3, 25, 200]) {
      expect(hiddenCount(count, 0)).toBe(0);
      expect(hiddenCount(count, 5)).toBe(count);
      expect(hiddenCount(count, 6)).toBe(count);
    }
  });

  it("hides at least one more word each step, yet never the last one before the final step", () => {
    expect([1, 2, 3, 4].map((stage) => hiddenCount(2, stage))).toEqual([1, 1, 1, 1]); // "Jesus wept."
    expect([1, 2, 3, 4].map((stage) => hiddenCount(3, stage))).toEqual([1, 2, 2, 2]);
    expect([1, 2, 3, 4].map((stage) => hiddenCount(1, stage))).toEqual([0, 0, 0, 0]);
    expect([1, 2, 3, 4].map((stage) => hiddenCount(25, stage))).toEqual([5, 10, 15, 20]);
    expect([1, 2, 3, 4].map((stage) => hiddenCount(200, stage))).toEqual([40, 80, 120, 160]);
  });
});

describe("fade order", () => {
  const seed = passageSeed(43003016, 43003016);

  it("is the same every time, covers every word once, and hides the first word last", () => {
    const order = fadeOrder(25, seed);
    expect(order).toEqual(fadeOrder(25, seed));
    expect([...order].sort((a, b) => a - b)).toEqual(Array.from({ length: 25 }, (_, i) => i));
    expect(order.at(-1)).toBe(0);
    expect(fadeOrder(0, seed)).toEqual([]);
  });

  it("keeps yesterday's gaps hidden today", () => {
    for (let stage = 1; stage <= 5; stage++) {
      const before = hiddenAt(25, stage - 1, seed);
      const after = hiddenAt(25, stage, seed);
      for (const position of before) expect(after.has(position)).toBe(true);
    }
  });

  it("differs between passages", () => {
    expect(fadeOrder(25, seed)).not.toEqual(fadeOrder(25, passageSeed(19023001, 19023001)));
  });

  it("moves only the words added when the text grows", () => {
    const short = fadeOrder(20, seed).filter((i) => i !== 0);
    const long = fadeOrder(22, seed).filter((i) => i !== 0 && i < 20);
    expect(long).toEqual(short);
  });
});

describe("words of a verse", () => {
  it("keeps dashes and quotes with their words and the text exactly", () => {
    const text = "“Come to Me, all you who are weary and burdened, and I will give you rest.";
    const list = passageWords(text);
    expect(list.map((word) => word.text).join("")).toBe(text);
    expect(list[0].text).toBe("“Come ");
    const dashed = passageWords("of salvation—whom I have");
    expect(dashed.map((word) => word.text)).toEqual(["of ", "salvation—", "whom ", "I ", "have"]);
  });
});
