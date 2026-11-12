import { byJoinOrder, fullReference, joinOrder, medalFor, shareOfTop, slideFrom } from "./display";

const books = [{ code: "GEN", name: "Genesis" }, { code: "EZK", name: "Ezekiel" }];

describe("the night's verses", () => {
  it("write the book out in full from the link", () => {
    expect(fullReference("Gen 7:6", { book: "GEN", chapter: 7, verse: 6 }, books)).toBe("Genesis 7:6");
    expect(fullReference("Ezekiel 14:1", { book: "EZK", chapter: 14, verse: 1 }, books)).toBe("Ezekiel 14:1");
    expect(fullReference(null, { book: "GEN", chapter: 50, verse: null }, books)).toBe("Genesis 50");
  });
  it("fall back to the bank's own words when the book or link is unknown", () => {
    expect(fullReference("Jam 5:15", { book: "JAS", chapter: 5, verse: 15 }, books)).toBe("Jam 5:15");
    expect(fullReference("Psalm 23", null, books)).toBe("Psalm 23");
    expect(fullReference(null, null, books)).toBe("");
  });
});

describe("the lobby's order", () => {
  it("keeps players in the order they were first seen, not the ranked order the server sends", () => {
    const seen = joinOrder(new Map(), ["ruth", "boaz"]);
    joinOrder(seen, ["ann", "boaz", "ruth"]);
    expect(byJoinOrder([{ id: "ann" }, { id: "boaz" }, { id: "ruth" }], seen).map((p) => p.id)).toEqual(["ruth", "boaz", "ann"]);
  });
});

describe("places and movement", () => {
  it("give medals to the first three places only", () => {
    expect([1, 2, 3, 4].map(medalFor)).toEqual([1, 2, 3, null]);
  });
  it("slide a row in from where it was, capped at five rows", () => {
    expect(slideFrom(null)).toBe(0);
    expect(slideFrom(2)).toBe(2);
    expect(slideFrom(-9)).toBe(-5);
  });
  it("measure a score against the top", () => {
    expect(shareOfTop(500, 1000)).toBe(0.5);
    expect(shareOfTop(0, 0)).toBe(0);
  });
});
