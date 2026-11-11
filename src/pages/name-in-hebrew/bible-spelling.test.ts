// What the page says a name is in the Bible, and the spellings it shows as Scripture's, checked on the real built
// baby-name files (data/baby-names/, git-ignored and built by scripts/bible/build_baby_names.py, as the baby-names tests
// need too) and the Berean Standard Bible's plain text.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { NameDocument, NamesIndex } from "@/data/baby-names";
import aramaicNames from "./aramaic-names.json";
import { bibleCards, findInBible, soundCards, wantsSound, wordCards, type BibleWord } from "./bible-spelling";
import bibleWords from "./bible-words.json";
import hebrewBehind from "./hebrew-behind.json";
import letters from "./letters.json";
import { WORD_TEXT } from "./word-texts";

const index = JSON.parse(readFileSync("data/baby-names/index.json", "utf8")) as NamesIndex;
const nameFile = (slug: string) => JSON.parse(readFileSync(`data/baby-names/names/${slug}.json`, "utf8")) as NameDocument;
const cardsOf = (slug: string) => bibleCards(nameFile(slug));
// Pointed Hebrew compares in one canonical order of its marks (NFC), whatever order a source wrote them in.
const nfc = (text: string) => text.normalize("NFC");
const kinds = (spellings: readonly { kind: string; text: string }[]) => spellings.map((spelling) => nfc(`${spelling.kind}:${spelling.text}`));
const verseText = (reference: string) => {
  const [, book, chapter, verse] = /^(\w{3}) (\d+):(\d+)$/.exec(reference)!;
  return (JSON.parse(readFileSync(`data/plain/bsb/${book}.json`, "utf8")) as Record<string, string>)[`${chapter}:${verse}`] ?? "";
};

describe("name in Hebrew: finding a name in the Bible", () => {
  it("finds a Bible name, another spelling of one, a Bible word, or nothing", () => {
    expect(findInBible(index, "David")).toMatchObject([{ type: "name", row: { s: "david" }, alias: false }]);
    expect(findInBible(index, "Emmanuel")).toMatchObject([{ type: "name", row: { s: "immanuel" }, alias: true, typed: "Emmanuel" }]);
    expect(findInBible(index, "Grace")).toMatchObject([{ type: "word", word: { keys: ["grace"] } }]);
    expect(findInBible(index, "Yahweh")).toMatchObject([{ type: "word", word: { kind: "god" } }]);
    expect(findInBible(index, "Emma")).toEqual([{ type: "none", typed: "Emma" }]);
  });

  it("looks up each word of a name the Bible does not have whole", () => {
    const found = findInBible(index, "John Mark");
    expect(found.map((entry) => entry.type)).toEqual(["name", "name"]);
    expect(findInBible(index, "Mary Magdalene")).toHaveLength(1);
    expect(findInBible(index, "Emma Grace").map((entry) => entry.type)).toEqual(["none", "word"]);
  });

  it("never spells a name of God, or Jesus as the Bible spells it, by sound", () => {
    const god = findInBible(index, "God");
    expect(wantsSound(god, ["god"])).toBe(false);
    expect(wantsSound(findInBible(index, "Jesus"), ["jesus"])).toBe(false);
    expect(wantsSound(findInBible(index, "Jesus"), ["jesús"])).toBe(true);
    expect(wantsSound(findInBible(index, "Grace"), ["grace"])).toBe(true);
    expect(soundCards([]).hebrew).toEqual([]);
  });
});

describe("name in Hebrew: Scripture's own spellings", () => {
  it("gives a Hebrew name its Hebrew, its Greek form and its letters in Aramaic", () => {
    const david = cardsOf("david");
    expect(kinds(david.hebrew)).toEqual([nfc("bible:דָּוִד")]);
    expect(kinds(david.greek)).toEqual([nfc("bible:Δαυείδ")]);
    expect(david.aramaic).toMatchObject([{ kind: "letters", text: "דוד", syriac: "ܕܘܕ" }]);
  });

  it("gives a New Testament name its Greek and the Hebrew name behind it, named", () => {
    const john = cardsOf("john");
    expect(kinds(john.greek)).toEqual([nfc("bible:Ἰωάννης")]);
    expect(john.hebrew).toMatchObject([{ kind: "behind", text: "יוֹחָנָן", name: "Johanan", strongs: "H3110" }]);
    expect(cardsOf("james").hebrew).toMatchObject([{ kind: "behind", name: "Jacob" }]);
    expect(cardsOf("mary").hebrew).toMatchObject([{ kind: "behind", name: "Miriam" }]);
  });

  it("gives Jesus, Peter, Thomas and Tabitha the Aramaic names Scripture gives them", () => {
    const jesus = cardsOf("jesus");
    expect(jesus.hebrew).toMatchObject([{ kind: "behind", text: "יֵשׁוּעַ", name: "Yeshua", strongs: "H3442", ref: "NEH 8:17" }]);
    expect(jesus.aramaic).toMatchObject([{ kind: "aramaic-name", text: "ישוע", syriac: "ܝܫܘܥ" }]);
    expect(cardsOf("peter").aramaic).toMatchObject([{ kind: "aramaic-name", name: "Cephas", syriac: "ܟܐܦܐ", ref: "JHN 1:42" }]);
    expect(cardsOf("cephas").aramaic).toMatchObject([{ kind: "aramaic-name", name: "Cephas" }]);
    expect(cardsOf("thomas").aramaic).toMatchObject([{ kind: "aramaic-name", syriac: "ܬܐܘܡܐ" }]);
    expect(cardsOf("tabitha").aramaic).toMatchObject([{ kind: "aramaic-name", syriac: "ܛܒܝܬܐ" }]);
    expect(cardsOf("peter").hebrew).toEqual([]);
  });

  it("never shows a common noun as the Hebrew name behind a Greek one", () => {
    expect(cardsOf("melchi").hebrew).toEqual([]);
    expect(Object.keys(hebrewBehind)).not.toContain("H4428");
  });

  it("uses a name file's own Hebrew before Strong's chain (Amos, not Amoz)", () => {
    expect(kinds(cardsOf("amos").hebrew)[0]).toBe(nfc("bible:עָמוֹס"));
  });

  it("takes the first of two forms and shows at most one other person's spelling", () => {
    expect(kinds(cardsOf("daniel").hebrew)[0]).toBe(nfc("bible:דָּנִיֵּאל"));
    const moses = cardsOf("moses");
    expect(moses.hebrew.filter((spelling) => spelling.kind === "also").length).toBeLessThanOrEqual(1);
    for (const slug of ["adam", "hadad", "rahab", "noah", "joshua"]) {
      const cards = cardsOf(slug);
      expect([...cards.hebrew, ...cards.greek].filter((spelling) => spelling.kind === "also").length, slug).toBeLessThanOrEqual(1);
    }
  });

  it("copes with a name file that has no originals", () => {
    expect(bibleCards({ originals: [] })).toEqual({ hebrew: [], greek: [], aramaic: [] });
  });
});

describe("name in Hebrew: the data built once", () => {
  it("keeps only Hebrew letters and points in the Hebrew names behind Greek ones", () => {
    for (const { word } of Object.values(hebrewBehind)) expect(word).toMatch(/^[\u0591-\u05C7\u05D0-\u05EA ]+$/u);
  });

  it("gives every Bible word a verse that uses it in the Berean Standard Bible, and a line on the page", () => {
    const englishIn: Record<string, string> = { god: "God", lord: "LORD", christ: "Messiah", christian: "Christians", grace: "grace", faith: "faith", hope: "hope", joy: "joy", peace: "Peace", love: "love", amen: "Amen", hosanna: "Hosanna", selah: "Selah" };
    for (const word of bibleWords as BibleWord[]) {
      const key = word.keys[0];
      expect(verseText(word.ref), word.ref).toContain(englishIn[key]);
      expect(WORD_TEXT[key], key).toBeTruthy();
      expect(word.hebrew ?? word.greek, key).toBeTruthy();
    }
    expect(wordCards((bibleWords as BibleWord[])[0]).hebrew[0].text).toBe("אֱלֹהִים");
    expect((bibleWords as BibleWord[]).find((word) => word.keys.includes("yhwh"))?.hebrew?.word).toBe("יהוה");
  });

  it("gives every hand-checked Aramaic name a verse that names it, and only the 22 Syriac letters", () => {
    const syriac = new Set(Object.keys(letters.syriacNames));
    for (const entry of Object.values(aramaicNames.names)) {
      expect([...entry.syriac].every((char) => syriac.has(char)), entry.name).toBe(true);
      expect(verseText(entry.ref), entry.ref).toMatch(entry.name === "Yeshua" ? /Joshua/ : new RegExp(entry.name));
    }
  });
});
