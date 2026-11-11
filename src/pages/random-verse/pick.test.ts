import { readFileSync } from "node:fs";
import { afterEach, vi } from "vitest";
import { settleDraw } from "./load";
import { booksFrom, draw, makePool, parseFrom, parseVerseKey, poolSize, themeById, verseKey } from "./pick";
import { catalog, serveChapters } from "./test-kit";
import { THEMES } from "./themes";
import { TOTAL_VERSES, VERSE_COUNTS } from "./verse-counts";

const bsb = catalog.translations.find((translation) => translation.slug === "bsb")!;
const plain = (code: string) => JSON.parse(readFileSync(`data/plain/bsb/${code}.json`, "utf8")) as Record<string, string>;
const books = catalog.books;

afterEach(() => vi.unstubAllGlobals());

describe("random verse: the verse counts", () => {
  it("match the Berean files, chapter by chapter (run scripts/make-random-verse-counts.mjs if not)", () => {
    let total = 0;
    for (const code of Object.keys(bsb.books)) {
      const counts = bsb.books[code].map(() => 0);
      for (const key of Object.keys(plain(code))) counts[bsb.books[code].indexOf(key.split(":")[0])] += 1;
      expect(VERSE_COUNTS[code], code).toEqual(counts);
      total += counts.reduce((sum, n) => sum + n, 0);
    }
    expect(Object.keys(VERSE_COUNTS)).toHaveLength(66);
    expect(TOTAL_VERSES).toBe(total);
    expect(total).toBe(31086);
  });
});

describe("random verse: reading the address", () => {
  it("accepts a verse of the Berean and nothing else", () => {
    expect(parseVerseKey("JHN.3.16")).toEqual({ code: "JHN", chapter: 3, verse: 16 });
    expect(parseVerseKey("1CO.13.04")).toEqual({ code: "1CO", chapter: 13, verse: 4 });
    for (const bad of [null, "", "constructor.1.1", "toString.1.1", "XYZ.1.1", "JHN.22.1", "JHN.0.1", "JHN.3.0", "JHN.3", "jhn.3.16", "JHN.3.16.1", "JHN.3.16xxxxxxxxxxxxxxxx"]) {
      expect(parseVerseKey(bad), String(bad)).toBeNull();
    }
  });

  it("knows the choices it offers and ignores others", () => {
    expect(parseFrom("ot")).toBe("ot");
    expect(parseFrom("nt")).toBe("nt");
    expect(parseFrom("PSA")).toBe("PSA");
    expect(parseFrom("toString")).toBe("");
    expect(parseFrom(null)).toBe("");
    expect(themeById("hope")?.title).toBe("Hope");
    expect(themeById("toString")).toBeUndefined();
  });

  it("covers the whole Bible, each Testament, or one book", () => {
    expect(booksFrom("", books)).toHaveLength(66);
    expect(booksFrom("ot", books)).toHaveLength(39);
    expect(booksFrom("nt", books)).toHaveLength(27);
    expect(booksFrom("nt", books)[0]).toBe("MAT");
    expect(booksFrom("RUT", books)).toEqual(["RUT"]);
  });
});

describe("random verse: drawing", () => {
  const whole = makePool(booksFrom("", books), undefined);

  it("gives every verse the same chance: the draw walks the chapters in order", () => {
    expect(poolSize(whole)).toBe(31086);
    expect(draw(whole, () => 0)).toEqual({ code: "GEN", chapter: 1, nth: 0 });
    expect(draw(whole, () => 31 / 31086)).toEqual({ code: "GEN", chapter: 2, nth: 0 });
    expect(draw(whole, () => 0.9999999)).toEqual({ code: "REV", chapter: 22, nth: 20 });
    const obadiah = makePool(["OBA"], undefined);
    expect(poolSize(obadiah)).toBe(21);
    expect(draw(obadiah, () => 0.5)).toEqual({ code: "OBA", chapter: 1, nth: 10 });
  });

  it("keeps a theme's verses to the books chosen, and draws nothing from an empty pool", () => {
    const hope = themeById("hope")!;
    const hopeNt = makePool(booksFrom("nt", books), hope);
    expect(hopeNt.kind === "theme" && hopeNt.verses.every((ref) => booksFrom("nt", books).includes(ref.code))).toBe(true);
    expect(poolSize(hopeNt)).toBeLessThan(hope.verses.length);
    expect(draw(makePool(booksFrom("", books), hope), () => 0)).toEqual({ code: "ROM", chapter: 15, verse: 13 });
    const none = makePool(["OBA"], themeById("jesus"));
    expect(poolSize(none)).toBe(0);
    expect(draw(none, () => 0)).toBeNull();
  });

  it("finds the verse a draw landed on where the Berean skips a number (Matthew 17:21)", async () => {
    serveChapters();
    expect(await settleDraw(catalog, { code: "MAT", chapter: 17, nth: 19 })).toEqual({ code: "MAT", chapter: 17, verse: 20 });
    expect(await settleDraw(catalog, { code: "MAT", chapter: 17, nth: 20 })).toEqual({ code: "MAT", chapter: 17, verse: 22 });
    expect(await settleDraw(catalog, { code: "MAT", chapter: 17, nth: 25 })).toEqual({ code: "MAT", chapter: 17, verse: 27 });
  });
});

describe("random verse: the themes", () => {
  it("have address-safe, unique names and at least ten verses each", () => {
    expect(new Set(THEMES.map((theme) => theme.id)).size).toBe(THEMES.length);
    for (const theme of THEMES) {
      expect(theme.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
      expect(theme.verses.length, theme.id).toBeGreaterThanOrEqual(10);
      expect(new Set(theme.verses).size, `${theme.id} lists a verse twice`).toBe(theme.verses.length);
    }
  });

  it("quote only verses the Berean has, each one starting a sentence", () => {
    for (const theme of THEMES) {
      for (const key of theme.verses) {
        const ref = parseVerseKey(key);
        expect(ref && verseKey(ref), `${theme.id}: ${key}`).toBe(key);
        const text = plain(ref!.code)[`${ref!.chapter}:${ref!.verse}`];
        expect(text, `${theme.id}: ${key} is not in the BSB`).toBeTruthy();
        expect(text, `${theme.id}: ${key} starts mid-sentence`).toMatch(/^[“‘"A-Z]/);
      }
    }
  });
});
