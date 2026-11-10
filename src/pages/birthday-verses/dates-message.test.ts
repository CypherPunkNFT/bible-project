// Birthday addresses, the calendar around a date, and the text message (docs/features/birthday-verses/design.md 3.2,
// 5.2, 7.3, 9.2). Pure functions, no page.
import { describe, expect, it } from "vitest";
import { birthdayVersePaths } from "@/data/birthday-verses";
import { allBirthdayDates, birthdayUrl, dateFromSlug, datePath, monthDates, monthFromSlug, monthPath, neighbours, todayOf } from "./dates";
import { dateName, monthName } from "./format";
import { birthdayMessage, cleanName, mailtoHref, smsHref } from "./message";
import { HONEST_LINE, kindLine } from "./verse";

describe("birthday verses: addresses", () => {
  it("round-trips every one of the 366 dates through its address", () => {
    for (const date of allBirthdayDates()) expect(dateFromSlug(datePath(date).split("/").pop()!), date).toBe(date);
    expect(datePath("03-16")).toBe("/birthday-verses/march-16");
    expect(datePath("02-29")).toBe("/birthday-verses/february-29");
    expect(datePath("01-01")).toBe("/birthday-verses/january-1");
    expect(birthdayUrl("03-16")).toBe("https://bibleguide.io/birthday-verses/march-16");
  });

  it("reads a date written another way, and nothing that is not a date", () => {
    for (const slug of ["march-16", "mar-16", "03-16", "3-16", "16-march", "march16", "MARCH-16", "Mar-16", "16-Mar"]) expect(dateFromSlug(slug), slug).toBe("03-16");
    for (const slug of ["february-30", "april-31", "march-32", "march-0", "smarch-1", "", "..", "../march-16", "316", "march", "13-16", "march-16-17"]) {
      expect(dateFromSlug(slug), slug).toBeNull();
    }
  });

  it("reads a month by its name, short name or number", () => {
    expect(monthPath(3)).toBe("/birthday-verses/march");
    for (const slug of ["march", "mar", "3", "03", "March"]) expect(monthFromSlug(slug), slug).toBe(3);
    for (const slug of ["", "smarch", "13", "0", "..", "march-16"]) expect(monthFromSlug(slug), slug).toBeNull();
  });

  it("lists 379 addresses for the sitemap: the hub, 12 months and 366 dates, each once", () => {
    const paths = birthdayVersePaths();
    expect(paths).toHaveLength(379);
    expect(new Set(paths).size).toBe(379);
    expect(paths).toContain("/birthday-verses");
    expect(paths).toContain("/birthday-verses/december");
    expect(paths).toContain("/birthday-verses/february-29");
  });
});

describe("birthday verses: the calendar", () => {
  it("wraps the year and walks through 29 February", () => {
    expect(neighbours("01-01")).toEqual({ previous: "12-31", next: "01-02" });
    expect(neighbours("12-31")).toEqual({ previous: "12-30", next: "01-01" });
    expect(neighbours("02-28").next).toBe("02-29");
    expect(neighbours("02-29")).toEqual({ previous: "02-28", next: "03-01" });
  });

  it("knows each month's dates, February with 29", () => {
    expect(monthDates(2)).toHaveLength(29);
    expect(monthDates(4)).toHaveLength(30);
    expect(monthDates(12)).toHaveLength(31);
    expect(monthDates(3)[15]).toBe("03-16");
  });

  it("names dates without a year or a time zone, 29 February included", () => {
    expect(dateName("03-16")).toBe("March 16");
    expect(dateName("02-29")).toBe("February 29");
    expect(monthName(12)).toBe("December");
    expect(todayOf(new Date(2028, 1, 29, 23, 59))).toBe("02-29");
    expect(todayOf(new Date(2026, 11, 31, 0, 1))).toBe("12-31");
  });

  it("says where each kind of number comes from", () => {
    expect(kindLine("03-16", { from: 43_003_016, role: "card", note: "" })).toBe("Chapter 3, verse 16: the 3rd month and the 16th day.");
    expect(kindLine("07-31", { from: 19_031_007, role: "card", note: "" })).toBe("Chapter 31, verse 7: the day and the month of July 31.");
    expect(kindLine("08-29", { from: 47_013_014, role: "card", note: "" })).toMatch(/^No verse numbered for this date fits/);
    expect(HONEST_LINE).toContain("not as signs");
  });
});

describe("birthday verses: the text message", () => {
  const verse = { text: "For God so loved the world.", reference: "John 3:16", url: "https://bibleguide.io/birthday-verses/march-16" };

  it("greets by name when one is given, and stands on its own with the verse and the link", () => {
    expect(birthdayMessage({ ...verse, name: "Anna" })).toBe(
      "Happy birthday, Anna! A verse for your day:\n\n“For God so loved the world.” John 3:16 (BSB)\n\nhttps://bibleguide.io/birthday-verses/march-16");
    expect(birthdayMessage({ ...verse, name: "  " }).split("\n")[0]).toBe("Happy birthday! A verse for your day:");
  });

  it("falls back to the reference and link when the words could not be loaded", () => {
    expect(birthdayMessage({ ...verse, text: "", name: "" })).toBe("Happy birthday! A verse for your day:\n\nJohn 3:16 (BSB)\n\nhttps://bibleguide.io/birthday-verses/march-16");
  });

  it("keeps the name to one tidy line of at most 40 characters, and never in the link", () => {
    expect(cleanName("  Anna\n  Marie ")).toBe("Anna Marie");
    expect([...cleanName("x".repeat(80))]).toHaveLength(40);
    const message = birthdayMessage({ ...verse, name: "Anna & Sam?" });
    expect(message.split("\n\n")[2]).toBe(verse.url);
    expect(message.split("\n\n")[2]).not.toContain("Anna");
  });

  it("encodes the message into mailto: and sms: addresses with no recipient", () => {
    const body = birthdayMessage({ ...verse, name: "Anna & Sam?" });
    expect(mailtoHref("Happy birthday", body)).toBe(`mailto:?subject=Happy%20birthday&body=${encodeURIComponent(body)}`);
    expect(mailtoHref("Happy birthday", body)).not.toMatch(/[ &?]Sam/);
    expect(smsHref(body)).toBe(`sms:?&body=${encodeURIComponent(body)}`);
  });
});
