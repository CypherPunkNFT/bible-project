// Splitting BSB text into words (design §6.1, §13): dashes split, quotes and apostrophes vanish from the compared
// form, and the shown forms always join back into the original text.
import { bsbWords } from "@/lib/bsb-for-tests";
import { isContraction } from "./equivalents";
import { cleanVerse, eligibleText, endMark } from "./passage";
import { firstLetter, normalize, words } from "./words";

describe("verse completion words", () => {
  it("splits an em-dash join into two words and keeps the dash on the left", () => {
    const list = words("my salvation—whom shall I fear?");
    expect(list.map((word) => word.key)).toEqual(["my", "salvation", "whom", "shall", "i", "fear"]);
    expect(list[1].text).toBe("salvation—");
  });

  it("joins a stand-alone dash to the word before and an opening quote to its own word", () => {
    const list = words("He said — “Do not fear,” and left.");
    expect(list[1].text).toBe("said — ");
    expect(list[2].text).toBe("“Do ");
    expect(list[4].text).toBe("fear,” ");
  });

  it("drops quotes and apostrophes from the compared form and lower-cases", () => {
    expect(normalize("“The LORD’s ‘own’ — people’s” & GOD's")).toEqual(["the", "lords", "own", "peoples", "and", "gods"]);
    expect(normalize("naïve 1,000 burnt-offering")).toEqual(["naive", "1000", "burnt", "offering"]);
  });

  it("rejoins the shown forms to the exact BSB text of real verses", () => {
    for (const verse of [{ code: "PSA", chapter: 27, verse: 1 }, { code: "JHN", chapter: 3, verse: 16 }, { code: "ISA", chapter: 40, verse: 31 }]) {
      const text = cleanVerse(bsbWords(verse));
      expect(words(text).map((word) => word.text).join("")).toBe(text);
    }
  });

  it("gives the first letter or digit after normalising", () => {
    const [lords, dont] = words("LORD’s ‘Do");
    expect([firstLetter(lords), firstLetter(dont)]).toEqual(["l", "d"]);
  });

  it("recognises contractions but not possessives, and judges a whole passage", () => {
    expect(["don’t", "I’ll", "it’s", "we’re", "you’ve"].every(isContraction)).toBe(true);
    expect(["God’s", "LORD’s", "its", "peoples’"].some(isContraction)).toBe(false);
    expect(eligibleText("The LORD is my shepherd; I shall not want.")).toBe(9);
    expect(eligibleText("and the LORD is my shepherd; I shall not want.")).toBeNull();
    expect(eligibleText("Do not fear, for I am with you today.")).toBe(9);
    expect(eligibleText("Do not fear, for twelve were counted, 12 in all.")).toBeNull();
    expect(endMark("Who is like You?”")).toBe("?");
  });
});
