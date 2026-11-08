// The tidying, references and format rules of design 4.1 and 6.4, on small hand-made cases.
import { describe, expect, it } from "vitest";
import { p } from "@/data/life-events/types";
import { assemblePassage, offeredOnCards, passageReference, pickerPassages, readHref, tidyPassageText, type ShownPassage } from "./passage";

const names: Record<number, string> = { 6: "Joshua", 21: "Ecclesiastes", 44: "Acts", 46: "1 Corinthians" };
const bookName = (num: number) => names[num];

describe("life-event passages: tidying text cut from a paragraph", () => {
  it("drops a closing quotation mark that never opened, and an opening one that never closes", () => {
    expect(tidyPassageText("for the LORD your God is with you wherever you go.”")).toBe("For the LORD your God is with you wherever you go.");
    expect(tidyPassageText("“May the LORD bless you and keep you;")).toBe("May the LORD bless you and keep you…");
  });
  it("keeps paired quotation marks, and puts the ellipsis inside a closing one", () => {
    expect(tidyPassageText("of which you will say, “I find no pleasure in them,”")).toBe("Of which you will say, “I find no pleasure in them…”");
    expect(tidyPassageText("He said, “Here am I.” So it was.")).toBe("He said, “Here am I.” So it was.");
  });
  it("ends a passage that stops on a comma, colon, semicolon, dash or no mark with an ellipsis", () => {
    for (const ending of [",", ":", ";", "—", ""]) expect(tidyPassageText(`and so on${ending}`)).toBe("And so on…");
    expect(tidyPassageText("It is done!")).toBe("It is done!");
  });
  it("leaves single quotation marks alone, because the same character is the apostrophe", () => {
    expect(tidyPassageText("she shall be called ‘woman,’ for out of man she was taken.")).toBe("She shall be called ‘woman,’ for out of man she was taken.");
  });
});

describe("life-event passages: references and assembly", () => {
  const words: Record<number, string> = {
    44008035: "Then Philip began.", 44008036: "They came to some water.", 44008038: "And he baptized him.",
    21004012: "And though one may be overpowered, two can resist. Moreover, a cord of three strands is not quickly broken.",
    46013007: "It bears all things.", 46013008: "Love never fails. But where there are prophecies, they will cease;",
  };
  const wordsOf = (id: number) => words[id] ?? null;

  it("lists a verse the Berean omits as skipped", () => {
    const passage = p("ACT 8:35-38", "reading", "A note.", { skip: [37] });
    expect(passageReference(passage, bookName)).toBe("Acts 8:35–36, 38");
    expect(assemblePassage(passage, wordsOf)).toBe("Then Philip began. They came to some water. And he baptized him.");
  });
  it("marks a closing excerpt b and an opening one a, and capitalises a b excerpt", () => {
    const closing = p("ECC 4:12b", "card", "A note.", { part: "a cord of three strands is not quickly broken." });
    expect(passageReference(closing, bookName)).toBe("Ecclesiastes 4:12b");
    expect(assemblePassage(closing, wordsOf)).toBe("A cord of three strands is not quickly broken.");
    const opening = p("1CO 13:7-8a", "card", "A note.", { part: "Love never fails." });
    expect(passageReference(opening, bookName)).toBe("1 Corinthians 13:7–8a");
    expect(assemblePassage(opening, wordsOf)).toBe("It bears all things. Love never fails.");
  });
  it("refuses a missing verse rather than printing a gap", () => {
    expect(() => assemblePassage(p("JOS 1:9", "card", "A note."), wordsOf)).toThrow(/no text for verse 6001009/);
  });
  it("refuses a reference it cannot read, and an excerpt without its mark", () => {
    expect(() => p("Psalm 23", "card", "A note.")).toThrow(/cannot read/);
    expect(() => p("JOS 1:9", "card", "A note.", { part: "Be strong" })).toThrow(/excerpt/);
  });
  it("links to the reader at the passage's chapter with its verses shaded", () => {
    expect(readHref(p("ACT 8:35-38", "reading", "A note.", { skip: [37] }), "ACT")).toBe("/read/bsb/ACT/8?hl=35-38");
  });
});

describe("life-event passages: which verses each format offers", () => {
  const shown = (key: string, role: "reading" | "card" | "blessing", length: number): ShownPassage => ({
    key, passage: p("JOS 1:9", role, "A note."), reference: key, text: "x".repeat(length), readHref: "",
  });
  const items = [shown("card", "card", 200), shown("short-blessing", "blessing", 300), shown("long-blessing", "blessing", 400),
    shown("reading", "reading", 600), shown("long-reading", "reading", 900)];
  it("offers card verses and a blessing of 320 characters or fewer on folded and small cards", () => {
    expect(pickerPassages(items, "folded").map((item) => item.key)).toEqual(["card", "short-blessing"]);
    expect(pickerPassages(items, "small").map((item) => item.key)).toEqual(["card", "short-blessing"]);
    expect(items.filter(offeredOnCards).map((item) => item.key)).toEqual(["card", "short-blessing"]);
  });
  it("offers any passage of 700 characters or fewer on the display print, and none on the readings sheet", () => {
    expect(pickerPassages(items, "display").map((item) => item.key)).toEqual(["card", "short-blessing", "long-blessing", "reading"]);
    expect(pickerPassages(items, "readings")).toEqual([]);
  });
});
