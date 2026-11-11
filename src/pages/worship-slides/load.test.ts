import { afterEach, describe, expect, it, vi } from "vitest";
import { buildNameIndex, parseReference } from "@/pages/citation-generator/parse";
import { fileStem, pictureNames } from "./export";
import { BIBLE, loadPassage, MAX_VERSES } from "./load";
import { DEFAULT_CHOICES, readChoices, readReference, writeParams } from "./options";
import { catalog, serveChapters } from "./test-kit";

const bible = catalog.translations.find((translation) => translation.slug === BIBLE)!;
const index = buildNameIndex(catalog.books);
const read = (text: string) => {
  const parsed = parseReference(text, bible, catalog.books, catalog.equivalent, index);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.reference;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("reading a passage from the Berean", () => {
  it("reads a whole psalm", async () => {
    serveChapters();
    const { verses, cut } = await loadPassage(catalog, read("Psalm 23"));
    expect(verses.map((verse) => verse.verse)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(verses[0].text).toBe("The LORD is my shepherd; I shall not want.");
    expect(cut).toBe(false);
  });

  it("runs across chapters and keeps several passages apart", async () => {
    serveChapters();
    const across = await loadPassage(catalog, read("Gen 1:31-2:3"));
    expect(across.verses.map((verse) => `${verse.chapter}:${verse.verse}`)).toEqual(["1:31", "2:1", "2:2", "2:3"]);
    const two = await loadPassage(catalog, read("Ps 23:6; 91:1-2"));
    expect(two.verses.map((verse) => [verse.part, verse.chapter, verse.verse])).toEqual([[0, 23, 6], [1, 91, 1], [1, 91, 2]]);
  });

  it("cuts a range to the verses the Berean has", async () => {
    serveChapters();
    expect((await loadPassage(catalog, read("John 3:35-99"))).verses.map((verse) => verse.verse)).toEqual([35, 36]);
    expect((await loadPassage(catalog, read("John 3:99"))).verses).toEqual([]);
    expect((await loadPassage(catalog, read("Matthew 17:20-22"))).verses.map((verse) => verse.verse)).toEqual([20, 22]);
  });

  it(`stops at ${MAX_VERSES} verses without reading the rest of the book`, async () => {
    const fetchMock = serveChapters();
    const { verses, cut } = await loadPassage(catalog, read("Psalms 1-150"));
    expect(verses).toHaveLength(MAX_VERSES);
    expect(cut).toBe(true);
    expect(fetchMock.mock.calls.length).toBeLessThan(15);
  });

  it("fails plainly when the files cannot be read", async () => {
    serveChapters({ fail: true });
    // A chapter no other test here reads, so no earlier copy is at hand.
    await expect(loadPassage(catalog, read("Haggai 1"))).rejects.toThrow();
  });
});

describe("the address", () => {
  it("reads known choices and ignores anything else", () => {
    const choices = readChoices(new URLSearchParams("layout=left&font=bold&theme=paper&shape=standard&per=fill&size=small&numbers=1&footer=0&title=0"));
    expect(choices).toEqual({ layout: "left", font: "bold", theme: "paper", shape: "standard", per: "fill", size: "small", numbers: true, footer: false, title: false });
    expect(readChoices(new URLSearchParams("layout=<script>&theme=neon&numbers=yes&size=__proto__"))).toEqual(DEFAULT_CHOICES);
  });

  it("writes only what differs from the defaults, and caps the reference", () => {
    expect(writeParams("Psalm 23", DEFAULT_CHOICES)).toEqual({ ref: "Psalm 23" });
    expect(writeParams("", { ...DEFAULT_CHOICES, theme: "dawn", numbers: true })).toEqual({ theme: "dawn", numbers: "1" });
    expect(readReference(new URLSearchParams(`ref=${"x".repeat(500)}`))).toHaveLength(120);
  });
});

describe("file names", () => {
  it("are made from the reference, safe on every system", () => {
    expect(fileStem("Psalm 23:1–6")).toBe("Psalm-23-1-6");
    expect(fileStem('1 Corinthians 13:4–8 <a>/"b"')).toBe("1-Corinthians-13-4-8-a-b");
    expect(fileStem("::")).toBe("slides");
    expect(pictureNames(["Psalm 23", "Psalm 23:1", "Psalm 23:1"])).toEqual(["01-Psalm-23.png", "02-Psalm-23-1.png", "03-Psalm-23-1.png"]);
  });
});
