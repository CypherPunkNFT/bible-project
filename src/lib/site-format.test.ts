import { afterEach, describe, expect, it, vi } from "vitest";
import { chooseSiteLanguage, phrase } from "./page-translator";
import { compareCode, compareText, countWord, countryName, formatDate, formatDateTime, formatList, formatNumber, formatTime, ordinal, plural, pluralKey, siteLocale } from "./site-format";

// Each case reads the site's language when it runs: chooseSiteLanguage changes it, with ui.json served by the stub.
const served: Record<string, Record<string, string>> = {};
const serve = () => vi.stubGlobal("fetch", vi.fn(async (url: string) => {
  const folder = /\/i18n\/(\w+)\//.exec(url)?.[1] ?? "";
  return { ok: true, json: async () => served[folder] ?? {} };
}));
afterEach(async () => {
  await chooseSiteLanguage("en");
  vi.unstubAllGlobals();
});

const BOOK = ["{n} book", "{n} books"] as const;
// Arabic's six forms of "book", by the category Intl.PluralRules gives each count.
const ARABIC_BOOK = { zero: "لا كتب", one: "كتاب واحد", two: "كتابان", few: "{n} كتب", many: "{n} كتابًا", other: "{n} كتاب" };
served.ar = { [pluralKey(...BOOK)]: JSON.stringify(ARABIC_BOOK) };
served.zh = { [pluralKey(...BOOK)]: JSON.stringify({ other: "{n} 本书" }) };
served.es = { [pluralKey(...BOOK)]: JSON.stringify({ one: "{n} libro", many: "{n} de libros", other: "{n} libros" }), "Marked read": "Leído" };
// Hindi's list holds two broken entries: forms with no "other", and a value that is not JSON.
served.hi = { [pluralKey("{n} page", "{n} pages")]: JSON.stringify({ one: "{n} पृष्ठ" }), [pluralKey("{n} line", "{n} lines")]: "not json" };

describe("plural()", () => {
  it("writes English as before: one for 1, the other for every other count, the count in the site's number format", () => {
    expect([0, 1, 2, 1234].map((n) => plural(n, ...BOOK))).toEqual(["0 books", "1 book", "2 books", "1,234 books"]);
    expect(plural(1, "The prophet", "{n} prophets")).toBe("The prophet");
  });

  it("chooses among Arabic's six forms", async () => {
    serve();
    await chooseSiteLanguage("ar");
    expect([0, 1, 2, 3, 11, 100].map((n) => plural(n, ...BOOK))).toEqual(["لا كتب", "كتاب واحد", "كتابان", "3 كتب", "11 كتابًا", "100 كتاب"]);
  });

  it("uses Chinese's single form for every count", async () => {
    serve();
    await chooseSiteLanguage("zh-Hans");
    expect([0, 1, 2, 5].map((n) => plural(n, ...BOOK))).toEqual(["0 本书", "1 本书", "2 本书", "5 本书"]);
  });

  it("shows the English (for the page translator to swap) where a language has no forms for the pair, or bad ones", async () => {
    serve();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await chooseSiteLanguage("hi");
    expect(warn.mock.calls.filter(([message]) => String(message).includes("site-format"))).toHaveLength(2);
    warn.mockRestore();
    expect(plural(2, ...BOOK)).toBe("2 books");
    expect(plural(3, "{n} page", "{n} pages")).toBe("3 pages");
    expect(plural(1, "{n} line", "{n} lines")).toBe("1 line");
  });

  it("keeps plural entries out of the word-for-word swap", async () => {
    serve();
    await chooseSiteLanguage("es");
    expect(phrase(pluralKey(...BOOK), "es")).toBeNull();
    expect(phrase("Marked read", "es")).toBe("Leído");
    expect(plural(1000000, ...BOOK)).toBe("1.000.000 de libros");
  });
});

describe("numbers, dates, sorting, lists and country names follow the site's language", () => {
  const day = new Date(Date.UTC(2026, 10, 6, 15, 30));
  const utc = { timeZone: "UTC" } as const;

  it("in English", () => {
    expect(siteLocale()).toBe("en-u-nu-latn");
    expect(formatNumber(1234567.5)).toBe("1,234,567.5");
    expect(formatDate(day, { ...utc, day: "numeric", month: "long", year: "numeric" })).toBe("November 6, 2026");
    expect(formatDate(day, utc)).toBe("11/6/2026");
    expect(formatTime(day, { ...utc, hour: "numeric", minute: "2-digit" })).toBe("3:30 PM");
    expect(formatDateTime(day, { ...utc, dateStyle: "medium", timeStyle: "short" })).toBe("Nov 6, 2026, 3:30 PM");
    expect(formatList(["Paul", "Silas", "Timothy"])).toBe("Paul, Silas, and Timothy");
    expect(countryName("EG")).toBe("Egypt");
    expect(countryName("not a region")).toBe("not a region");
  });

  it("in Spanish, Hindi and Arabic (digits 0-9, as the language file says)", async () => {
    serve();
    await chooseSiteLanguage("es");
    expect(formatNumber(1234567.5)).toBe("1.234.567,5");
    expect(formatDate(day, { ...utc, day: "numeric", month: "long", year: "numeric" })).toBe("6 de noviembre de 2026");
    expect(formatList(["Pablo", "Silas", "Timoteo"])).toBe("Pablo, Silas y Timoteo");
    expect(countryName("EG")).toBe("Egipto");
    expect(["ñu", "nube", "oso"].sort(compareText)).toEqual(["nube", "ñu", "oso"]);
    await chooseSiteLanguage("hi");
    expect(formatNumber(1234567)).toBe("12,34,567");
    await chooseSiteLanguage("ar");
    expect(siteLocale()).toBe("ar-u-nu-latn");
    expect(formatNumber(1234)).toBe("1,234");
    expect(countryName("EG")).toBe("مصر");
  });

  it("sorts ids and keys the same way in every language", async () => {
    const ids = ["b-2", "B-1", "a-10", "a-9"];
    const english = [...ids].sort(compareCode);
    serve();
    await chooseSiteLanguage("es");
    expect([...ids].sort(compareCode)).toEqual(english);
  });
});

describe("counts written as words, and places in a sequence", () => {
  it("in English: words to ninety-nine, then the number; the ordinal endings", () => {
    expect([0, 2, 11, 20, 47, 99, 100].map((n) => countWord(n))).toEqual(["no", "two", "eleven", "twenty", "forty-seven", "ninety-nine", "100"]);
    expect(countWord(3, true)).toBe("Three");
    expect(plural(2, "Called, as {n} account tells it", "Called, as {n} accounts tell it", "word")).toBe("Called, as two accounts tell it");
    expect(plural(1, "{n} session", "{n} sessions", "first-word")).toBe("One session");
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111].map(ordinal)).toEqual(["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd", "101st", "111th"]);
  });

  it("in another language: the number in its format, for its phrase list to place", async () => {
    serve();
    await chooseSiteLanguage("es");
    expect(countWord(2, true)).toBe("2");
    expect(countWord(1500)).toBe("1500");
    expect(ordinal(3)).toBe("3");
    expect(plural(2, "Called, as {n} account tells it", "Called, as {n} accounts tell it", "word")).toBe("Called, as 2 accounts tell it");
  });
});
