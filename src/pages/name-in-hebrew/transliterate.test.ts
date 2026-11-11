// The spelling rules (design: docs/features/name-in-hebrew/design.md, sections 4 and "Review"): what a typed name is
// cleaned to, the sounds the English rules read, and each script's letters, for names chosen to exercise each rule.
import { describe, expect, it } from "vitest";
import letters from "./letters.json";
import tables from "./sounds.json";
import { cleanName, MAX_NAME } from "./input";
import { nameSounds } from "./sounds";
import { aramaicBySound, aramaicFromHebrew, aramaicScripts, greekBySound, greekLetters, hebrewBySound, hebrewLetters, syriacLetters, withFinalForms, withoutCantillation } from "./transliterate";

const sounds = (name: string) => nameSounds(cleanName(name).words).map((word) => word.join(" ")).join(" | ");
const hebrew = (name: string) => hebrewBySound(nameSounds(cleanName(name).words));
const greek = (name: string) => greekBySound(nameSounds(cleanName(name).words));
const aramaic = (name: string) => aramaicScripts(aramaicBySound(nameSounds(cleanName(name).words)));
const SYRIAC_22 = new Set(Object.keys(letters.syriacNames));

describe("name in Hebrew: what is typed", () => {
  it("keeps Latin letters, spaces, hyphens and apostrophes, and says when it drops anything", () => {
    expect(cleanName("  mary   JANE ")).toEqual({ display: "Mary Jane", words: ["mary", "jane"], dropped: false });
    expect(cleanName("O’Brien")).toMatchObject({ display: "O'Brien", dropped: false });
    expect(cleanName("José")).toMatchObject({ display: "José", words: ["josé"] });
    expect(cleanName("Anna2.com/x")).toMatchObject({ display: "Annacomx", dropped: true });
    expect(cleanName("Дaвид")).toMatchObject({ dropped: true });
    expect(cleanName("Da\u202Evid")).toMatchObject({ display: "David", dropped: true });
    expect(cleanName("")).toEqual({ display: "", words: [], dropped: false });
    expect(cleanName("123")).toEqual({ display: "", words: [], dropped: true });
  });

  it("stops at the letter limit", () => {
    const long = cleanName("a".repeat(MAX_NAME + 10));
    expect([...long.display]).toHaveLength(MAX_NAME);
    expect(long.dropped).toBe(true);
  });
});

describe("name in Hebrew: English spelling to sounds", () => {
  it.each([
    ["Kate", "k ei t"], ["Mike", "m ai k"], ["Luke", "l u k"], ["Riley", "r i l i"], ["Willow", "w i l o"],
    ["Kyle", "k ai l"], ["Tyler", "t ai l e r"], ["Brynn", "b r i n"], ["Hunter", "h a n t e r"], ["Gianna", "j a n a"],
    ["Miles", "m ai l z"], ["Max", "m a k s"], ["Xavier", "z a v i r"], ["Quinn", "k w i n"], ["Knox", "n o k s"],
    ["Ashley", "a sh l i"], ["Paisley", "p ei s l i"], ["Rhys", "r i s"], ["Søren", "s o r e n"],
  ])("%s is read %s", (name, expected) => {
    expect(sounds(name)).toBe(expected);
  });

  it("reads names whose spelling misleads from the common list, accents marking the Spanish ones", () => {
    expect(sounds("Michael")).toBe("m ai k e l");
    expect(sounds("Chloe")).toBe("k l o i");
    expect(sounds("José")).toBe("kh o s e");
    expect(sounds("Jose")).toBe("kh o s e");
    expect(sounds("Jesús")).toBe("kh e s u s");
  });

  it("spells hyphenated parts and two words separately, and drops an apostrophe", () => {
    expect(sounds("Mary-Jane")).toBe("m a r i | j ei n");
    expect(sounds("O'Brien")).toBe("o b r i n");
  });

  it("has a valid sound for every entry of the common list", () => {
    const known = new Set([...Object.keys(tables.hebrew.consonants), ...Object.keys(tables.hebrew.vowels)]);
    const bad = Object.entries(tables.common as Record<string, string>).filter(([, value]) => value.split(" ").some((sound) => !known.has(sound)));
    expect(bad).toEqual([]);
  });
});

describe("name in Hebrew: by sound in each script", () => {
  it.each([
    ["Emma", "אמה", "Εμα", "אמא", "ܐܡܐ"],
    ["Olivia", "אוליביה", "Ολιβια", "אוליביא", "ܐܘܠܝܒܝܐ"],
    ["Kate", "קייט", "Κεϊτ", "קיט", "ܩܝܛ"],
    ["Liam", "ליאם", "Λιαμ", "ליאם", "ܠܝܐܡ"],
    ["Chloe", "קלואי", "Κλοι", "קלואי", "ܩܠܘܐܝ"],
    ["Jackson", "ג׳קסון", "Τζαξον", "גקסון", "ܓܩܣܘܢ"],
    ["Brandon", "ברנדון", "Μπραντον", "ברנדון", "ܒܪܢܕܘܢ"],
    ["Charles", "צ׳רלז", "Τσαρλζ", "צרלז", "ܨܪܠܙ"],
    ["Stephen", "סטיבן", "Στιβεν", "סטיבן", "ܣܛܝܒܢ"],
    ["Philip", "פיליפ", "Φιλιπ", "פיליף", "ܦܝܠܝܦ"],
    ["Josef", "ג׳וסף", "Τζοσεφ", "גוסף", "ܓܘܣܦ"],
  ])("%s", (name, hebrewText, greekText, square, syriac) => {
    expect(hebrew(name)).toBe(hebrewText);
    expect(greek(name)).toBe(greekText);
    expect(aramaic(name)).toEqual({ square, syriac });
  });

  it("writes a final p plain but a final f, m, n and ts in their end forms", () => {
    expect(hebrew("Philip").endsWith("פ")).toBe(true);
    expect(hebrew("Josef").endsWith("ף")).toBe(true);
    expect(withFinalForms("שלומ מנחמ")).toBe("שלום מנחם");
  });

  it("ends a Greek word in a final sigma and leaves no Latin letter in any script", () => {
    expect(greek("Thomas")).toBe("Τομας");
    for (const name of ["Brooklyn", "Xavier", "Quinn", "Zhanna", "Søren", "Yvonne", "Wyatt", "Hailey"]) {
      expect(`${hebrew(name)}${greek(name)}${aramaic(name).square}${aramaic(name).syriac}`).not.toMatch(/[a-z]/i);
      expect([...aramaic(name).syriac.replace(/ /g, "")].every((char) => SYRIAC_22.has(char))).toBe(true);
    }
  });

  it("gives nothing for nothing", () => {
    expect(hebrew("")).toBe("");
    expect(greek("")).toBe("");
    expect(aramaic("")).toEqual({ square: "", syriac: "" });
  });
});

describe("name in Hebrew: Hebrew spellings from the Bible", () => {
  it("keeps the vowel points, drops cantillation, and takes the first of two forms", () => {
    expect(withoutCantillation("עֵ֫דֶן")).toBe("עֵדֶן");
    expect(withoutCantillation("דָּנִיֵּאל, דָּנִאֵל")).toBe("דָּנִיֵּאל");
  });

  it("writes Hebrew letters as Aramaic, a sin as ܣ and a maqaf as a space", () => {
    expect(aramaicFromHebrew("דָּוִד")).toEqual({ square: "דוד", syriac: "ܕܘܕ" });
    expect(aramaicFromHebrew("יִשְׂרָאֵל")).toEqual({ square: "ישראל", syriac: "ܝܣܪܐܠ" });
    expect(aramaicFromHebrew("שָׁאוּל").syriac).toBe("ܫܐܘܠ");
    expect(aramaicFromHebrew("אֲבִי־עַלְבוֹן").square).toBe("אבי עלבון");
  });

  it("names each letter, sin and shin by their dot, and a geresh with its letter", () => {
    expect(hebrewLetters("יִשְׂרָאֵל").map((letter) => letter.name)).toEqual(["yod", "sin", "resh", "alef", "lamed"]);
    expect(hebrewLetters("שָׁלוֹם").map((letter) => letter.name)).toEqual(["shin", "lamed", "vav", "final mem"]);
    expect(hebrewLetters("ג׳ק")).toEqual([{ glyph: "ג׳", name: "gimel with geresh" }, { glyph: "ק", name: "qof" }]);
    expect(greekLetters("Ἰωάννης").map((letter) => letter.name)).toEqual(["iota", "omega", "alpha", "nu", "nu", "eta", "final sigma"]);
    expect(syriacLetters("ܝܫܘܥ").map((letter) => letter.name)).toEqual(["yodh", "shin", "waw", "e"]);
  });
});
