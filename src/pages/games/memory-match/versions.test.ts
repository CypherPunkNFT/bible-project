// Memory card match, the Places and Verses versions (versions.ts): fair boards from their shipped files at every deck
// and difficulty, verse halves that match the build's split of the same BSB text (verse-cards.ts against
// scripts/memory-match/mm_verses.py, through the review sheet it writes), and the version records kept apart.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import placesRaw from "@/data/memory-match/places.json";
import versesRaw from "@/data/memory-match/verses.json";
import { BOARD_PAIRS, DIFFICULTIES, drawPairs, poolFor, seededRng, type Difficulty, type PairsFile } from "./deal";
import { verseHalves, verseWords, versesAsPairs, type VersesFile } from "./verse-cards";
import { VERSIONS, isVersionKey, recordDeck, versionOf } from "./versions";

const places = placesRaw as unknown as PairsFile;
const versesFile = versesRaw as unknown as VersesFile;
const verses = versesAsPairs(versesFile);
const DRAWS = 300;

function checkBoard(data: PairsFile, ids: string[], difficulty: Difficulty, label: string) {
  const byId = new Map(data.pairs.map((pair) => [pair.id, pair]));
  const pairs = ids.map((id) => byId.get(id)!);
  expect(pairs.every(Boolean), `${label}: an unknown pair`).toBe(true);
  expect(pairs.length, label).toBe(BOARD_PAIRS[difficulty]);
  expect(new Set(pairs.map((p) => p.who)).size, `${label}: the same ${data === places ? "place" : "verse"} twice`).toBe(pairs.length);
  expect(new Set(pairs.map((p) => data.characters[p.who].first)).size, `${label}: a shared first name (Caesarea)`).toBe(pairs.length);
  for (const a of pairs) {
    if (difficulty === "hard") expect(a.notOnHard, `${label}: ${a.id} is not for Hard`).not.toBe(true);
    for (const b of pairs) if (a !== b) expect(a.notWith.includes(b.who), `${label}: ${a.who} must not meet ${b.who}`).toBe(false);
  }
}

describe.each([["Places", places], ["Verses", verses]] as const)("the %s version", (name, data) => {
  it("offers every deck at every difficulty", () => {
    for (const deck of data.decks) for (const difficulty of DIFFICULTIES) expect(deck.offered[difficulty], `${deck.key} ${difficulty}`).toBe(true);
  });
  for (const deck of data.decks) {
    for (const difficulty of DIFFICULTIES) {
      it(`draws ${DRAWS} fair ${difficulty} boards from ${deck.title}`, () => {
        const rng = seededRng(name.length * 104729 + deck.key.length * 7919 + difficulty.length);
        const pool = new Set(poolFor(data, deck.key, difficulty).map((p) => p.id));
        for (let n = 0; n < DRAWS; n += 1) {
          const ids = drawPairs(data, deck.key, difficulty, [], rng);
          expect(ids.every((id) => pool.has(id))).toBe(true);
          checkBoard(data, ids, difficulty, `${name} ${deck.key} ${difficulty} #${n}`);
        }
      });
    }
  }
});

describe("verse halves", () => {
  const site = join(__dirname, "..", "..", "..", "..");
  const bsb = new Map<string, Record<string, string>>();
  const verseText = (book: string, chapter: number, verse: number) => {
    if (!bsb.has(book)) bsb.set(book, JSON.parse(readFileSync(join(site, "data", "plain", "bsb", `${book}.json`), "utf-8")));
    const text = bsb.get(book)![`${chapter}:${verse}`];
    if (text === undefined) throw new Error(`the BSB has no ${book} ${chapter}:${verse}`);
    return text.replace(/^¶\s*/, "").replace(/\s+/g, " ").trim(); // as src/lib/verses.ts serves it
  };
  // The build's own halves, as its review sheet prints them: | # | BOOK c:v | first … | … second | ...
  const sheet = new Map(readFileSync(join(site, "docs", "features", "memory-match", "verses-review-sheet.md"), "utf-8")
    .split("\n").map((line) => line.split(" | "))
    .filter((cells) => /^[1-3A-Z]{3} \d+:\d+$/.test(cells[1] ?? ""))
    .map((cells) => [cells[1], [cells[2], cells[3]] as const]));

  it("splits every shipped verse as the build did", () => {
    expect(sheet.size).toBe(versesFile.verses.length);
    for (const row of versesFile.verses) {
      const [, book, chapter, verse] = /^\/read\/bsb\/([1-3A-Z]{3})\/(\d+)\?hl=(\d+)$/.exec(row.readerHref)!;
      const text = verseText(book, Number(chapter), Number(verse));
      const words = verseWords(text);
      expect(row.split > 0 && row.split < words.length, `${row.ref}: split ${row.split} of ${words.length} words`).toBe(true);
      expect(verseHalves(text, row.split), row.ref).toEqual(sheet.get(`${book} ${chapter}:${verse}`));
    }
  });

  it("drops quotation marks but keeps apostrophes", () => {
    expect(verseWords("Jesus said, “Do not be afraid.’ It’s I.”")).toEqual(["Jesus", "said,", "Do", "not", "be", "afraid.", "It’s", "I."]);
  });

  it("still splits a verse whose text changed so the stored split no longer fits", () => {
    expect(verseHalves("One two three four", 9)).toEqual(["One two …", "… three four"]);
  });
});

describe("the versions", () => {
  it("name two different sides with their own designs", () => {
    const arts = VERSIONS.flatMap((version) => [version.sides.who.art, version.sides.story.art]);
    expect(new Set(arts).size).toBe(arts.length);
  });

  it("keep the people version's records under their old keys and the others apart", () => {
    expect(recordDeck("people", "mixed")).toBe("mixed");
    expect(recordDeck("places", "mixed")).toBe("places/mixed");
    expect(recordDeck("verses", "mixed")).not.toBe(recordDeck("places", "mixed"));
  });

  it("know their own keys only", () => {
    expect(VERSIONS.every((version) => isVersionKey(version.key) && versionOf(version.key) === version)).toBe(true);
    expect(isVersionKey("songs")).toBe(false);
  });
});

describe("the start screen's tiles", () => {
  it("draw every deck of every version", async () => {
    const people = (await import("@/data/memory-match/pairs.json")).default as unknown as PairsFile;
    const files = { people, places, verses } as const;
    for (const version of VERSIONS) {
      const keys = files[version.key].decks.map((deck) => deck.key);
      expect(Object.keys(version.decks).sort(), version.key).toEqual([...keys].sort());
    }
  });
});
