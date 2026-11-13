// The kinds of word (kinds.ts): each kind's fixed order holds every one of its words once, the same for everyone, and a
// kind's record says which word comes next.
import answersJson from "@/data/wordle/answers.json";
import type { Answers } from "./daily";
import { asKind, KINDS, kindNumber, kindOrder, kindWord } from "./kinds";

const answers = answersJson as unknown as Answers;

describe("the kinds of word", () => {
  it("gives each kind every one of its words once, in the same order every time", () => {
    for (const { key } of KINDS) {
      if (key === "mixed") continue;
      const order = kindOrder(answers, key);
      const words = Object.keys(answers).filter((word) => answers[word].c === key && !answers[word].r);
      expect(order.length, key).toBeGreaterThan(10);
      expect(new Set(order)).toEqual(new Set(words));
      expect(kindOrder(answers, key)).toEqual(order);
    }
  });

  it("goes round again after a kind's last word", () => {
    const order = kindOrder(answers, "creature");
    expect(kindWord(order, 1)).toBe(order[0]);
    expect(kindWord(order, order.length + 1)).toBe(order[0]);
  });

  it("stays on the word under way, else moves past the last finished", () => {
    expect(kindNumber({ lastDone: 0, today: null })).toBe(1);
    expect(kindNumber({ lastDone: 2, today: { n: 3 } })).toBe(3);
    expect(kindNumber({ lastDone: 3, today: { n: 3 } })).toBe(4);
  });

  it("reads the kind from the address, Mixed for anything else", () => {
    expect(asKind("place")).toBe("place");
    expect(asKind("nonsense")).toBe("mixed");
    expect(asKind(null)).toBe("mixed");
  });
});
