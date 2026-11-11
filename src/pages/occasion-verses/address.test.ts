// The picker's address (design 8, 9): only known occasions and passages, each once, at most thirty, nothing else.
import { describe, expect, it } from "vitest";
import { occasionBySlug, occasionKeys } from "@/data/occasion-verses";
import { MAX_LIST, moveKey, needsCleaning, readAddress, readList, toggleKey, writeAddress } from "./address";

describe("occasion verse picker: the address", () => {
  it("keeps known keys once, in order, and drops the rest", () => {
    expect(readList("psalm-23-1-6,nope,psalm-23-1-6, GENESIS-2-18-24 ,<script>")).toEqual(["psalm-23-1-6", "genesis-2-18-24"]);
    expect(readList(null)).toEqual([]);
    expect(readList("")).toEqual([]);
  });

  it("takes at most thirty keys and cuts an over-long value before reading it", () => {
    const many = occasionKeys().slice(0, 40).join(",");
    expect(readList(many)).toHaveLength(MAX_LIST);
    expect(readList(`${"x".repeat(5000)},psalm-23-1-6`)).toEqual([]);
  });

  it("reads the occasion through the picker's own list only", () => {
    expect(readAddress(new URLSearchParams("o=wedding")).occasion?.slug).toBe("wedding");
    expect(readAddress(new URLSearchParams("o=__proto__")).occasion).toBeUndefined();
  });

  it("writes the address back without anything it would drop", () => {
    const address = { occasion: occasionBySlug("funeral"), keys: ["psalm-23-1-6", "john-14-1-3"] };
    expect(writeAddress(address)).toBe("?o=funeral&list=psalm-23-1-6,john-14-1-3");
    expect(writeAddress({ occasion: undefined, keys: [] })).toBe("");
    expect(needsCleaning("?o=funeral&list=psalm-23-1-6,john-14-1-3", address)).toBe(false);
    expect(needsCleaning("?o=funeral&list=psalm-23-1-6,john-14-1-3&utm_source=x", address)).toBe(true);
    expect(needsCleaning("?o=nope", readAddress(new URLSearchParams("o=nope")))).toBe(true);
  });

  it("adds, removes and moves keys, never past the ends or the limit", () => {
    expect(toggleKey(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleKey(["a", "b"], "a")).toEqual(["b"]);
    const full = Array.from({ length: MAX_LIST }, (_, index) => `k${index}`);
    expect(toggleKey(full, "extra")).toBe(full);
    expect(moveKey(["a", "b", "c"], "b", -1)).toEqual(["b", "a", "c"]);
    expect(moveKey(["a", "b", "c"], "c", 1)).toEqual(["a", "b", "c"]);
    expect(moveKey(["a", "b", "c"], "a", -1)).toEqual(["a", "b", "c"]);
  });
});
