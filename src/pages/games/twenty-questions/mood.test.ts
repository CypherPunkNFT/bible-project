// The thinker's mood and the lesson's stepper (shared.ts): pure, so they are tested without a page.
import { describe, expect, it } from "vitest";
import { moodAfter, nextToReview } from "./shared";

describe("moodAfter", () => {
  it("reacts to the last answer, and thinks hard from the fifteenth question", () => {
    expect(moodAfter(undefined, 0)).toBe("idle");
    expect(moodAfter({ kind: "q", tag: 0, answer: "y" }, 3)).toBe("yes");
    expect(moodAfter({ kind: "q", tag: 0, answer: "n" }, 3)).toBe("no");
    expect(moodAfter({ kind: "q", tag: 0, answer: "d" }, 3)).toBe("dunno");
    expect(moodAfter({ kind: "q", tag: 0, answer: "y" }, 15)).toBe("hard");
    expect(moodAfter({ kind: "q", tag: 0, answer: "d" }, 15)).toBe("dunno");
    expect(moodAfter({ kind: "g", person: 2, right: false }, 15)).toBe("no");
  });
});

describe("nextToReview", () => {
  it("walks the differences in order and ends at -1", () => {
    expect(nextToReview(["a", "b", "c"], [], [])).toBe(0);
    expect(nextToReview(["a", "b", "c"], ["a"], [])).toBe(1);
    expect(nextToReview(["a", "b", "c"], ["a"], ["b"])).toBe(2);
    expect(nextToReview(["a", "b", "c"], ["a", "c"], ["b"])).toBe(-1);
    expect(nextToReview([], [], [])).toBe(-1);
  });
});
