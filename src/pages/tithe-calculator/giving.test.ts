// The tithe calculator's sums and parsing (design sections 2 and 8), and that every passage's verse id holds the words
// it is chosen for in the project's own copy of the Berean.
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MAX_AMOUNT, TIMES_A_YEAR, formatMoney, formatPercent, giving, parseAmount, parseNumber, parsePercent } from "./giving";
import { PASSAGES } from "./passages";

describe("giving", () => {
  it("counts each way income comes over a year", () => {
    expect(TIMES_A_YEAR).toEqual({ week: 52, "two-weeks": 26, "half-month": 24, month: 12, year: 1 });
  });

  it("works out a tenth of 1,000 a week by week, month, year and pay", () => {
    const sums = giving(1000, "week", 10);
    expect(sums.yearlyIncome).toBe(52_000);
    expect(sums.perYear).toBe(5200);
    expect(sums.perWeek).toBe(100);
    expect(sums.perMonth).toBeCloseTo(433.333, 3);
    expect(sums.perPay).toBe(100);
  });

  it("takes any percentage and any period", () => {
    expect(giving(4000, "month", 12.5).perYear).toBe(6000);
    expect(giving(2000, "two-weeks", 10).perPay).toBe(200);
    expect(giving(2500, "half-month", 10).perMonth).toBe(500);
    expect(giving(60_000, "year", 15).perWeek).toBeCloseTo(173.077, 3);
  });
});

describe("reading an amount", () => {
  it.each([
    ["1000", 1000], ["1,000", 1000], ["1,000.50", 1000.5], ["1.000,50", 1000.5], ["1 000", 1000], ["1 000", 1000], ["1 000", 1000], ["1'000.25", 1000.25], ["$1,000", 1000], ["1.000 €", 1000], ["1000,5", 1000.5], ["1000.55", 1000.55],
    ["2,500.50", 2500.5], ["1,234", 1234], ["1.234", 1234], ["1,234,567.89", 1_234_567.89], ["1.234.567,89", 1_234_567.89],
    ["0.500", 0.5], ["0,125", 0.125], [".5", 0.5], ["1234.567", 1234.567], [" 750 ", 750],
  ])("reads %j as %d", (text, value) => {
    expect(parseNumber(text.trim())).toBe(value);
  });

  it.each(["", "abc", "-5", "1e3", "1,0005", "1,23,456", "1.5.5", "1,000,00", "1,000.000,5", "١٠٠٠", ",", "12a", "1 2"])("refuses %j", (text) => {
    expect(parseAmount(text)).toBeNull();
  });

  it("takes an income above zero up to a trillion", () => {
    expect(parseAmount("0")).toBeNull();
    expect(parseAmount("1,000,000,000,000")).toBe(MAX_AMOUNT);
    expect(parseAmount("1,000,000,000,001")).toBeNull();
  });
});

describe("reading a percentage", () => {
  it.each([["10", 10], ["12.5", 12.5], ["12,5", 12.5], ["10%", 10], ["10 %", 10], ["100", 100], ["0.25", 0.25], ["99.99", 99.99]])("reads %j as %d", (text, value) => {
    expect(parsePercent(text)).toBe(value);
  });

  it.each(["", "0", "100.5", "101", "12.345", "-10", "ten", "1,000"])("refuses %j", (text) => {
    expect(parsePercent(text)).toBeNull();
  });
});

describe("writing amounts", () => {
  it("uses the currency's own decimals, or two with no currency sign", () => {
    expect(formatMoney(433.3333, "USD")).toBe("$433.33");
    expect(formatMoney(433.3333, "JPY")).toBe("¥433");
    expect(formatMoney(433.3333, "")).toBe("433.33");
    expect(formatMoney(5200, "")).toBe("5,200.00");
    expect(formatPercent(12.5)).toBe("12.5%");
    expect(formatPercent(10)).toBe("10%");
  });

  it("falls back to a plain number for a currency code the browser refuses", () => {
    expect(formatMoney(10, "NOT-A-CODE")).toBe("10.00");
  });
});

// Each passage's first verse, in the project's copy of the Berean, holds the word it is chosen for.
const CHOSEN_FOR: Record<number, RegExp> = {
  1014020: /\ba tenth\b/i, 1028022: /\ba tenth\b/i, 3027030: /\btithe\b/i, 39003010: /\bfull tithe\b/i, 40023023: /\btithes\b/i,
  41012043: /\bpoor widow\b/i, 44020035: /\bmore blessed to give\b/i, 46016002: /\bportion of his income\b/i,
  47008012: /\baccording to what one has\b/i, 47009007: /\bcheerful giver\b/i,
};
const BOOK_CODES: Record<number, string> = { 1: "GEN", 3: "LEV", 39: "MAL", 40: "MAT", 41: "MRK", 44: "ACT", 46: "1CO", 47: "2CO" };

describe.skipIf(!existsSync("data/plain/bsb/MAL.json"))("the passages in the Berean Standard Bible", () => {
  it("has a check for every passage", () => {
    expect(PASSAGES.map((passage) => passage.from).sort()).toEqual(Object.keys(CHOSEN_FOR).map(Number).sort());
  });

  it.each(PASSAGES.map((passage) => [passage.from]))("verse %d holds the words it is chosen for", (from) => {
    const code = BOOK_CODES[Math.floor(from / 1_000_000)];
    const plain = JSON.parse(readFileSync(`data/plain/bsb/${code}.json`, "utf8")) as Record<string, string>;
    const verse = plain[`${Math.floor(from / 1000) % 1000}:${from % 1000}`];
    expect(verse).toMatch(CHOSEN_FOR[from]);
  });
});
