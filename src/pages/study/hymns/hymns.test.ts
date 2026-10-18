import { existsSync, readFileSync } from "node:fs";
import { AMAZING_GRACE, HYMN_GROUPS, isHymnId, metreName, type HymnCollection, type HymnSong, type HymnText } from "@/lib/hymns";

// The pure helpers are always tested. The data assertions need `npm run hymns`, whose output lives in the git-ignored
// data/ folder like all the site's data, so they are skipped where it is absent.
const built = existsSync("data/hymns/collection.json");

describe("hymn addresses", () => {
  it.each([AMAZING_GRACE, "gutenberg-watts-psalms-1-1-blest-is-the-man-who-shuns-the-place"])("accepts %s", (id) => {
    expect(isHymnId(id)).toBe(true);
  });
  it.each([["..", "a parent folder"], ["../creeds/index", "a path"], ["Amazing-Grace", "upper case"], ["a b", "a space"], ["", "empty"]])("rejects %s (%s)", (id) => {
    expect(isHymnId(id)).toBe(false);
  });
});

describe("metre families", () => {
  it.each([["8,6,8,6", "Common Metre"], ["C. M.", "Common Metre"], ["Common Metre", "Common Metre"], ["L. M.", "Long Metre"], ["6.6.8.6", "Short Metre"],
    ["7,7,7,7", "Other metres"], ["", "Not recorded"]])("files %s as %s", (metre, family) => {
    expect(metreName(metre)).toBe(family);
  });
});

describe.runIf(built)("the built hymn data", () => {
  const read = <T,>(path: string): T => JSON.parse(readFileSync(`data/hymns/${path}`, "utf8"));
  const collection = built ? read<HymnCollection>("collection.json") : null;

  it("holds each hymn once, in a known hymn book, with a usable address", () => {
    const ids = collection!.hymns.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const h of collection!.hymns) {
      expect(isHymnId(h.id)).toBe(true);
      expect(HYMN_GROUPS).toContain(h.g);
    }
  });

  it("has the words of every hymn in its book's file", () => {
    const texts = Object.fromEntries(HYMN_GROUPS.map((g) => [g, read<Record<string, HymnText>>(`texts/${g}.json`)]));
    for (const h of collection!.hymns) expect(texts[h.g][h.id]?.stanzas.length ?? 0).toBeGreaterThan(0);
  });

  it("places every hymn on a chapter the Bible has", () => {
    for (const h of collection!.hymns.filter((x) => x.v)) {
      const book = collection!.books[Math.floor(h.v / 1e6) - 1];
      expect(book?.chapters.length ?? 0).toBeGreaterThanOrEqual(Math.floor(h.v / 1e3) % 1000);
    }
  });

  it("has Amazing Grace's study, with every echo on a real line", () => {
    const song = read<HymnSong>(`songs/${AMAZING_GRACE}.json`);
    expect(song.stanzas).toHaveLength(6);
    for (const e of song.echoes) expect(song.stanzas[e.stanza]?.[e.line]).toBeTruthy();
  });

  it("shows Amazing Grace's verses in the BSB, each echo's quotation inside its verse (owner: Scripture shown in the BSB)", () => {
    const song = read<HymnSong & { translation?: string }>(`songs/${AMAZING_GRACE}.json`);
    expect(song.translation).toBe("BSB");
    for (const e of song.echoes) {
      const text = e.verses.map((v) => v.text).join(" ");
      for (const part of e.words.split(" … ")) expect(text).toContain(part);
    }
  });
});
