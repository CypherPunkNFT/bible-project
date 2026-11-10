// The widget script itself, run in the test window (docs/features/verse-widget/design.md 10, "The script, in jsdom"):
// the real public/widget/v1/verse.js, a fake fetch and a fixed clock.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addDiv, day, fakeFetch, resetWidget, runWidget, setVisibility, settle, widget } from "./widget-kit";

const TODAY = "2026-11-09";
const shadow = (element: Element) => element.shadowRoot!;
const text = (element: Element, selector: string) => shadow(element).querySelector(selector)?.textContent ?? null;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  vi.setSystemTime(new Date(2026, 10, 9, 10, 0, 0));
  setVisibility("visible");
});

afterEach(() => {
  resetWidget();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("verse widget: drawing", () => {
  it("draws today's verse into a Shadow DOM, with the reference and credit linking back in a new tab", async () => {
    const fetch = fakeFetch({ [`/widget/v1/days/${TODAY}.json`]: day(TODAY) });
    const div = addDiv();
    runWidget();
    await settle();
    expect(fetch).toHaveBeenCalledWith(`https://bibleguide.io/widget/v1/days/${TODAY}.json`, { credentials: "omit", referrerPolicy: "no-referrer" });
    expect(text(div, "blockquote")).toBe("Words standing in for one day's verse in the tests.");
    expect(shadow(div).querySelector("blockquote")!.getAttribute("translate")).toBe("no");
    const links = [...shadow(div).querySelectorAll("a")];
    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Genesis 1:1 (BSB)", "https://bibleguide.io/read/bsb/GEN/1?hl=1"],
      ["Bible Guide", "https://bibleguide.io/verse-of-the-day"],
    ]);
    for (const link of links) {
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener");
    }
    expect(text(div, ".heading")).toBe("Verse of the day");
    expect(text(div, ".date")).toMatch(/Monday/);
    expect(shadow(div).querySelector("figure")!.getAttribute("lang")).toBe("en");
  });

  it("shows the characters of any markup in a file, never the markup", async () => {
    fakeFetch({ [`/widget/v1/days/${TODAY}.json`]: day(TODAY, { text: "Grace <b>and</b> peace." }) });
    const div = addDiv();
    runWidget();
    await settle();
    expect(text(div, "blockquote")).toBe("Grace <b>and</b> peace.");
    expect(shadow(div).querySelector("b")).toBeNull();
  });

  it("follows each option, ignores values it does not know, and keeps the defaults", async () => {
    fakeFetch({ [`/widget/v1/days/${TODAY}.json`]: day(TODAY) });
    const plain = addDiv();
    const card = addDiv({ "data-style": "card", "data-theme": "dark", "data-font": "sans", "data-align": "center", "data-heading": "todays-verse", "data-accent": "#6b38a3" });
    const odd = addDiv({ "data-style": "fancy", "data-heading": "<script>", "data-accent": "red;background:url(x)", "data-size": "huge" });
    runWidget();
    await settle();
    expect(shadow(plain).querySelector("figure")!.getAttribute("class")).toBe("plain auto standard site start");
    expect(shadow(card).querySelector("figure")!.getAttribute("class")).toBe("card dark standard sans center");
    expect(text(card, ".heading")).toBe("Today's verse");
    expect((shadow(card).querySelector("figure") as HTMLElement).style.getPropertyValue("--bgv-accent")).toBe("#6b38a3");
    expect(shadow(odd).querySelector("figure")!.getAttribute("class")).toBe("plain auto standard site start");
    expect(text(odd, ".heading")).toBe("Verse of the day");
    expect((shadow(odd).querySelector("figure") as HTMLElement).style.getPropertyValue("--bgv-accent")).toBe("");
    // The colour goes inside the Shadow DOM, never onto the church's own element.
    expect(card.getAttribute("style")).toBeNull();
  });

  it("leaves out the heading when asked, and shows less in the compact size", async () => {
    fakeFetch({ [`/widget/v1/days/${TODAY}.json`]: day(TODAY, { season: { label: "Advent, December 12", link: "/countdowns/advent/dec-12", linkText: "Read today's reading" } }) });
    const none = addDiv({ "data-heading": "none" });
    const compact = addDiv({ "data-size": "compact" });
    const standard = addDiv();
    runWidget();
    await settle();
    expect(text(none, ".heading")).toBeNull();
    expect(text(none, ".date")).not.toBeNull();
    for (const selector of [".heading", ".date", ".season"]) expect(text(compact, selector)).toBeNull();
    expect(text(compact, "blockquote")).not.toBeNull();
    expect(text(standard, ".season")).toBe("Advent, December 12 · Read today's reading");
    expect(shadow(standard).querySelector(".season a")!.getAttribute("href")).toBe("https://bibleguide.io/countdowns/advent/dec-12");
  });

  it("shows no season line on an ordinary day", async () => {
    fakeFetch({ [`/widget/v1/days/${TODAY}.json`]: day(TODAY) });
    const div = addDiv();
    runWidget();
    await settle();
    expect(text(div, ".season")).toBeNull();
  });

  it("takes its origin from its own address, for its requests and its links", async () => {
    const fetch = fakeFetch({ [`/widget/v1/days/${TODAY}.json`]: day(TODAY) }, "http://127.0.0.1:8931");
    const div = addDiv();
    runWidget("http://127.0.0.1:8931/widget/v1/verse.js");
    await settle();
    expect(widget().origin).toBe("http://127.0.0.1:8931");
    expect(fetch.mock.calls[0][0]).toBe(`http://127.0.0.1:8931/widget/v1/days/${TODAY}.json`);
    expect(shadow(div).querySelector(".credit a")!.getAttribute("href")).toBe("http://127.0.0.1:8931/verse-of-the-day");
  });
});

describe("verse widget: once per page", () => {
  it("draws two widgets from one request, and a second copy of the script repeats nothing", async () => {
    const fetch = fakeFetch({ [`/widget/v1/days/${TODAY}.json`]: day(TODAY) });
    const first = addDiv();
    const second = addDiv({ "data-style": "card" });
    runWidget();
    await settle();
    const firstRoot = shadow(first).querySelector("figure");
    runWidget();
    await settle();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(text(second, "blockquote")).not.toBeNull();
    expect(shadow(first).querySelector("figure")).toBe(firstRoot);
  });

  it("lets a second copy draw a div added after the first ran, without asking again", async () => {
    const fetch = fakeFetch({ [`/widget/v1/days/${TODAY}.json`]: day(TODAY) });
    addDiv();
    runWidget();
    await settle();
    const later = addDiv();
    runWidget();
    await settle();
    expect(text(later, "blockquote")).not.toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("leaves the builder page's own previews to the page", async () => {
    fakeFetch({ [`/widget/v1/days/${TODAY}.json`]: day(TODAY) });
    const manual = addDiv({ "data-bibleguide-manual": "" });
    runWidget();
    await settle();
    expect(manual.shadowRoot).toBeNull();
  });
});

describe("verse widget: when something is wrong, the fallback links stay", () => {
  const fallbackStays = async (files: Record<string, unknown>) => {
    fakeFetch(files);
    const div = addDiv();
    runWidget();
    await settle();
    expect(div.shadowRoot).toBeNull();
    expect(div.querySelectorAll("a")).toHaveLength(2);
  };

  it("when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    const div = addDiv();
    runWidget();
    await settle();
    expect(div.shadowRoot).toBeNull();
  });

  it("when the answer is the site's page with status 200", () => fallbackStays({}));

  it("when the JSON is malformed", () => fallbackStays({
    [`/widget/v1/days/${TODAY}.json`]: { body: "{not json" },
    "/widget/v1/pool.json": { body: "[" },
  }));

  it("when a file has an extra field or a wrong type", async () => {
    await fallbackStays({ [`/widget/v1/days/${TODAY}.json`]: { ...day(TODAY), extra: 1 } });
    resetWidget();
    await fallbackStays({ [`/widget/v1/days/${TODAY}.json`]: day(TODAY, { text: 42 }) });
    resetWidget();
    await fallbackStays({ [`/widget/v1/days/${TODAY}.json`]: day(TODAY, { reference: "<script>alert(1)</script>" }) });
  });

  it("when a link points anywhere but the reader or the countdowns", async () => {
    for (const read of ["https://evil.example/", "javascript:alert(1)", "//evil.example/read/", "/read/../../x\"onmouseover"]) {
      await fallbackStays({ [`/widget/v1/days/${TODAY}.json`]: day(TODAY, { read }) });
      resetWidget();
    }
    await fallbackStays({ [`/widget/v1/days/${TODAY}.json`]: day(TODAY, { season: { label: "x", link: "https://evil.example/", linkText: "y" } }) });
  });

  it("when a day file names another date", () => fallbackStays({ [`/widget/v1/days/${TODAY}.json`]: day("2026-11-10") }));

  it("when render() is given a malformed day", async () => {
    fakeFetch({});
    runWidget();
    const div = addDiv({ "data-bibleguide-manual": "" });
    expect(await widget().render(div, { ...day(TODAY), read: "https://evil.example/" })).toBeNull();
    expect(div.shadowRoot).toBeNull();
    expect(await widget().render(div, day("2026-01-01"))).not.toBeNull();
    expect(text(div, "blockquote")).toContain("Words standing in");
  });
});

describe("verse widget: the pool rule when a day file is missing", () => {
  const pool = {
    v: 1, lastDate: "2029-11-09", next: 2,
    entries: ["A", "B", "C", "D"].map((letter) => ({ text: `Verse ${letter}.`, reference: "John 1:1", read: "/read/bsb/JHN/1?hl=1" })),
    longest: day("2027-02-16"),
  };
  const shownFor = async (date: Date) => {
    vi.setSystemTime(date);
    fakeFetch({ "/widget/v1/pool.json": pool });
    const div = addDiv();
    runWidget();
    await settle();
    return text(div, "blockquote");
  };

  it("carries the rotation on past the schedule's end", async () => {
    // The day after the last scheduled day takes the entry at `next`; each day after, the one after that.
    expect(await shownFor(new Date(2029, 10, 10, 9))).toBe("Verse C.");
    resetWidget();
    expect(await shownFor(new Date(2029, 10, 13, 9))).toBe("Verse B.");
  });

  it("gives a date before the schedule a real entry, never a negative index", async () => {
    // 2026-11-09 is 1,096 days before the last date: (2 - 1096 - 1) mod 4 = 1.
    expect(await shownFor(new Date(2026, 10, 9, 9))).toBe("Verse B.");
  });
});

describe("verse widget: keeping current", () => {
  it("fetches the new day when the page comes back after midnight", async () => {
    const fetch = fakeFetch({ [`/widget/v1/days/${TODAY}.json`]: day(TODAY), "/widget/v1/days/2026-11-10.json": day("2026-11-10", { text: "A new day." }) });
    const div = addDiv();
    runWidget();
    await settle();
    setVisibility("hidden", true);
    expect(vi.getTimerCount()).toBe(0);
    vi.setSystemTime(new Date(2026, 10, 10, 8, 0, 0));
    setVisibility("visible", true);
    await settle();
    expect(fetch.mock.calls.map((call) => call[0])).toContain("https://bibleguide.io/widget/v1/days/2026-11-10.json");
    expect(text(div, "blockquote")).toBe("A new day.");
  });

  it("turns over by itself at midnight on a page left open, with one timer", async () => {
    fakeFetch({ [`/widget/v1/days/${TODAY}.json`]: day(TODAY), "/widget/v1/days/2026-11-10.json": day("2026-11-10", { text: "A new day." }) });
    const div = addDiv();
    runWidget();
    await settle();
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(14 * 3600_000 + 61_000);
    await settle();
    expect(text(div, "blockquote")).toBe("A new day.");
    expect(vi.getTimerCount()).toBe(1);
  });

  it("leaves no timer set while the page is hidden", async () => {
    fakeFetch({ [`/widget/v1/days/${TODAY}.json`]: day(TODAY) });
    addDiv();
    setVisibility("hidden");
    runWidget();
    await settle();
    expect(vi.getTimerCount()).toBe(0);
  });
});
