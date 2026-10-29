import { describe, expect, it } from "vitest";
import { languageCodes, languageLabel, type LanguageField } from "./acquired";

// 3,769 campaign records store their language as a list (["en"]); every reader must take one code or a list.
describe("language field", () => {
  it("reads one code or a list the same way", () => {
    expect(languageLabel("en")).toBe("English");
    expect(languageLabel(["en"])).toBe("English");
    expect(languageCodes("en")).toEqual(["en"]);
    expect(languageCodes(["en"])).toEqual(["en"]);
  });

  it("names every language of a list once, keeping unknown codes as written", () => {
    expect(languageLabel(["en", "lat", "eng"])).toBe("English, Latin");
    expect(languageLabel([" EN ", "mul"])).toBe("English, mul");
    expect(languageCodes(["en", " en ", "", "la"])).toEqual(["en", "la"]);
  });

  it("treats empty, unrecorded and malformed values as unrecorded rather than failing", () => {
    for (const value of [undefined, null, "", "  ", "und", [], ["und"], ["", "und"]] as LanguageField[]) {
      expect(languageLabel(value)).toBe("Language unrecorded");
    }
    // Data from JSON is not checked against the type: numbers, objects and nested lists must not throw.
    for (const value of [7, { code: "en" }, [7, null, ["en"]]] as unknown as LanguageField[]) {
      expect(languageCodes(value)).toEqual([]);
      expect(languageLabel(value)).toBe("Language unrecorded");
    }
    expect(languageCodes([7, "en"] as unknown as LanguageField)).toEqual(["en"]);
  });

  it("does not take built-in object names for language names", () => {
    expect(languageLabel("constructor")).toBe("constructor");
    expect(languageLabel(["toString"])).toBe("toString");
  });
});
